#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server/createServer.js";

// Entry point that AI agents start (via `npx -y @aegiscode/mcp-server`).
// They talk to it over stdin/stdout, so nothing here may print to stdout.
const server = createServer();
await server.start(new StdioServerTransport());

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    void server.stop().finally(() => process.exit(0));
  });
}
