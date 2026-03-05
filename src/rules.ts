export type RuleType = "permit" | "forbid" | "require";

export interface Rule {
  type: RuleType;
  action: string;
  condition?: Record<string, unknown>;
  reason?: string;
}

export function parseRule(input: string): Rule {
  const match = input.match(/^(permit|forbid|require)\s+(\S+)(.*)$/i);
  if (!match) {
    throw new Error(`Invalid rule syntax: "${input}". Expected: permit|forbid|require <action> [reason...]`);
  }
  const type = match[1].toLowerCase() as RuleType;
  const action = match[2];
  const reason = match[3].trim() || undefined;
  return { type, action, reason };
}

export interface CheckResult {
  allowed: boolean;
  action: string;
  matchedRule: Rule | null;
  reason: string;
}

export function checkAction(
  action: string,
  _params: Record<string, unknown>,
  rules: Rule[]
): CheckResult {
  // Rules are evaluated in order; first match wins
  for (const rule of rules) {
    const matches =
      rule.action === "*" || rule.action === action || action.startsWith(rule.action + ".");

    if (!matches) continue;

    if (rule.type === "forbid") {
      return {
        allowed: false,
        action,
        matchedRule: rule,
        reason: rule.reason ?? `Action "${action}" is forbidden.`,
      };
    }

    if (rule.type === "permit") {
      return {
        allowed: true,
        action,
        matchedRule: rule,
        reason: rule.reason ?? `Action "${action}" is permitted.`,
      };
    }

    // "require" — treated as permit (the requirement is informational for the agent)
    if (rule.type === "require") {
      return {
        allowed: true,
        action,
        matchedRule: rule,
        reason: rule.reason ?? `Action "${action}" is permitted (requirement noted).`,
      };
    }
  }

  // Default: no matching rule → allowed (open policy)
  return {
    allowed: true,
    action,
    matchedRule: null,
    reason: `No rule matched action "${action}"; allowed by default.`,
  };
}
