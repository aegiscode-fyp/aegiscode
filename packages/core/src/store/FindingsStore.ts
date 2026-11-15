import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { EngineType } from "../domain/EngineType.js";
import { Finding, type FindingProps } from "../domain/Finding.js";
import { severityRank, type Severity } from "../domain/Severity.js";
import type { ScanResult } from "../pipeline/ScanPipeline.js";

interface StoredScan {
  target: string;
  startedAt: string;
  durationMs: number;
  findings: FindingProps[];
}

interface StoreFile {
  version: 1;
  scans: Partial<Record<EngineType, StoredScan>>;
}

export interface FindingsFilter {
  engine?: EngineType;
  minSeverity?: Severity;
  limit?: number;
}

/**
 * Keeps the latest results of each engine in <project>/.aegiscode/findings.json,
 * so get_findings can answer without scanning again. Local only, never uploaded.
 */
export class FindingsStore {
  readonly filePath: string;

  constructor(projectDir: string) {
    this.filePath = join(projectDir, ".aegiscode", "findings.json");
  }

  /** Replace the stored results of this engine with the new scan. */
  async save(result: ScanResult): Promise<void> {
    const data = await this.read();
    data.scans[result.engine] = {
      target: result.target,
      startedAt: result.startedAt,
      durationMs: result.durationMs,
      findings: result.findings.map((finding) => finding.toJSON()),
    };
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  }

  /** Stored findings, most severe first, optionally filtered. */
  async getFindings(filter: FindingsFilter = {}): Promise<Finding[]> {
    const data = await this.read();
    let findings = Object.values(data.scans).flatMap((scan) =>
      (scan?.findings ?? []).map((props) => new Finding(props)),
    );
    if (filter.engine) {
      findings = findings.filter((finding) => finding.engine === filter.engine);
    }
    if (filter.minSeverity) {
      const min = severityRank(filter.minSeverity);
      findings = findings.filter((finding) => severityRank(finding.severity) >= min);
    }
    findings.sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
    return filter.limit === undefined ? findings : findings.slice(0, filter.limit);
  }

  private async read(): Promise<StoreFile> {
    try {
      return JSON.parse(await readFile(this.filePath, "utf8")) as StoreFile;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return { version: 1, scans: {} };
      }
      throw error;
    }
  }
}
