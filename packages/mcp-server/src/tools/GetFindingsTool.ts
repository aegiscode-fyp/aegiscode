import { ENGINE_TYPES, SEVERITIES } from "@aegiscode/core";
import { z } from "zod";
import { BaseTool } from "./BaseTool.js";
import { describeFindings, FindingSchema, mostSevereFirst } from "./findings.js";
import type { ToolContext } from "./ToolContext.js";

const Input = z.object({
  engine: z.enum(ENGINE_TYPES).optional().describe("Only findings of this engine"),
  minSeverity: z.enum(SEVERITIES).optional().describe("Only findings at least this severe"),
  limit: z.number().int().min(1).max(200).default(50).describe("Maximum number of findings to return"),
});

const Output = z.object({
  total: z.number().int().describe("Number of stored findings that match the filters"),
  findings: z.array(FindingSchema).describe("Most severe first, at most `limit`"),
});

/** Returns the stored results of the latest scans without scanning again (FR-16). */
export class GetFindingsTool extends BaseTool<typeof Input, typeof Output> {
  readonly name = "get_findings";
  readonly title = "Get stored security findings";
  readonly description =
    "Returns the security findings saved by the latest scan of each engine (e.g. scan_static), most severe " +
    "first, without scanning again. Filter by engine and minimum severity. Use it to triage or fix issues " +
    "after a scan, or to see more findings than the scan returned.";
  readonly inputSchema = Input;
  readonly outputSchema = Output;
  override readonly annotations = { readOnlyHint: true, openWorldHint: false };

  protected async execute(input: z.infer<typeof Input>, context: ToolContext): Promise<z.infer<typeof Output>> {
    const findings = mostSevereFirst(
      await context.store.getFindings({ engine: input.engine, minSeverity: input.minSeverity }),
    );
    return { total: findings.length, findings: findings.slice(0, input.limit) };
  }

  protected override summarize(output: z.infer<typeof Output>): string {
    if (output.total === 0) {
      return "No stored findings match. Run scan_static first if the project has not been scanned.";
    }
    return [
      `${output.total} stored finding(s), showing ${output.findings.length}:`,
      ...describeFindings(output.findings, output.findings.length),
    ].join("\n");
  }
}
