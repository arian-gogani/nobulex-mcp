import { describe, it, expect } from "vitest";
import { parseRule, checkAction, Rule } from "../src/rules.js";

describe("parseRule", () => {
  it("parses a forbid rule", () => {
    const rule = parseRule("forbid delete_user");
    expect(rule).toEqual({ type: "forbid", action: "delete_user", reason: undefined });
  });

  it("parses a permit rule with reason", () => {
    const rule = parseRule("permit read_data safe to read");
    expect(rule).toEqual({ type: "permit", action: "read_data", reason: "safe to read" });
  });

  it("parses a require rule", () => {
    const rule = parseRule("require approval must get approval first");
    expect(rule).toEqual({ type: "require", action: "approval", reason: "must get approval first" });
  });

  it("is case-insensitive for rule type", () => {
    const rule = parseRule("FORBID nuke");
    expect(rule.type).toBe("forbid");
  });

  it("throws on invalid syntax", () => {
    expect(() => parseRule("allow something")).toThrow("Invalid rule syntax");
  });
});

describe("checkAction", () => {
  const rules: Rule[] = [
    { type: "forbid", action: "delete_user", reason: "Users cannot be deleted." },
    { type: "permit", action: "read_data" },
    { type: "forbid", action: "admin", reason: "All admin actions blocked." },
  ];

  it("blocks a forbidden action", () => {
    const result = checkAction("delete_user", {}, rules);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("Users cannot be deleted.");
  });

  it("permits an allowed action", () => {
    const result = checkAction("read_data", {}, rules);
    expect(result.allowed).toBe(true);
  });

  it("matches prefix (dotted hierarchy)", () => {
    const result = checkAction("admin.reset_password", {}, rules);
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("All admin actions blocked.");
  });

  it("allows unmatched actions by default", () => {
    const result = checkAction("send_email", {}, rules);
    expect(result.allowed).toBe(true);
    expect(result.matchedRule).toBeNull();
  });

  it("wildcard rule matches everything", () => {
    const wildcard: Rule[] = [{ type: "forbid", action: "*", reason: "Lockdown." }];
    const result = checkAction("anything", {}, wildcard);
    expect(result.allowed).toBe(false);
  });

  it("first match wins", () => {
    const ordered: Rule[] = [
      { type: "permit", action: "deploy" },
      { type: "forbid", action: "deploy" },
    ];
    const result = checkAction("deploy", {}, ordered);
    expect(result.allowed).toBe(true);
  });
});
