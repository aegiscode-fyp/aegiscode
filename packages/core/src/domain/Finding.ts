import type { EngineType } from "./EngineType.js";
import type { Severity } from "./Severity.js";

/** Where a finding was observed. SAST fills file/line, DAST fills url/param. */
export interface FindingLocation {
  /** Project-relative path, never an absolute path (SRS FR-10). */
  file?: string;
  line?: number;
  column?: number;
  url?: string;
  param?: string;
}

/** Plain data of a finding. This is also the JSON shape stored and returned to agents. */
export interface FindingProps {
  findingId: string;
  engine: EngineType;
  /** Normalized type shared by all engines, e.g. "sql-injection", "xss", "path-traversal". */
  vulnerabilityType: string;
  severity: Severity;
  message: string;
  location: FindingLocation;
  /** The engine's own rule id, e.g. a Semgrep rule id or a ZAP plugin id. */
  ruleId?: string;
  /** e.g. "CWE-89" */
  cwe?: string;
}

/** One vulnerability reported by one engine (SRS class: Finding). Immutable. */
export class Finding {
  readonly findingId: string;
  readonly engine: EngineType;
  readonly vulnerabilityType: string;
  readonly severity: Severity;
  readonly message: string;
  readonly location: Readonly<FindingLocation>;
  readonly ruleId?: string;
  readonly cwe?: string;

  constructor(props: FindingProps) {
    this.findingId = props.findingId;
    this.engine = props.engine;
    this.vulnerabilityType = props.vulnerabilityType;
    this.severity = props.severity;
    this.message = props.message;
    this.location = Object.freeze({ ...props.location });
    this.ruleId = props.ruleId;
    this.cwe = props.cwe;
  }

  /**
   * SRS Finding.overlaps(): true when both findings describe the same vulnerability
   * at the same place. The correlation engine (after DAST) builds on this.
   */
  overlaps(other: Finding): boolean {
    if (this.vulnerabilityType !== other.vulnerabilityType) return false;
    const a = this.location;
    const b = other.location;
    if (a.file !== undefined && b.file !== undefined) {
      return a.file === b.file && a.line === b.line;
    }
    if (a.url !== undefined && b.url !== undefined) {
      return a.url === b.url && a.param === b.param;
    }
    return false;
  }

  toJSON(): FindingProps {
    return {
      findingId: this.findingId,
      engine: this.engine,
      vulnerabilityType: this.vulnerabilityType,
      severity: this.severity,
      message: this.message,
      location: { ...this.location },
      ruleId: this.ruleId,
      cwe: this.cwe,
    };
  }
}
