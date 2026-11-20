import { ENGINE_TYPES, type Finding, SEVERITIES, type Severity, severityRank } from "@aegiscode/core";
import { z } from "zod";

/** The JSON shape of one finding, as returned to agents (NFR-15). */
export const FindingSchema = z.object({
  findingId: z.string(),
  engine: z.enum(ENGINE_TYPES),
  vulnerabilityType: z.string().describe('e.g. "sql-injection", "xss", "hardcoded-secret"'),
  severity: z.enum(SEVERITIES),
  message: z.string().describe("What is wrong and how to fix it"),
  location: z.object({
    file: z.string().optional().describe("Project-relative path"),
    line: z.number().int().optional(),
    column: z.number().int().optional(),
    url: z.string().optional(),
    param: z.string().optional(),
  }),
  ruleId: z.string().optional(),
  cwe: z.string().optional(),
});

export type FindingJson = z.infer<typeof FindingSchema>;

export function mostSevereFirst(findings: readonly Finding[]): FindingJson[] {
  return [...findings]
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
    .map((finding) => finding.toJSON());
}

export function countBySeverity(findings: readonly FindingJson[]): Record<Severity, number> {
  const counts = Object.fromEntries(SEVERITIES.map((severity) => [severity, 0])) as Record<Severity, number>;
  for (const finding of findings) counts[finding.severity] += 1;
  return counts;
}

/** e.g. "1 critical, 2 high" (most severe first, zero counts left out). */
export function describeCounts(counts: Record<Severity, number>): string {
  return [...SEVERITIES]
    .reverse()
    .filter((severity) => counts[severity] > 0)
    .map((severity) => `${counts[severity]} ${severity}`)
    .join(", ");
}

/** One chat line per finding, e.g. "- [high] sql-injection at src/db.js:12 - SQL query is built ...". */
export function describeFindings(findings: readonly FindingJson[], max = 10): string[] {
  const lines = findings.slice(0, max).map((finding) => {
    const where = finding.location.file
      ? `${finding.location.file}:${finding.location.line ?? "?"}`
      : (finding.location.url ?? "unknown location");
    const summary = finding.message.split(/(?<=\.)\s/)[0];
    return `- [${finding.severity}] ${finding.vulnerabilityType} at ${where} - ${summary}`;
  });
  if (findings.length > max) lines.push(`- ...and ${findings.length - max} more`);
  return lines;
}
