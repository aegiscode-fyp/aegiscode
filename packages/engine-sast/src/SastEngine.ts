import { type EngineType, type Finding, ScanEngine, ScanFailedError } from "@aegiscode/core";

/**
 * SRS class SastEngine. PLACEHOLDER until Phase 5, which replaces the body with:
 * Semgrep (local or Docker) + AegisCode's own bundled rules + SemgrepOutputParser.
 * It is NOT registered in the MCP server until then.
 */
export class SastEngine extends ScanEngine {
  readonly engineType: EngineType = "SAST";

  async checkPrerequisites(): Promise<void> {}

  async scan(_projectPath: string): Promise<Finding[]> {
    throw new ScanFailedError("The SAST engine is not implemented yet (Phase 5).");
  }

  protected normalize(_raw: unknown): Finding[] {
    return [];
  }
}
