/** Severity levels, ordered from least to most serious. */
export const SEVERITIES = ["info", "low", "medium", "high", "critical"] as const;

export type Severity = (typeof SEVERITIES)[number];

/** 0 = info ... 4 = critical. Used to compare, sort and filter findings. */
export function severityRank(severity: Severity): number {
  return SEVERITIES.indexOf(severity);
}
