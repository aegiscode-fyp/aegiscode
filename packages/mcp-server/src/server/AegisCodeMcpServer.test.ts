import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ScanFailedError } from "@aegiscode/core";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { SilentLogger } from "../logging/Logger.js";
import { BaseTool } from "../tools/BaseTool.js";
import { PingTool } from "../tools/PingTool.js";
import { ToolRegistry } from "../tools/ToolRegistry.js";
import type { AegisCodeMcpServer } from "./AegisCodeMcpServer.js";
import { createServer } from "./createServer.js";

const Empty = z.object({});

/** A tool that always fails, to prove errors reach the agent instead of crashing the server. */
class AlwaysFailsTool extends BaseTool<typeof Empty, typeof Empty> {
  readonly name = "always_fails";
  readonly title = "Always fails";
  readonly description = "Test tool";
  readonly inputSchema = Empty;
  readonly outputSchema = Empty;
  protected async execute(): Promise<z.infer<typeof Empty>> {
    throw new ScanFailedError("Semgrep crashed");
  }
}

/** Connects a real MCP client to the server through an in-memory link (no processes). */
async function connect(server: AegisCodeMcpServer): Promise<Client> {
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await server.start(serverSide);
  const client = new Client({ name: "test-agent", version: "1.0.0" });
  await client.connect(clientSide);
  return client;
}

async function newServer(tools?: BaseTool[]): Promise<AegisCodeMcpServer> {
  const projectDir = await mkdtemp(join(tmpdir(), "aegiscode-mcp-"));
  return createServer({ projectDir, logger: new SilentLogger(), tools });
}

describe("AegisCodeMcpServer", () => {
  it("lists the ping tool to an agent", async () => {
    const client = await connect(await newServer());
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name)).toEqual(["ping"]);
    expect(tools[0]?.annotations?.readOnlyHint).toBe(true);
    await client.close();
  });

  it("answers ping with structured content", async () => {
    const client = await connect(await newServer());
    const result = await client.callTool({ name: "ping", arguments: {} });
    expect(result.isError).toBeFalsy();
    expect(result.structuredContent).toEqual({
      server: "aegiscode",
      version: "0.1.0",
      tools: ["ping"],
      engines: [],
    });
    await client.close();
  });

  it("returns engine errors to the agent as isError results", async () => {
    const client = await connect(await newServer([new PingTool(), new AlwaysFailsTool()]));
    const result = await client.callTool({ name: "always_fails", arguments: {} });
    expect(result.isError).toBe(true);
    expect(result.content).toEqual([{ type: "text", text: "SCAN_FAILED: Semgrep crashed" }]);
    await client.close();
  });
});

describe("ToolRegistry", () => {
  it("rejects two tools with the same name", () => {
    const registry = new ToolRegistry().register(new PingTool());
    expect(() => registry.register(new PingTool())).toThrow('Duplicate tool name "ping"');
  });
});
