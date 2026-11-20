import type { BaseTool } from "./BaseTool.js";
import { GetFindingsTool } from "./GetFindingsTool.js";
import { PingTool } from "./PingTool.js";
import { ScanStaticTool } from "./ScanStaticTool.js";

/**
 * THE list of tools the server offers.
 * To add a tool: create a class that extends BaseTool, then add ONE line here.
 */
export function createDefaultTools(): BaseTool[] {
  return [
    new PingTool(),
    new ScanStaticTool(),
    new GetFindingsTool(),
    // new ScanDynamicTool(),   // Phase 6
  ];
}
