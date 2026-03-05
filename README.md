# @nobulex/mcp-server

Nobulex MCP compliance server — covenant rule checking, hash-chained audit logs, and integrity verification for any MCP-compatible agent.

## Tools

| Tool | Description |
|------|-------------|
| `set_rules` | Set covenant rules using `permit`/`forbid`/`require` syntax |
| `check_action` | Check if an action is allowed or blocked by current rules |
| `get_audit_log` | Return the full hash-chained audit trail |
| `verify_log` | Verify integrity of the audit chain (detect tampering) |

## Rule Syntax

```
forbid delete_user Users cannot be deleted
permit read_data Safe to read
require approval Must get approval first
forbid admin.* All admin actions blocked
forbid * Lockdown mode
```

Rules are evaluated in order — first match wins. Unmatched actions are allowed by default.

## Setup

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "nobulex": {
      "command": "npx",
      "args": ["-y", "@nobulex/mcp-server"]
    }
  }
}
```

Config file locations:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

### Cursor

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "nobulex": {
      "command": "npx",
      "args": ["-y", "@nobulex/mcp-server"]
    }
  }
}
```

### Any MCP Client

The server uses stdio transport. Run it with:

```bash
npx @nobulex/mcp-server
```

## Development

```bash
npm install
npm run build
npm test
```

## License

MIT
