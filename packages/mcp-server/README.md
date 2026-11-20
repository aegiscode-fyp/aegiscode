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
| `scan_static` | Scans the project's JavaScript/TypeScript code with Semgrep and AegisCode's 52 bundled rules (injection, XSS, secrets, weak crypto, prototype pollution, path traversal, SSRF, ...) |
| `get_findings` | Returns the saved findings of the latest scan, filtered by engine and severity |

## Requirements

- Node.js 22 or newer.
- For `scan_static`: [Semgrep](https://semgrep.dev) installed, **or** Docker running (AegisCode then runs
  Semgrep in a container with networking disabled). Rules are bundled; nothing is downloaded during a scan.

Results are saved in `.aegiscode/findings.json` inside your project. Add `.aegiscode/` to your `.gitignore`.
