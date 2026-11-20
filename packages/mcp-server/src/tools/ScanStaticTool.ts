import { resolve } from "node:path";
import { z } from "zod";
import { BaseTool } from "./BaseTool.js";
import { countBySeverity, describeCounts, describeFindings, FindingSchema, mostSevereFirst } from "./findings.js";
import type { ToolContext } from "./ToolContext.js";

/** Keeps the reply small enough for an agent's context; the rest is available via get_findings. */
const MAX_FINDINGS = 100;

const Input = z.object({
  path: z
    .string()
    .optional()
    .describe("Folder or file to scan, absolute or relative to the project. Default: the whole project."),
});

const Output = z.object({
  target: z.string().describe("Absolute path that was scanned"),
  durationMs: z.number(),
  total: z.number().int().describe("Number of findings"),
  counts: z.object({
    critical: z.number().int(),
    high: z.number().int(),
    medium: z.number().int(),
    low: z.number().int(),
    info: z.number().int(),
  }),
  findings: z
    .array(FindingSchema)
    .describe(`Most severe first, at most ${MAX_FINDINGS}. Use get_findings for the rest.`),
  warnings: z.array(z.string()).describe("Problems that may make the scan incomplete. Tell the user about them."),
});

/** SAST scan of the local project (FR-01, FR-15). Source code never leaves the machine. */
export class ScanStaticTool extends BaseTool<typeof Input, typeof Output> {
  readonly name = "scan_static";
  readonly title = "Scan code for vulnerabilities (SAST)";
  readonly description =
    "Scans the project's JavaScript/TypeScript source code for security vulnerabilities (SQL/NoSQL/command/code " +
    "injection, XSS, hardcoded secrets, weak cryptography, prototype pollution, path traversal, SSRF, open " +
    "redirect, insecure auth config) using Semgrep with AegisCode's bundled rules, fully offline. Returns findings " +
    "with file, line, severity and a fix hint, most severe first, and saves them for get_findings. " +
    "Takes seconds to a few minutes. Needs Semgrep or Docker installed.";
  readonly inputSchema = Input;
  readonly outputSchema = Output;
  override readonly annotations = { readOnlyHint: false, destructiveHint: false, openWorldHint: false };

  protected async execute(input: z.infer<typeof Input>, context: ToolContext): Promise<z.infer<typeof Output>> {
    const result = await context.pipeline.performStaticScan(resolve(context.projectDir, input.path ?? "."));
    const findings = mostSevereFirst(result.findings);
    return {
      target: result.target,
      durationMs: result.durationMs,
      total: findings.length,
      counts: countBySeverity(findings),
      findings: findings.slice(0, MAX_FINDINGS),
      warnings: result.warnings,
    };
  }

  protected override summarize(output: z.infer<typeof Output>): string {
    const seconds = (output.durationMs / 1000).toFixed(1);
    const lines =
      output.total === 0
        ? [`No security issues found in ${output.target} (${seconds}s).`]
        : [
            `Found ${output.total} security issue(s) (${describeCounts(output.counts)}) in ` +
              `${new Set(output.findings.map((finding) => finding.location.file)).size} file(s) (${seconds}s):`,
            ...describeFindings(output.findings),
          ];
    if (output.total > output.findings.length) {
      lines.push(`Only the ${output.findings.length} most severe are listed; call get_findings for the rest.`);
    }
    for (const warning of output.warnings) lines.push(`Warning: ${warning}`);
    return lines.join("\n");
  }
}
