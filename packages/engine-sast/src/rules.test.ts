// Checks the team conventions of every bundled Semgrep rule (build plan 5.1) without running
// Semgrep. Whether the rules actually match is checked by `npm run test:rules` (semgrep --test).
import { readdirSync, readFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { SEVERITIES } from "@aegiscode/core";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const RULES_DIR = fileURLToPath(new URL("../rules/", import.meta.url));

const VULNERABILITY_TYPES = [
  "sql-injection",
  "xss",
  "command-injection",
  "hardcoded-secret",
  "weak-crypto",
  "prototype-pollution",
  "path-traversal",
  "nosql-injection",
  "code-injection",
  "ssrf",
  "open-redirect",
  "insecure-auth-config",
];
const CONFIDENCES = ["low", "medium", "high"];

// Taint sources and sanitizers copied into several rule files; the copies must stay identical.
const SHARED_ANCHORS = ["x-request-source", "x-koa-source", "x-nest-source", "x-number-sanitizer"];

interface Rule {
  id: string;
  languages: string[];
  message: string;
  metadata?: Record<string, unknown>;
  paths?: { include?: string[] };
}

interface RuleFile {
  name: string;
  stem: string;
  doc: Record<string, unknown> & { rules: Rule[] };
  testSources: string[];
}

function loadRuleFiles(): RuleFile[] {
  const files: RuleFile[] = [];
  for (const language of readdirSync(RULES_DIR)) {
    const dir = join(RULES_DIR, language);
    const entries = readdirSync(dir);
    for (const entry of entries.filter((name) => name.endsWith(".yaml"))) {
      const stem = basename(entry, ".yaml");
      files.push({
        name: `${language}/${entry}`,
        stem,
        doc: parse(readFileSync(join(dir, entry), "utf8")),
        testSources: entries
          .filter((name) => name !== entry && basename(name, extname(name)) === stem)
          .map((name) => readFileSync(join(dir, name), "utf8")),
      });
    }
  }
  return files;
}

function annotatedIds(sources: string[], kind: "ruleid" | "ok"): Set<string> {
  const ids = new Set<string>();
  for (const source of sources) {
    for (const match of source.matchAll(new RegExp(`\\b${kind}:\\s*([\\w.,\\s-]+)`, "g"))) {
      for (const id of match[1]!.split(",")) ids.add(id.trim().split(/\s/)[0]!);
    }
  }
  return ids;
}

const ruleFiles = loadRuleFiles();
const allRules = ruleFiles.flatMap((file) => file.doc.rules.map((rule) => ({ file, rule })));

describe("bundled Semgrep rules", () => {
  it("has rule files", () => {
    expect(ruleFiles.length).toBeGreaterThan(0);
  });

  it("uses unique rule ids", () => {
    const ids = allRules.map(({ rule }) => rule.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(allRules.map(({ file, rule }) => [rule.id, file, rule] as const))(
    "%s follows the team conventions",
    (_id, file, rule) => {
      const match = /^aegiscode\.javascript\.([a-z-]+)\.[a-z0-9-]+$/.exec(rule.id);
      expect(match, "id must be aegiscode.javascript.<class>.<short-name>").not.toBeNull();
      const ruleClass = match![1]!;
      expect(file.stem.replace(/-templates$/, "")).toBe(ruleClass);

      const metadata = rule.metadata ?? {};
      expect(metadata.vulnerability_type).toBe(ruleClass);
      expect(VULNERABILITY_TYPES).toContain(metadata.vulnerability_type);
      expect(metadata.cwe).toMatch(/^CWE-\d+$/);
      expect(SEVERITIES).toContain(metadata.aegiscode_severity);
      expect(CONFIDENCES).toContain(metadata.confidence);

      const owasp = metadata.owasp as string[];
      expect(owasp).toHaveLength(2);
      expect(owasp[0]).toMatch(/^A\d\d:2021 - /);
      expect(owasp[1]).toMatch(/^A\d\d:2025 - /);

      // Findings leave the machine: a message must never repeat matched code or secret values.
      expect(rule.message).not.toMatch(/\$[A-Z][A-Z0-9_]*/);

      if (rule.languages.includes("generic")) {
        expect(rule.paths?.include?.length, "generic rules must limit their file types").toBeGreaterThan(0);
      }
    },
  );

  it.each(ruleFiles.map((file) => [file.name, file] as const))(
    "%s has a test for every rule (ruleid: and ok:)",
    (_name, file) => {
      expect(file.testSources.length).toBeGreaterThan(0);
      const flagged = annotatedIds(file.testSources, "ruleid");
      const clean = annotatedIds(file.testSources, "ok");
      for (const rule of file.doc.rules) {
        expect(flagged, `${rule.id} needs a "ruleid:" test`).toContain(rule.id);
        expect(clean, `${rule.id} needs an "ok:" test`).toContain(rule.id);
      }
    },
  );

  it.each(SHARED_ANCHORS)("keeps every copy of %s identical", (anchor) => {
    const copies = ruleFiles.filter((file) => anchor in file.doc).map((file) => file.doc[anchor]);
    expect(copies.length).toBeGreaterThan(0);
    for (const copy of copies) expect(copy).toEqual(copies[0]);
  });
});
