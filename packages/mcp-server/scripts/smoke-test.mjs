// Starts the BUILT server the same way an AI agent does (a child process over stdio),
// lists its tools and calls `ping`.
//   node scripts/smoke-test.mjs                         -> runs node dist/index.js
//   node scripts/smoke-test.mjs <command> [args...]     -> e.g. an installed aegiscode-mcp
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const [command = process.execPath, ...args] = process.argv.length > 2 ? process.argv.slice(2) : [process.execPath, "dist/index.js"];

const client = new Client({ name: "aegiscode-smoke-test", version: "1.0.0" });
await client.connect(new StdioClientTransport({ command, args, stderr: "inherit" }));

const { tools } = await client.listTools();
console.log(`tools: ${tools.map((tool) => tool.name).join(", ")}`);

const result = await client.callTool({ name: "ping", arguments: {} });
console.log(`ping: ${result.content[0].text}`);
console.log(`structured: ${JSON.stringify(result.structuredContent)}`);

await client.close();
