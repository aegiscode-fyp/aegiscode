import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DependencyError, type EngineScanResult, type EngineType, Finding, ScanEngine } from "@aegiscode/core";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import { SilentLogger } from "../logging/Logger.js";
import { createServer } from "../server/createServer.js";

function finding(id: string, severity: "low" | "high" | "critical", vulnerabilityType: string, file: string): Finding {
  return new Finding({
    findingId: id,
    engine: "SAST",
    vulnerabilityType,
    severity,
    message: `${vulnerabilityType} found. Fix it like this.`,
    location: { file, line: 3, column: 1 },
    ruleId: `aegiscode.javascript.${vulnerabilityType}.test`,
  });
}

/** Stands in for Semgrep: returns fixed findings and remembers what it scanned. */
class FakeSastEngine extends ScanEngine {
  readonly engineType: EngineType = "SAST";
  readonly scanned: string[] = [];

  constructor(private readonly available = true) {
    super();
  }

  async checkPrerequisites(): Promise<void> {
    if (!this.available) throw new DependencyError("Semgrep is not available.");
  }

  async scan(target: string): Promise<EngineScanResult> {
    this.scanned.push(target);
    return this.normalize(undefined);
  }

  protected normalize(_raw: unknown): EngineScanResult {
    return {
      findings: [
        finding("a", "low", "weak-crypto", "src/hash.js"),
        finding("b", "critical", "sql-injection", "src/db.js"),
        finding("c", "high", "xss", "src/db.js"),
      ],
      warnings: ["src/broken.js could not be fully parsed, so parts of it were not checked."],
    };
  }
}

async function connect(projectDir: string, engine: ScanEngine): Promise<Client> {
  const server = createServer({ projectDir, engines: [engine], logger: new SilentLogger() });
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await server.start(serverSide);
  const client = new Client({ name: "test-agent", version: "1.0.0" });
  await client.connect(clientSide);
  return client;
}

describe("scan_static", () => {
  it("scans the project and returns findings most severe first", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "aegiscode-tools-"));
    const engine = new FakeSastEngine();
    const client = await connect(projectDir, engine);

    const result = await client.callTool({ name: "scan_static", arguments: {} });

    expect(result.isError).toBeFalsy();
    expect(engine.scanned).toEqual([projectDir]);
    const output = result.structuredContent as {
      total: number;
      counts: Record<string, number>;
      findings: { severity: string }[];
      warnings: string[];
    };
    expect(output.total).toBe(3);
    expect(output.counts).toEqual({ critical: 1, high: 1, medium: 0, low: 1, info: 0 });
    expect(output.findings.map((f) => f.severity)).toEqual(["critical", "high", "low"]);
    expect(output.warnings).toHaveLength(1);
    const text = (result.content as { text: string }[])[0]!.text;
    expect(text).toContain("Found 3 security issue(s) (1 critical, 1 high, 1 low) in 2 file(s)");
    expect(text).toContain("- [critical] sql-injection at src/db.js:3 - sql-injection found.");
    expect(text).toContain("Warning: src/broken.js could not be fully parsed");
    await client.close();
  });

  it("resolves a relative path against the project", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "aegiscode-tools-"));
    await mkdir(join(projectDir, "src"));
    const engine = new FakeSastEngine();
    const client = await connect(projectDir, engine);
    await client.callTool({ name: "scan_static", arguments: { path: "src" } });
    expect(engine.scanned).toEqual([join(projectDir, "src")]);
    await client.close();
  });

  it("reports a missing path and a missing Semgrep as errors, never as a clean scan", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "aegiscode-tools-"));
    const client = await connect(projectDir, new FakeSastEngine(false));

    const missingPath = await client.callTool({ name: "scan_static", arguments: { path: "nope" } });
    expect(missingPath.isError).toBe(true);
    expect((missingPath.content as { text: string }[])[0]!.text).toMatch(/^INVALID_INPUT: /);

    const noSemgrep = await client.callTool({ name: "scan_static", arguments: {} });
    expect(noSemgrep.isError).toBe(true);
    expect(noSemgrep.content).toEqual([{ type: "text", text: "DEPENDENCY_UNAVAILABLE: Semgrep is not available." }]);
    await client.close();
  });
});

describe("get_findings", () => {
  it("returns the stored findings after a server restart, filtered and limited", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "aegiscode-tools-"));
    const first = await connect(projectDir, new FakeSastEngine());
    await first.callTool({ name: "scan_static", arguments: {} });
    await first.close();

    const second = await connect(projectDir, new FakeSastEngine());
    const all = await second.callTool({ name: "get_findings", arguments: {} });
    expect((all.structuredContent as { total: number }).total).toBe(3);

    const severe = await second.callTool({ name: "get_findings", arguments: { minSeverity: "high", limit: 1 } });
    const output = severe.structuredContent as { total: number; findings: { vulnerabilityType: string }[] };
    expect(output.total).toBe(2);
    expect(output.findings.map((f) => f.vulnerabilityType)).toEqual(["sql-injection"]);
    await second.close();
  });

  it("tells the agent to scan first when nothing is stored", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "aegiscode-tools-"));
    const client = await connect(projectDir, new FakeSastEngine());
    const result = await client.callTool({ name: "get_findings", arguments: {} });
    expect(result.isError).toBeFalsy();
    expect((result.content as { text: string }[])[0]!.text).toMatch(/Run scan_static first/);
    await client.close();
  });

  it("rejects an unknown severity", async () => {
    const projectDir = await mkdtemp(join(tmpdir(), "aegiscode-tools-"));
    const client = await connect(projectDir, new FakeSastEngine());
    const result = await client.callTool({ name: "get_findings", arguments: { minSeverity: "urgent" } });
    expect(result.isError).toBe(true);
    await client.close();
  });
});
