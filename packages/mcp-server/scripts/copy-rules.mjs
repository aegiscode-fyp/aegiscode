// Copies AegisCode's own Semgrep rules into dist/rules so they ship inside the npm package.
// Rule TEST files (the .js/.ts files next to each rule) are NOT copied: they contain
// deliberately vulnerable code and are only needed for `semgrep --test`.
import { cpSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

const from = fileURLToPath(new URL("../../engine-sast/rules/", import.meta.url));
const to = fileURLToPath(new URL("../dist/rules/", import.meta.url));

rmSync(to, { recursive: true, force: true });
if (!existsSync(from)) {
  console.warn("copy-rules: no packages/engine-sast/rules folder yet (added in Phase 5), skipping");
  process.exit(0);
}
cpSync(from, to, {
  recursive: true,
  filter: (source) => !/\.(js|jsx|ts|tsx)$/.test(source),
});
