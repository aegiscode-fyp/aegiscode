/**
 * Base class for every error AegisCode reports to a user or an AI agent.
 * The `code` is stable and machine-readable; the message is for humans.
 * NFR-11: failures are always reported, never silently ignored.
 */
export class AegisCodeError extends Error {
  readonly code: string;

  constructor(code: string, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.code = code;
    this.name = new.target.name;
  }
}

/** Bad input from the user or agent, e.g. a path that does not exist (SRS: invalidPathError). */
export class InvalidInputError extends AegisCodeError {
  constructor(message: string, options?: { cause?: unknown }) {
    super("INVALID_INPUT", message, options);
  }
}

/** Something the engine needs is missing: Semgrep, Docker, the ZAP image (SRS: dependencyError, dockerError). */
export class DependencyError extends AegisCodeError {
  constructor(message: string, options?: { cause?: unknown }) {
    super("DEPENDENCY_UNAVAILABLE", message, options);
  }
}

/** The DAST target application cannot be reached (SRS: targetUnreachableError). */
export class TargetUnreachableError extends AegisCodeError {
  constructor(message: string, options?: { cause?: unknown }) {
    super("TARGET_UNREACHABLE", message, options);
  }
}

/** The engine started but the scan failed (SRS: zapFailureError, a Semgrep crash). */
export class ScanFailedError extends AegisCodeError {
  constructor(message: string, options?: { cause?: unknown }) {
    super("SCAN_FAILED", message, options);
  }
}
