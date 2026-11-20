import type { FindingsStore, ScanPipeline } from "@aegiscode/core";
import type { Logger } from "../logging/Logger.js";

/**
 * Everything a tool is allowed to use. The server creates it once and passes it to
 * every tool call (dependency injection), so tools never build these objects themselves
 * and tests can hand in fakes.
 */
export interface ToolContext {
  /** The project the agent opened; relative paths in tool input are resolved against it. */
  readonly projectDir: string;
  readonly pipeline: ScanPipeline;
  readonly store: FindingsStore;
  readonly logger: Logger;
  readonly server: {
    readonly name: string;
    readonly version: string;
    toolNames(): string[];
  };
}
