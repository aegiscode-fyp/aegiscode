// Copies AegisCode's own Semgrep rules into dist/rules so they ship inside the npm package.
// Only the .yaml rule files are copied. The test files next to them (.js, .ts, .jsx, .ejs,
// .pug, ...) contain deliberately vulnerable code and are only needed for `semgrep --test`.
import { cpSync, existsSync, rmSync, statSync } from "node:fs";
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
  filter: (source) => statSync(source).isDirectory() || /\.ya?ml$/.test(source),
});
