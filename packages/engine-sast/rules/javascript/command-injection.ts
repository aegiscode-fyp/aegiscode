// TypeScript test cases for command-injection.yaml (ES module imports, NestJS source).
// This file is deliberately vulnerable and is never shipped in the npm package.
import * as childProcess from "child_process";
import { execSync } from "node:child_process";
import { Body, Controller, Post } from "@nestjs/common";

@Controller("tools")
export class ToolsController {
  @Post("lookup")
  lookup(@Body("domain") domain: string) {
    // ruleid: aegiscode.javascript.command-injection.tainted-exec, aegiscode.javascript.command-injection.exec-non-literal
    return childProcess.execSync(`whois ${domain}`).toString();
  }

  @Post("disk")
  disk(@Body() body: { path: string }) {
    // ruleid: aegiscode.javascript.command-injection.tainted-exec, aegiscode.javascript.command-injection.exec-non-literal
    return execSync("du -sh " + body.path).toString();
  }

  @Post("uptime")
  uptime() {
    // ok: aegiscode.javascript.command-injection.tainted-exec
    return execSync("uptime").toString();
  }
}
