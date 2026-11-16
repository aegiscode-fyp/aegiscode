import type { BaseTool } from "./BaseTool.js";

const VALID_TOOL_NAME = /^[a-z][a-z0-9_]{0,63}$/;

/** Holds every tool the server offers. Rejects duplicate or badly formed names at startup. */
export class ToolRegistry {
  private readonly tools = new Map<string, BaseTool>();

  register(tool: BaseTool): this {
    if (!VALID_TOOL_NAME.test(tool.name)) {
      throw new Error(`Invalid tool name "${tool.name}": use lowercase snake_case, e.g. "scan_static"`);
    }
    if (this.tools.has(tool.name)) {
      throw new Error(`Duplicate tool name "${tool.name}"`);
    }
    this.tools.set(tool.name, tool);
    return this;
  }

  list(): BaseTool[] {
    return [...this.tools.values()];
  }

  names(): string[] {
    return [...this.tools.keys()];
  }
}
