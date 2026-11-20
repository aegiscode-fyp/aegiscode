import { createHash } from "node:crypto";
import {
  type EngineScanResult,
  Finding,
  SEVERITIES,
  ScanFailedError,
  type Severity,
  severityRank,
} from "@aegiscode/core";

interface SemgrepResult {
  check_id: string;
  path: string;
  start: { line: number; col: number };
  extra: { message: string; severity: string; metadata?: Record<string, unknown> };
}

interface SemgrepError {
  level?: string;
  type?: string | [string, ...unknown[]];
  path?: string;
}

interface SemgrepJson {
  results?: SemgrepResult[];
  errors?: SemgrepError[];
  paths?: { scanned?: string[] };
}

// Semgrep prefixes rule ids with the rules folder path (e.g. "rules.javascript."), so keep
// only the trailing aegiscode.<language>.<class>.<name>.
const RULE_ID = /aegiscode\.[a-z]+\.[a-z0-9-]+\.[a-z0-9-]+$/;

const SEMGREP_SEVERITY: Record<string, Severity> = { ERROR: "high", WARNING: "medium", INFO: "low" };

/**
 * SRS parseOutput(): Semgrep JSON -> findings. Only the rule metadata, message and location
 * are kept. `extra.lines` and `extra.metavars` are never read: they hold matched source code
 * and secret values (FR-10).
 */
export class SemgrepOutputParser {
  parse(json: string): EngineScanResult {
    let data: SemgrepJson;
    try {
      data = JSON.parse(json) as SemgrepJson;
    } catch {
      throw new ScanFailedError("Semgrep returned output that is not valid JSON.");
    }
    if (!Array.isArray(data.results)) {
      throw new ScanFailedError("Semgrep output has no results list.");
    }

    // Several rules can report the same problem on the same line (e.g. a taint rule and a
    // pattern rule); keep the most severe one.
    const byLocation = new Map<string, Finding>();
    for (const result of data.results) {
      const finding = this.toFinding(result);
      const key = `${finding.vulnerabilityType}|${finding.location.file}|${finding.location.line}`;
      const existing = byLocation.get(key);
      if (!existing || severityRank(finding.severity) > severityRank(existing.severity)) {
        byLocation.set(key, finding);
      }
    }

    const warnings = (data.errors ?? []).map((error) => this.toWarning(error));
    if ((data.paths?.scanned ?? []).length === 0) {
      warnings.push(
        "Semgrep scanned no files. Check the path, and that it contains JavaScript/TypeScript files that are not ignored.",
      );
    }
    return { findings: [...byLocation.values()], warnings };
  }

  private toFinding(result: SemgrepResult): Finding {
    const ruleId = RULE_ID.exec(result.check_id)?.[0] ?? result.check_id;
    const metadata = result.extra.metadata ?? {};
    const file = result.path.replaceAll("\\", "/");
    return new Finding({
      findingId: createHash("sha256").update(`${ruleId}\0${file}\0${result.start.line}`).digest("hex").slice(0, 16),
      engine: "SAST",
      vulnerabilityType: typeof metadata.vulnerability_type === "string" ? metadata.vulnerability_type : "unknown",
      severity: this.severity(metadata.aegiscode_severity, result.extra.severity),
      message: result.extra.message,
      location: { file, line: result.start.line, column: result.start.col },
      ruleId,
      cwe: typeof metadata.cwe === "string" ? metadata.cwe : undefined,
    });
  }

  private severity(aegiscodeSeverity: unknown, semgrepSeverity: string): Severity {
    for (const value of [aegiscodeSeverity, semgrepSeverity]) {
      const lower = typeof value === "string" ? value.toLowerCase() : "";
      if ((SEVERITIES as readonly string[]).includes(lower)) return lower as Severity;
    }
    return SEMGREP_SEVERITY[semgrepSeverity] ?? "medium";
  }

  // Semgrep's own error message can quote the user's code, so only the type and file are used.
  private toWarning(error: SemgrepError): string {
    const type = Array.isArray(error.type) ? error.type[0] : (error.type ?? "error");
    const where = error.path ? error.path.replaceAll("\\", "/") : "the scan";
    if (type === "PartialParsing" || type === "Syntax error") {
      return `${where} could not be fully parsed, so parts of it were not checked.`;
    }
    return `Semgrep ${error.level ?? "warning"} (${type}) in ${where}; results may be incomplete.`;
  }
}
