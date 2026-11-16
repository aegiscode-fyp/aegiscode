# @aegiscode/mcp-server

Local, zero-upload application security scanning for AI coding agents, over the
[Model Context Protocol](https://modelcontextprotocol.io). Your source code never leaves your machine.

## Use it in your agent

Claude Code:

```bash
claude mcp add aegiscode -- npx -y @aegiscode/mcp-server
```

Any other MCP client (Cursor, Windsurf, ...): add a stdio server whose command is
`npx` with the arguments `-y @aegiscode/mcp-server`.

## Tools

| Tool | What it does |
|---|---|
| `ping` | Checks the server is running; lists its tools and engines |

Requires Node.js 22 or newer.
