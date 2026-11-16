import { z } from "zod";
import { BaseTool } from "./BaseTool.js";
import type { ToolContext } from "./ToolContext.js";

const Input = z.object({});

const Output = z.object({
  server: z.string().describe("Server name"),
  version: z.string().describe("Server version"),
  tools: z.array(z.string()).describe("Tools this server offers"),
  engines: z.array(z.string()).describe("Scan engines installed, e.g. SAST, DAST"),
});

/** The simplest possible tool: proves an agent can reach the server (SRS McpServer.discoverTools). */
export class PingTool extends BaseTool<typeof Input, typeof Output> {
  readonly name = "ping";
  readonly title = "Ping AegisCode";
  readonly description =
    "Checks that the AegisCode security server is running. Returns its version, the tools it offers and the scan engines installed. Use it to test the connection.";
  readonly inputSchema = Input;
  readonly outputSchema = Output;
  override readonly annotations = { readOnlyHint: true, openWorldHint: false };

  protected async execute(_input: z.infer<typeof Input>, context: ToolContext): Promise<z.infer<typeof Output>> {
    return {
      server: context.server.name,
      version: context.server.version,
      tools: context.server.toolNames(),
      engines: context.pipeline.availableEngines(),
    };
  }

  protected override summarize(output: z.infer<typeof Output>): string {
    const engines = output.engines.length > 0 ? output.engines.join(", ") : "none yet";
    return `AegisCode ${output.version} is running. Tools: ${output.tools.join(", ")}. Engines: ${engines}.`;
  }
}
