import { describe, expect, it } from "vitest";
import { ProcessRunner } from "./ProcessRunner.js";

describe("ProcessRunner", () => {
  const runner = new ProcessRunner();

  it("captures a program's output and exit code", async () => {
    const result = await runner.run(process.execPath, ["-e", "console.log('hello')"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toBe("hello");
  });

  it("reports a program that is not installed as unavailable", async () => {
    expect(await runner.isAvailable("aegiscode-no-such-program")).toBe(false);
  });

  it("stops a program that runs too long", async () => {
    const result = await runner.run(process.execPath, ["-e", "setTimeout(() => {}, 10000)"], { timeoutMs: 200 });
    expect(result.timedOut).toBe(true);
  });
});
