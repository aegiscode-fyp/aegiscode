// Runs `semgrep --test` on AegisCode's bundled rules, offline in Docker, and fails on anything
// that is not a clean pass. `semgrep --test` exits 0 even when a rule file cannot be loaded,
// so its JSON report is checked here instead of trusting the exit code.
//   npm run test:rules -w @aegiscode/engine-sast
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SEMGREP_IMAGE = "semgrep/semgrep:1.185.0";
// Fake tokens in test files contain this break so GitHub push protection does not block them.
const FAKE_TOKEN_BREAK = "%%";
const rulesDir = fileURLToPath(new URL("../rules/", import.meta.url));

const workDir = mkdtempSync(join(tmpdir(), "aegiscode-rules-"));
cpSync(rulesDir, join(workDir, "rules"), { recursive: true });
for (const entry of readdirSync(join(workDir, "rules"), { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || entry.name.endsWith(".yaml")) continue;
  const file = join(entry.parentPath, entry.name);
  writeFileSync(file, readFileSync(file, "utf8").replaceAll(FAKE_TOKEN_BREAK, ""));
}

const result = spawnSync(
  "docker",
  [
    "run", "--rm", "--network", "none", "-v", `${workDir}:/src:ro`, "-w", "/src", SEMGREP_IMAGE,
    "semgrep", "--test", "--json", "--metrics=off", "--disable-version-check", "rules",
  ],
  { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
);
rmSync(workDir, { recursive: true, force: true });

if (result.error) {
  console.error(`test-rules: could not start Docker (${result.error.message}). Install and start Docker.`);
  process.exit(1);
}

let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  console.error("test-rules: Semgrep did not produce a test report. Its output:");
  console.error(result.stderr.split("\n").slice(-15).join("\n"));
  process.exit(1);
}

const problems = [];
for (const { filename } of report.config_with_errors) {
  problems.push(`${filename}: rule file could not be loaded (run semgrep scan --config on it to see why)`);
}
for (const filename of report.config_missing_tests) {
  problems.push(`${filename}: has no test file`);
}

let ruleCount = 0;
for (const { checks } of Object.values(report.results)) {
  for (const [ruleId, check] of Object.entries(checks)) {
    ruleCount += 1;
    const files = Object.entries(check.matches);
    for (const [file, { expected_lines: expected, reported_lines: reported }] of files) {
      const missed = expected.filter((line) => !reported.includes(line));
      const extra = reported.filter((line) => !expected.includes(line));
      if (missed.length) problems.push(`${ruleId}: missed lines ${missed.join(", ")} in ${file}`);
      if (extra.length) problems.push(`${ruleId}: unexpected findings on lines ${extra.join(", ")} in ${file}`);
    }
    if (check.errors.length) {
      problems.push(`${ruleId}: ${check.errors.length} Semgrep error(s): ${check.errors[0].message.split("\n")[0]}`);
    }
    if (!files.some(([, match]) => match.expected_lines.length > 0)) {
      problems.push(`${ruleId}: has no "ruleid:" test line`);
    }
  }
}
if (result.status !== 0 && problems.length === 0) {
  problems.push(`semgrep --test exited with code ${result.status}`);
}

if (problems.length) {
  console.error(`test-rules: ${problems.length} problem(s) in ${ruleCount} rules:`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`test-rules: all ${ruleCount} rules passed their tests (${SEMGREP_IMAGE}, offline).`);
