import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { EngineType } from "../domain/EngineType.js";
import { Finding } from "../domain/Finding.js";
import { ScanEngine } from "../engines/ScanEngine.js";
import { DependencyError, InvalidInputError } from "../errors.js";
import { FindingsStore } from "../store/FindingsStore.js";
import { ScanPipeline } from "./ScanPipeline.js";

/** A pretend engine, so the pipeline can be tested without Semgrep or Docker. */
class FakeScanEngine extends ScanEngine {
  readonly engineType: EngineType = "SAST";
  async checkPrerequisites(): Promise<void> {}
  async scan(target: string): Promise<Finding[]> {
    return this.normalize({ target });
  }
  protected normalize(_raw: unknown): Finding[] {
    return [
      new Finding({
        findingId: "1",
        engine: "SAST",
        vulnerabilityType: "xss",
        severity: "medium",
        message: "Reflected XSS",
        location: { file: "a.js", line: 1 },
      }),
      new Finding({
        findingId: "2",
        engine: "SAST",
        vulnerabilityType: "sql-injection",
        severity: "critical",
        message: "SQL injection",
        location: { file: "b.js", line: 9 },
      }),
    ];
  }
}

async function tempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), "aegiscode-test-"));
}

describe("ScanPipeline", () => {
  it("runs an engine and stores the results", async () => {
    const dir = await tempDir();
    const store = new FindingsStore(dir);
    const pipeline = new ScanPipeline([new FakeScanEngine()], store);

    const result = await pipeline.performStaticScan(dir);

    expect(result.engine).toBe("SAST");
    expect(result.findings).toHaveLength(2);
    const highOrWorse = await store.getFindings({ minSeverity: "high" });
    expect(highOrWorse.map((f) => f.vulnerabilityType)).toEqual(["sql-injection"]);
  });

  it("reports a missing engine as a DependencyError", async () => {
    const pipeline = new ScanPipeline([]);
    await expect(pipeline.runScan("DAST", "http://localhost:3000")).rejects.toBeInstanceOf(DependencyError);
  });

  it("rejects a path that does not exist", async () => {
    const pipeline = new ScanPipeline([new FakeScanEngine()]);
    await expect(pipeline.performStaticScan("/definitely/not/here")).rejects.toBeInstanceOf(InvalidInputError);
  });

  it("rejects non-http URLs for dynamic scans", () => {
    const pipeline = new ScanPipeline([]);
    expect(() => pipeline.validateUrl("ftp://example.com")).toThrow(InvalidInputError);
  });
});
