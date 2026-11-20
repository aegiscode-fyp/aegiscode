import { fileURLToPath } from "node:url";
import { FindingsStore, ScanPipeline, type ScanEngine } from "@aegiscode/core";
import { SastEngine } from "@aegiscode/engine-sast";
import { type Logger, StderrLogger } from "../logging/Logger.js";
import type { BaseTool } from "../tools/BaseTool.js";
import { createDefaultTools } from "../tools/index.js";
import { SERVER_NAME, SERVER_VERSION } from "../version.js";
import { AegisCodeMcpServer } from "./AegisCodeMcpServer.js";

// tsup bundles this module into dist/index.js, so this is dist/rules, where copy-rules.mjs puts the rules.
const BUNDLED_RULES_DIR = fileURLToPath(new URL("./rules/", import.meta.url));

export interface CreateServerOptions {
  /** Project to scan. Default: the folder the agent started the server in. */
  projectDir?: string;
  /** Default: the SAST engine with the bundled rules. Phase 6 adds the DAST engine. */
  engines?: ScanEngine[];
  /** Default: createDefaultTools(). Tests pass their own. */
  tools?: BaseTool[];
  logger?: Logger;
}

/** Composition root: creates every object and wires them together (dependency injection). */
export function createServer(options: CreateServerOptions = {}): AegisCodeMcpServer {
  const projectDir = options.projectDir ?? process.cwd();
  const logger = options.logger ?? new StderrLogger();
  const store = new FindingsStore(projectDir);
  const engines = options.engines ?? [new SastEngine({ rulesDir: BUNDLED_RULES_DIR })];
  const pipeline = new ScanPipeline(engines, store);
  return new AegisCodeMcpServer(
    SERVER_NAME,
    SERVER_VERSION,
    { projectDir, pipeline, store, logger },
    options.tools ?? createDefaultTools(),
  );
}
