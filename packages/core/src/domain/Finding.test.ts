import { describe, expect, it } from "vitest";
import { Finding, type FindingProps } from "./Finding.js";

const base: FindingProps = {
  findingId: "f1",
  engine: "SAST",
  vulnerabilityType: "sql-injection",
  severity: "high",
  message: "User input in SQL query",
  location: { file: "src/auth.js", line: 42 },
};

describe("Finding.overlaps", () => {
  it("is true for the same type at the same file and line", () => {
    const a = new Finding(base);
    const b = new Finding({ ...base, findingId: "f2", engine: "IAST" });
    expect(a.overlaps(b)).toBe(true);
  });

  it("is false for a different line", () => {
    const a = new Finding(base);
    const b = new Finding({ ...base, findingId: "f2", location: { file: "src/auth.js", line: 43 } });
    expect(a.overlaps(b)).toBe(false);
  });

  it("compares DAST findings by URL and parameter", () => {
    const dast: FindingProps = {
      ...base,
      engine: "DAST",
      location: { url: "http://localhost:3000/login", param: "name" },
    };
    expect(new Finding(dast).overlaps(new Finding({ ...dast, findingId: "f2" }))).toBe(true);
  });
});
