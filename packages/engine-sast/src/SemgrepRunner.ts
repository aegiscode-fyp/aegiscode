import { type ProcessResult, ScanFailedError } from "@aegiscode/core";

/** Pinned so every developer, CI run and examiner gets identical results. */
export const SEMGREP_IMAGE = "semgrep/semgrep:1.185.0";

/** Large projects, and the first Docker run (which pulls the image), can take a while. */
export const SEMGREP_TIMEOUT_MS = 10 * 60_000;

/**
 * Strategy (build plan 1.4): runs Semgrep somewhere, installed locally or in Docker, and
 * returns its JSON output. SastEngine does not care which.
 */
export interface SemgrepRunner {
  readonly kind: "local" | "docker";
  run(projectDir: string, rulesDir: string): Promise<string>;
}

/**
 * Zero-upload arguments: only the local rules folder, no metrics, no version check.
 * The target "." with the project as working directory makes Semgrep report
 * project-relative paths (FR-10).
 */
export function semgrepScanArgs(config: string): string[] {
  return ["scan", "--config", config, "--json", "--metrics=off", "--disable-version-check", "--quiet", "."];
}

/** Semgrep's JSON output, or a ScanFailedError: a failed run must never look like a clean scan. */
export function semgrepOutput(result: ProcessResult): string {
  if (result.timedOut) {
    throw new ScanFailedError(`Semgrep did not finish within ${SEMGREP_TIMEOUT_MS / 60_000} minutes.`);
  }
  if (result.exitCode !== 0) {
    const detail = result.stderr.trim().split("\n").slice(-5).join("\n") || "no error output";
    throw new ScanFailedError(`Semgrep exited with code ${result.exitCode}: ${detail}`);
  }
  return result.stdout;
}
