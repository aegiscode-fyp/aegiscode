import { FindingsStore, ScanPipeline, type ScanEngine } from "@aegiscode/core";
import { type Logger, StderrLogger } from "../logging/Logger.js";
import type { BaseTool } from "../tools/BaseTool.js";
import { createDefaultTools } from "../tools/index.js";
import { SERVER_NAME, SERVER_VERSION } from "../version.js";
import { AegisCodeMcpServer } from "./AegisCodeMcpServer.js";

export interface CreateServerOptions {
  /** Project to scan. Default: the folder the agent started the server in. */
  projectDir?: string;
  /** Default: none yet. Phase 5 adds new SastEngine(), Phase 6 adds new DastEngine(). */
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
  const pipeline = new ScanPipeline(options.engines ?? [], store);
  return new AegisCodeMcpServer(
    SERVER_NAME,
    SERVER_VERSION,
    { pipeline, store, logger },
    options.tools ?? createDefaultTools(),
  );
}
