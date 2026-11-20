import { readFileSync } from "node:fs";
import { ScanFailedError } from "@aegiscode/core";
import { describe, expect, it } from "vitest";
import { SemgrepOutputParser } from "./SemgrepOutputParser.js";

const fixture = readFileSync(new URL("./__fixtures__/semgrep-output.json", import.meta.url), "utf8");

describe("SemgrepOutputParser", () => {
  const parser = new SemgrepOutputParser();

  it("turns Semgrep results into findings and keeps one per problem and line", () => {
    const { findings } = parser.parse(fixture);
    expect(findings).toHaveLength(2);

    const sqli = findings.find((finding) => finding.vulnerabilityType === "sql-injection")!;
    expect(sqli.ruleId).toBe("aegiscode.javascript.sql-injection.tainted-query");
    expect(sqli.severity).toBe("critical");
    expect(sqli.cwe).toBe("CWE-89");
    expect(sqli.location).toEqual({ file: "src/routes/users.js", line: 4, column: 12 });
    expect(sqli.findingId).toMatch(/^[0-9a-f]{16}$/);
  });

  it("strips any rules-folder prefix from the rule id and normalizes Windows paths", () => {
    const xss = parser.parse(fixture).findings.find((finding) => finding.vulnerabilityType === "xss")!;
    expect(xss.ruleId).toBe("aegiscode.javascript.xss.tainted-response");
    expect(xss.location.file).toBe("src/routes/users.js");
  });

  it("falls back to Semgrep's severity when the rule has no aegiscode_severity", () => {
    const xss = parser.parse(fixture).findings.find((finding) => finding.vulnerabilityType === "xss")!;
    expect(xss.severity).toBe("medium");
  });

  it("gives the same finding the same id in every scan", () => {
    const first = parser.parse(fixture).findings.map((finding) => finding.findingId);
    const second = parser.parse(fixture).findings.map((finding) => finding.findingId);
    expect(second).toEqual(first);
  });

  it("reports partial scans as warnings without quoting the user's code", () => {
    const { warnings } = parser.parse(fixture);
    expect(warnings).toEqual(["src/broken.js could not be fully parsed, so parts of it were not checked."]);
  });

  it("never copies matched code or secret values into findings (FR-10)", () => {
    const output = JSON.stringify(parser.parse(fixture));
    expect(output).not.toContain("FIXTURE-SECRET-VALUE");
    expect(output).not.toContain("function broken");
  });

  it("warns when Semgrep scanned no files", () => {
    const { findings, warnings } = parser.parse(JSON.stringify({ results: [], errors: [], paths: { scanned: [] } }));
    expect(findings).toEqual([]);
    expect(warnings[0]).toMatch(/scanned no files/);
  });

  it("fails on output that is not Semgrep JSON instead of reporting a clean scan", () => {
    expect(() => parser.parse("Traceback (most recent call last)")).toThrow(ScanFailedError);
    expect(() => parser.parse("{}")).toThrow(ScanFailedError);
  });
});
