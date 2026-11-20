import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { DependencyError, ScanFailedError } from "@aegiscode/core";
import { describe, expect, it } from "vitest";
import { SastEngine } from "./SastEngine.js";
import type { SemgrepRunner } from "./SemgrepRunner.js";
import { SemgrepRunnerResolver } from "./SemgrepRunnerResolver.js";

const RULES_DIR = fileURLToPath(new URL("../rules/", import.meta.url));
const fixture = await readFile(new URL("./__fixtures__/semgrep-output.json", import.meta.url), "utf8");

/** Hands out a fixed runner, so no Semgrep or Docker is needed. */
class FixedResolver extends SemgrepRunnerResolver {
  constructor(private readonly runner: SemgrepRunner) {
    super();
  }
  override async resolve(): Promise<SemgrepRunner> {
    return this.runner;
  }
}

function runnerReturning(output: () => Promise<string>): SemgrepRunner {
  return { kind: "local", run: output };
}

describe("SastEngine", () => {
  it("scans with the runner and normalizes the output", async () => {
    const engine = new SastEngine({ rulesDir: RULES_DIR, resolver: new FixedResolver(runnerReturning(async () => fixture)) });
    await engine.checkPrerequisites();
    const { findings, warnings } = await engine.scan("/work/shop");
    expect(findings.map((finding) => finding.vulnerabilityType).sort()).toEqual(["sql-injection", "xss"]);
    expect(warnings).toHaveLength(1);
  });

  it("reports a missing ruleset as DEPENDENCY_UNAVAILABLE", async () => {
    const engine = new SastEngine({
      rulesDir: "/definitely/not/here",
      resolver: new FixedResolver(runnerReturning(async () => fixture)),
    });
    await expect(engine.checkPrerequisites()).rejects.toBeInstanceOf(DependencyError);
  });

  it("passes a failed Semgrep run on instead of returning no findings", async () => {
    const failing = runnerReturning(async () => {
      throw new ScanFailedError("Semgrep exited with code 2");
    });
    const engine = new SastEngine({ rulesDir: RULES_DIR, resolver: new FixedResolver(failing) });
    await expect(engine.scan("/work/shop")).rejects.toBeInstanceOf(ScanFailedError);
  });

  // Real Semgrep (installed or Docker). Run with: AEGISCODE_E2E=1 npm test -w @aegiscode/engine-sast
  it.runIf(process.env.AEGISCODE_E2E === "1")(
    "finds a planted SQL injection with the real Semgrep",
    async () => {
      const project = await mkdtemp(join(tmpdir(), "aegiscode-e2e-"));
      await writeFile(
        join(project, "app.js"),
        'app.get("/u", (req, res) => { db.query("SELECT * FROM users WHERE id = " + req.query.id); });\n',
      );
      const engine = new SastEngine({ rulesDir: RULES_DIR });
      await engine.checkPrerequisites();
      const { findings } = await engine.scan(project);
      expect(findings.map((finding) => finding.ruleId)).toContain("aegiscode.javascript.sql-injection.tainted-query");
    },
    600_000,
  );
});
