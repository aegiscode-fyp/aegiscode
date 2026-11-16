export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

/**
 * An MCP server talks to the AI agent over STDOUT. Anything else printed there breaks
 * the connection, so every log line goes to STDERR. Never use console.log in this package.
 */
export class StderrLogger implements Logger {
  info(message: string): void {
    this.write("info", message);
  }

  warn(message: string): void {
    this.write("warn", message);
  }

  error(message: string): void {
    this.write("error", message);
  }

  private write(level: string, message: string): void {
    process.stderr.write(`[aegiscode] ${level}: ${message}\n`);
  }
}

/** Keeps test output clean. */
export class SilentLogger implements Logger {
  info(): void {}
  warn(): void {}
  error(): void {}
}
