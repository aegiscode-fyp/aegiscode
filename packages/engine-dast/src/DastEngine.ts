import { type EngineScanResult, type EngineType, ScanEngine, ScanFailedError } from "@aegiscode/core";

/**
 * SRS class DastEngine. PLACEHOLDER until Phase 6, which replaces the body with:
 * checkDockerStatus -> checkTargetReachability -> runTargetedScan (ZAP in Docker)
 * -> parseAndNormalizeReport. It is NOT registered in the MCP server until then.
 */
export class DastEngine extends ScanEngine {
  readonly engineType: EngineType = "DAST";

  async checkPrerequisites(): Promise<void> {}

  async scan(_targetUrl: string): Promise<EngineScanResult> {
    throw new ScanFailedError("The DAST engine is not implemented yet (Phase 6).");
  }

  protected normalize(_raw: unknown): EngineScanResult {
    return { findings: [], warnings: [] };
  }
}
