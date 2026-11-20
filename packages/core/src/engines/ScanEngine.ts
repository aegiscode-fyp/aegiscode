import type { EngineType } from "../domain/EngineType.js";
import type { Finding } from "../domain/Finding.js";

/** What one engine run produced. */
export interface EngineScanResult {
  findings: Finding[];
  /** Problems that did not stop the scan but may make it incomplete, e.g. a file that could not be parsed. */
  warnings: string[];
}

/**
 * SRS class ScanEngine {abstract}. Every scanner (SAST, DAST, later IAST) extends it,
 * so ScanPipeline can run any engine in exactly the same way.
 */
export abstract class ScanEngine {
  /** Which engine this is. ScanPipeline looks engines up by this value. */
  abstract readonly engineType: EngineType;

  /** Throw a DependencyError if something the engine needs is missing (Semgrep, Docker, ...). */
  abstract checkPrerequisites(): Promise<void>;

  /** Run the scan. The target is a project path for SAST and a URL for DAST. */
  abstract scan(target: string): Promise<EngineScanResult>;

  /** Turn the tool's raw output (Semgrep JSON, ZAP report) into AegisCode findings. */
  protected abstract normalize(raw: unknown): EngineScanResult;
}
