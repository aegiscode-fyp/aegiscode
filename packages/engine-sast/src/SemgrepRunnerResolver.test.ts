import { DependencyError, type ProcessResult, ProcessRunner, ScanFailedError } from "@aegiscode/core";
import { describe, expect, it } from "vitest";
import { DockerSemgrepRunner } from "./DockerSemgrepRunner.js";
import { LocalSemgrepRunner } from "./LocalSemgrepRunner.js";
import { SEMGREP_IMAGE } from "./SemgrepRunner.js";
import { SemgrepRunnerResolver } from "./SemgrepRunnerResolver.js";

/** Pretends some programs are installed and records every command, so no real process starts. */
class FakeProcessRunner extends ProcessRunner {
  readonly calls: { command: string; args: readonly string[]; cwd?: string }[] = [];

  constructor(
    private readonly installed: string[],
    private readonly result: ProcessResult = { exitCode: 0, stdout: "{}", stderr: "", timedOut: false },
  ) {
    super();
  }

  override async isAvailable(command: string): Promise<boolean> {
    return this.installed.includes(command);
  }

  override async run(command: string, args: readonly string[], options: { cwd?: string } = {}): Promise<ProcessResult> {
    this.calls.push({ command, args, cwd: options.cwd });
    return this.result;
  }
}

describe("SemgrepRunnerResolver", () => {
  it("prefers an installed Semgrep", async () => {
    const runner = await new SemgrepRunnerResolver(new FakeProcessRunner(["semgrep", "docker"])).resolve();
    expect(runner.kind).toBe("local");
  });

  it("falls back to Docker", async () => {
    const runner = await new SemgrepRunnerResolver(new FakeProcessRunner(["docker"])).resolve();
    expect(runner.kind).toBe("docker");
  });

  it("reports a missing Semgrep and Docker as DEPENDENCY_UNAVAILABLE", async () => {
    await expect(new SemgrepRunnerResolver(new FakeProcessRunner([])).resolve()).rejects.toBeInstanceOf(
      DependencyError,
    );
  });
});

describe("Semgrep runners", () => {
  it("run Docker offline with read-only mounts and the pinned image", async () => {
    const processes = new FakeProcessRunner(["docker"]);
    await new DockerSemgrepRunner(processes).run("/work/shop", "/opt/rules");
    const { command, args } = processes.calls[0]!;
    expect(command).toBe("docker");
    expect(args.join(" ")).toContain("--network none -v /work/shop:/src:ro -v /opt/rules:/rules:ro -w /src");
    expect(args).toContain(SEMGREP_IMAGE);
    expect(args).toEqual(expect.arrayContaining(["--config", "/rules", "--metrics=off", "--disable-version-check"]));
  });

  it("run a local Semgrep inside the project so paths are project-relative", async () => {
    const processes = new FakeProcessRunner(["semgrep"]);
    await new LocalSemgrepRunner(processes).run("/work/shop", "/opt/rules");
    const { command, args, cwd } = processes.calls[0]!;
    expect(command).toBe("semgrep");
    expect(cwd).toBe("/work/shop");
    expect(args).toEqual(expect.arrayContaining(["--config", "/opt/rules", "--metrics=off", "."]));
  });

  it("turn a Semgrep crash into SCAN_FAILED", async () => {
    const crashed = { exitCode: 2, stdout: "", stderr: "Fatal: invalid rule", timedOut: false };
    await expect(new LocalSemgrepRunner(new FakeProcessRunner(["semgrep"], crashed)).run("/p", "/r")).rejects.toThrow(
      new ScanFailedError("Semgrep exited with code 2: Fatal: invalid rule"),
    );
  });
});
