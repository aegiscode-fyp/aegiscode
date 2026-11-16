import type { BaseTool } from "./BaseTool.js";
import { PingTool } from "./PingTool.js";

/**
 * THE list of tools the server offers.
 * To add a tool: create a class that extends BaseTool, then add ONE line here.
 */
export function createDefaultTools(): BaseTool[] {
  return [
    new PingTool(),
    // new GetFindingsTool(),   // Phase 5
    // new ScanStaticTool(),    // Phase 5
    // new ScanDynamicTool(),   // Phase 6
  ];
}
