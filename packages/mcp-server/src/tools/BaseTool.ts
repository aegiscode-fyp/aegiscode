import { AegisCodeError } from "@aegiscode/core";
import type { CallToolResult, ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";
import type { ToolContext } from "./ToolContext.js";

/**
 * Every MCP tool extends this class. A tool only DESCRIBES itself and implements
 * execute(); BaseTool turns the result, or any error, into the MCP response format.
 */
export abstract class BaseTool<TInput extends z.ZodObject = z.ZodObject, TOutput extends z.ZodObject = z.ZodObject> {
  /** The name the agent calls, lowercase snake_case, unique, e.g. "scan_static". */
  abstract readonly name: string;
  /** Short human-readable title. */
  abstract readonly title: string;
  /** Written FOR the AI agent: what the tool does, when to use it, what it returns. */
  abstract readonly description: string;
  /** zod schema of the arguments. The SDK validates every call against it. */
  abstract readonly inputSchema: TInput;
  /** zod schema of the structured result (NFR-15: structured findings for agents). */
  abstract readonly outputSchema: TOutput;
  /** Hints for agents, e.g. { readOnlyHint: true } for tools that change nothing. */
  readonly annotations: ToolAnnotations = {};

  /** The tool's real work. Throw an AegisCodeError for problems the user should see. */
  protected abstract execute(input: z.infer<TInput>, context: ToolContext): Promise<z.infer<TOutput>>;

  /** The short text shown in the agent's chat. Override it for a friendlier summary. */
  protected summarize(output: z.infer<TOutput>): string {
    return JSON.stringify(output, null, 2);
  }

  /**
   * Called by the server for every tool call. Never throws: every error becomes an
   * `isError` result that the agent can read (UC-05 E2/E3, NFR-11). A failed scan is
   * therefore never reported as a pass.
   */
  async handle(input: z.infer<TInput>, context: ToolContext): Promise<CallToolResult> {
    try {
      const output = await this.execute(input, context);
      return {
        content: [{ type: "text", text: this.summarize(output) }],
        structuredContent: output as Record<string, unknown>,
      };
    } catch (error) {
      const text =
        error instanceof AegisCodeError
          ? `${error.code}: ${error.message}`
          : `INTERNAL_ERROR: ${error instanceof Error ? error.message : String(error)}`;
      context.logger.error(`tool ${this.name} failed: ${text}`);
      return { isError: true, content: [{ type: "text", text }] };
    }
  }
}
