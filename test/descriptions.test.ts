import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * The tool descriptions are the only part of this server an agent reads before
 * deciding to call it, and they are not covered by any behavioural test. The
 * verify_log description shipped in @nobulex/mcp-server@1.0.0 as
 * "Independently verify the integrity of the hash-chained audit log. Detects
 * any tampering." Both halves were false, and audit.test.ts now carries the
 * counterexample for the second: a wholesale rewrite by the log's own holder
 * verifies clean.
 *
 * A behavioural test proves the claim is wrong. It does not stop anyone
 * writing the claim back. This reads the source and does.
 */
const SOURCE = readFileSync(
  fileURLToPath(new URL("../src/index.ts", import.meta.url)),
  "utf8",
);

describe("tool descriptions", () => {
  it("claims no independence this package does not have", () => {
    // The verifier ships in the same package as the producer and reads the
    // same in-memory array. Nothing about it is independent, and an agent
    // reading "independently verify" would reasonably conclude otherwise.
    expect(SOURCE).not.toMatch(/independently verify/i);
    expect(SOURCE).not.toMatch(/independent (check|verification) of/i);
  });

  it("claims no detection stronger than a hash chain gives", () => {
    expect(SOURCE).not.toMatch(/detects any tampering/i);
    expect(SOURCE).not.toMatch(/tamper[- ]?proof/i);
  });

  it("states the limit wherever it mentions detection", () => {
    // If a description says it detects something, the same description has to
    // say what it does not detect. Checked per description string rather than
    // over the whole file: joining them would let one qualified sentence
    // satisfy the check for every other, which is the exact defect this
    // project was correcting in @nobulex/core the same week.
    const descriptions = [...SOURCE.matchAll(/^\s*"([^"]{40,})",\s*$/gm)].map(
      (m) => m[1]!,
    );
    expect(descriptions.length).toBeGreaterThan(0);

    for (const description of descriptions) {
      if (!/\bdetects?\b/i.test(description)) continue;
      expect(
        /does not detect|not an independent|only|partial/i.test(description),
        `description claims detection without stating its limit: ${description}`,
      ).toBe(true);
    }
  });
});
