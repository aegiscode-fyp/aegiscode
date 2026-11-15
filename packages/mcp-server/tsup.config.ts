import { defineConfig } from "tsup";

// Builds ONE self-contained file: dist/index.js.
// Our private workspace packages (@aegiscode/core, engines) are bundled INTO it, so only
// @aegiscode/mcp-server is published. Real npm dependencies (MCP SDK, zod) stay external.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  platform: "node",
  target: "node22",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  noExternal: [/^@aegiscode\//],
});
