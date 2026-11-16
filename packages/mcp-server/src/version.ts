import { createRequire } from "node:module";

// Read this package's version from package.json at runtime. This file sits one level
// below package.json both as src/version.ts (tests) and inside the bundled dist/index.js.
const readPackageJson = createRequire(import.meta.url);
const pkg = readPackageJson("../package.json") as { version: string };

export const SERVER_NAME = "aegiscode";
export const SERVER_VERSION: string = pkg.version;
