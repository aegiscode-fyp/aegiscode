import { ProcessRunner } from "@aegiscode/core";
import {
  SEMGREP_IMAGE,
  SEMGREP_TIMEOUT_MS,
  type SemgrepRunner,
  semgrepOutput,
  semgrepScanArgs,
} from "./SemgrepRunner.js";

/**
 * Runs Semgrep in Docker. `--network none` makes uploading physically impossible, and the
 * project and rules are mounted read-only. The image refuses `semgrep scan` without a /src mount.
 */
export class DockerSemgrepRunner implements SemgrepRunner {
  readonly kind = "docker";

  constructor(private readonly processes: ProcessRunner = new ProcessRunner()) {}

  async run(projectDir: string, rulesDir: string): Promise<string> {
    const args = [
      "run", "--rm", "--network", "none",
      "-v", `${projectDir}:/src:ro`,
      "-v", `${rulesDir}:/rules:ro`,
      "-w", "/src",
      SEMGREP_IMAGE,
      "semgrep", ...semgrepScanArgs("/rules"),
    ];
    return semgrepOutput(await this.processes.run("docker", args, { timeoutMs: SEMGREP_TIMEOUT_MS }));
  }
}
