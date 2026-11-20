import { readdir } from "node:fs/promises";
import { DependencyError, type EngineScanResult, type EngineType, ScanEngine } from "@aegiscode/core";
import type { SemgrepRunner } from "./SemgrepRunner.js";
import { SemgrepOutputParser } from "./SemgrepOutputParser.js";
import { SemgrepRunnerResolver } from "./SemgrepRunnerResolver.js";

export interface SastEngineOptions {
  /** Folder with AegisCode's bundled .yaml rules (dist/rules in the published package). */
  rulesDir: string;
  resolver?: SemgrepRunnerResolver;
  parser?: SemgrepOutputParser;
}

/** SRS class SastEngine: Semgrep (local or Docker) with AegisCode's own bundled rules, fully offline. */
export class SastEngine extends ScanEngine {
  readonly engineType: EngineType = "SAST";
  readonly rulesDir: string;
  private readonly resolver: SemgrepRunnerResolver;
  private readonly parser: SemgrepOutputParser;
  private runner?: SemgrepRunner;

  constructor(options: SastEngineOptions) {
    super();
    this.rulesDir = options.rulesDir;
    this.resolver = options.resolver ?? new SemgrepRunnerResolver();
    this.parser = options.parser ?? new SemgrepOutputParser();
  }

  /** SRS checkSemgrepAndRuleset(): the ruleset is present and Semgrep can run. */
  async checkPrerequisites(): Promise<void> {
    if (!(await this.hasRules())) {
      throw new DependencyError(
        `The bundled AegisCode ruleset is missing (${this.rulesDir}). Reinstall @aegiscode/mcp-server.`,
      );
    }
    this.runner ??= await this.resolver.resolve();
  }

  /** SRS runOSSScan() followed by normalize(). */
  async scan(projectPath: string): Promise<EngineScanResult> {
    this.runner ??= await this.resolver.resolve();
    return this.normalize(await this.runner.run(projectPath, this.rulesDir));
  }

  protected normalize(raw: unknown): EngineScanResult {
    return this.parser.parse(String(raw));
  }

  private async hasRules(): Promise<boolean> {
    try {
      const entries = await readdir(this.rulesDir, { recursive: true });
      return entries.some((entry) => entry.endsWith(".yaml"));
    } catch {
      return false;
    }
  }
}
