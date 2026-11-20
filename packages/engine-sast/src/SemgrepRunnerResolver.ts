import { DependencyError, ProcessRunner } from "@aegiscode/core";
import { DockerSemgrepRunner } from "./DockerSemgrepRunner.js";
import { LocalSemgrepRunner } from "./LocalSemgrepRunner.js";
import type { SemgrepRunner } from "./SemgrepRunner.js";

/** Picks how to run Semgrep: an installed Semgrep, else Docker, else a clear error (UC-01 precondition 3). */
export class SemgrepRunnerResolver {
  constructor(private readonly processes: ProcessRunner = new ProcessRunner()) {}

  async resolve(): Promise<SemgrepRunner> {
    if (await this.processes.isAvailable("semgrep")) {
      return new LocalSemgrepRunner(this.processes);
    }
    if (await this.processes.isAvailable("docker", ["info"])) {
      return new DockerSemgrepRunner(this.processes);
    }
    throw new DependencyError(
      "Semgrep is not available. Install Semgrep (e.g. `pipx install semgrep` or `brew install semgrep`) " +
        "or install and start Docker, then scan again.",
    );
  }
}
