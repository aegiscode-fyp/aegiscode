import { stat } from "node:fs/promises";
import { resolve } from "node:path";
import type { EngineType } from "../domain/EngineType.js";
import type { Finding } from "../domain/Finding.js";
import type { ScanEngine } from "../engines/ScanEngine.js";
import { DependencyError, InvalidInputError } from "../errors.js";
import type { FindingsStore } from "../store/FindingsStore.js";

/** The outcome of one engine run. */
export interface ScanResult {
  engine: EngineType;
  target: string;
  /** ISO 8601 time the scan started. */
  startedAt: string;
  durationMs: number;
  findings: Finding[];
  /** The scan finished but may be incomplete; agents must see this (NFR-11). */
  warnings: string[];
}

/**
 * SRS class ScanPipeline: the single place every interface (MCP server, CLI,
 * VS Code, GitHub Action) runs scans through. Engines are injected, so the
 * pipeline never depends on Semgrep or ZAP directly.
 */
export class ScanPipeline {
  private readonly engines = new Map<EngineType, ScanEngine>();

  constructor(
    engines: readonly ScanEngine[],
    private readonly store?: FindingsStore,
  ) {
    for (const engine of engines) {
      if (this.engines.has(engine.engineType)) {
        throw new Error(`Two engines registered for ${engine.engineType}`);
      }
      this.engines.set(engine.engineType, engine);
    }
  }

  /** Engines installed in this build, e.g. ["SAST", "DAST"]. */
  availableEngines(): EngineType[] {
    return [...this.engines.keys()];
  }

  /** SRS performStaticScan(path). */
  async performStaticScan(path: string): Promise<ScanResult> {
    return this.runScan("SAST", await this.validatePath(path));
  }

  /** SRS performDynamicScan(targetUrl). */
  async performDynamicScan(targetUrl: string): Promise<ScanResult> {
    return this.runScan("DAST", this.validateUrl(targetUrl));
  }

  /** SRS runScan(engine, target): run one engine and keep its results locally. */
  async runScan(engineType: EngineType, target: string): Promise<ScanResult> {
    const engine = this.engines.get(engineType);
    if (!engine) {
      throw new DependencyError(`The ${engineType} engine is not available in this version of AegisCode.`);
    }
    await engine.checkPrerequisites();
    const started = new Date();
    const { findings, warnings } = await engine.scan(target);
    const result: ScanResult = {
      engine: engineType,
      target,
      startedAt: started.toISOString(),
      durationMs: Date.now() - started.getTime(),
      findings,
      warnings,
    };
    await this.store?.save(result);
    return result;
  }

  /** SRS validatePath(path): the path must exist. Returns it as an absolute path. */
  async validatePath(path: string): Promise<string> {
    const absolute = resolve(path);
    try {
      await stat(absolute);
    } catch {
      throw new InvalidInputError(`Path does not exist: ${path}`);
    }
    return absolute;
  }

  /** Only http(s) URLs can be scanned dynamically. */
  validateUrl(targetUrl: string): string {
    let url: URL;
    try {
      url = new URL(targetUrl);
    } catch {
      throw new InvalidInputError(`Not a valid URL: ${targetUrl}`);
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new InvalidInputError(`Only http:// and https:// targets can be scanned: ${targetUrl}`);
    }
    return url.toString();
  }
}
