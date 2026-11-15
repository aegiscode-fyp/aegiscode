import { spawn } from "node:child_process";

export interface ProcessResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

export interface RunOptions {
  cwd?: string;
  timeoutMs?: number;
  env?: NodeJS.ProcessEnv;
}

/**
 * Runs an external program (semgrep, docker) WITHOUT a shell, so a file path or URL
 * can never be interpreted as a shell command. Shared by the SAST and DAST engines.
 */
export class ProcessRunner {
  run(command: string, args: readonly string[], options: RunOptions = {}): Promise<ProcessResult> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        cwd: options.cwd,
        env: options.env ?? process.env,
        shell: false,
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      });
      let stdout = "";
      let stderr = "";
      let timedOut = false;
      child.stdout.setEncoding("utf8").on("data", (chunk: string) => {
        stdout += chunk;
      });
      child.stderr.setEncoding("utf8").on("data", (chunk: string) => {
        stderr += chunk;
      });
      const timer =
        options.timeoutMs === undefined
          ? undefined
          : setTimeout(() => {
              timedOut = true;
              child.kill("SIGTERM");
            }, options.timeoutMs);
      // "error" fires when the program cannot start at all, e.g. it is not installed (ENOENT).
      child.on("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
      child.on("close", (exitCode) => {
        clearTimeout(timer);
        resolve({ exitCode, stdout, stderr, timedOut });
      });
    });
  }

  /** True if the program starts and exits with code 0 (used to detect Semgrep and Docker). */
  async isAvailable(command: string, args: readonly string[] = ["--version"]): Promise<boolean> {
    try {
      const result = await this.run(command, args, { timeoutMs: 15_000 });
      return result.exitCode === 0;
    } catch {
      return false;
    }
  }
}
