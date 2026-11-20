import { ProcessRunner } from "@aegiscode/core";
import { SEMGREP_TIMEOUT_MS, type SemgrepRunner, semgrepOutput, semgrepScanArgs } from "./SemgrepRunner.js";

/** Runs a Semgrep that is installed on this machine. */
export class LocalSemgrepRunner implements SemgrepRunner {
  readonly kind = "local";

  constructor(private readonly processes: ProcessRunner = new ProcessRunner()) {}

  async run(projectDir: string, rulesDir: string): Promise<string> {
    const result = await this.processes.run("semgrep", semgrepScanArgs(rulesDir), {
      cwd: projectDir,
      timeoutMs: SEMGREP_TIMEOUT_MS,
    });
    return semgrepOutput(result);
  }
}
