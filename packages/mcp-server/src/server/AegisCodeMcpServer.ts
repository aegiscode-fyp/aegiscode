import type { FindingsStore, ScanPipeline } from "@aegiscode/core";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import type { Logger } from "../logging/Logger.js";
import type { BaseTool } from "../tools/BaseTool.js";
import type { ToolContext } from "../tools/ToolContext.js";
import { ToolRegistry } from "../tools/ToolRegistry.js";

export interface ServerDependencies {
  pipeline: ScanPipeline;
  store: FindingsStore;
  logger: Logger;
}

/**
 * SRS class McpServer. Wraps the official MCP SDK server and plugs every registered tool
 * into it. Tools never touch the SDK directly, which keeps them small and easy to test.
 * Scans go Agent -> McpServer -> ScanPipeline -> ScanEngine (SRS sequence diagram 17).
 */
export class AegisCodeMcpServer {
  private readonly sdkServer: McpServer;
  private readonly registry = new ToolRegistry();
  private readonly context: ToolContext;

  constructor(
    readonly name: string,
    readonly version: string,
    private readonly deps: ServerDependencies,
    tools: readonly BaseTool[],
  ) {
    this.sdkServer = new McpServer({ name, version });
    this.context = {
      pipeline: deps.pipeline,
      store: deps.store,
      logger: deps.logger,
      server: { name, version, toolNames: () => this.discoverTools() },
    };
    for (const tool of tools) {
      this.addTool(tool);
    }
  }

  /** SRS McpServer.discoverTools(): the names of all tools offered. */
  discoverTools(): string[] {
    return this.registry.names();
  }

  async start(transport: Transport): Promise<void> {
    await this.sdkServer.connect(transport);
    this.deps.logger.info(`${this.name} ${this.version} ready, tools: ${this.discoverTools().join(", ")}`);
  }

  async stop(): Promise<void> {
    await this.sdkServer.close();
  }

  private addTool(tool: BaseTool): void {
    this.registry.register(tool);
    this.sdkServer.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema,
        annotations: tool.annotations,
      },
      (args: unknown) => tool.handle(args as never, this.context),
    );
  }
}
