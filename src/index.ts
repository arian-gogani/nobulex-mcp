#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { Rule, parseRule, checkAction } from "./rules.js";
import { AuditLog } from "./audit.js";

const server = new McpServer({
  name: "nobulex-mcp",
  version: "1.0.0",
});

let rules: Rule[] = [];
const auditLog = new AuditLog();

// --- Tool: set_rules ---
server.tool(
  "set_rules",
  "Set covenant rules using permit/forbid/require syntax. Each rule is a string like 'forbid delete_user' or 'permit read_data safe to read'.",
  {
    rules: z.array(z.string()).describe(
      "Array of rule strings, e.g. ['forbid delete_user', 'permit read_data']"
    ),
  },
  async ({ rules: ruleStrings }) => {
    try {
      rules = ruleStrings.map(parseRule);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ ok: true, count: rules.length, rules }, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ ok: false, error: (err as Error).message }),
          },
        ],
        isError: true,
      };
    }
  }
);

// --- Tool: check_action ---
server.tool(
  "check_action",
  "Check whether an action is allowed or blocked by the current covenant rules.",
  {
    action: z.string().describe("The action name to check, e.g. 'delete_user'"),
    params: z
      .record(z.string(), z.unknown())
      .optional()
      .default({})
      .describe("Optional parameters for the action"),
  },
  async ({ action, params }) => {
    const result = checkAction(action, params, rules);
    auditLog.append(action, params, {
      allowed: result.allowed,
      reason: result.reason,
    });
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// --- Tool: get_audit_log ---
server.tool(
  "get_audit_log",
  "Returns the full hash-chained audit trail of all compliance checks.",
  {},
  async () => {
    const entries = auditLog.getAll();
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ count: entries.length, entries }, null, 2),
        },
      ],
    };
  }
);

// --- Tool: verify_log ---
server.tool(
  "verify_log",
  "Recompute this server's hash-chained audit log and report the first entry that does not match. Detects edits by a party that does not hold the whole log. It does not detect a wholesale rewrite by the holder, and it is not an independent check: this verifier ships in the same package as the producer.",
  {},
  async () => {
    const result = auditLog.verify();
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
