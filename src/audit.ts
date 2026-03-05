import { createHash } from "node:crypto";

export interface AuditEntry {
  index: number;
  timestamp: string;
  action: string;
  params: Record<string, unknown>;
  result: { allowed: boolean; reason: string };
  previousHash: string;
  hash: string;
}

function computeHash(entry: Omit<AuditEntry, "hash">): string {
  const payload = JSON.stringify({
    index: entry.index,
    timestamp: entry.timestamp,
    action: entry.action,
    params: entry.params,
    result: entry.result,
    previousHash: entry.previousHash,
  });
  return createHash("sha256").update(payload).digest("hex");
}

const GENESIS_HASH = "0".repeat(64);

export class AuditLog {
  private entries: AuditEntry[] = [];

  append(
    action: string,
    params: Record<string, unknown>,
    result: { allowed: boolean; reason: string }
  ): AuditEntry {
    const previousHash =
      this.entries.length > 0
        ? this.entries[this.entries.length - 1].hash
        : GENESIS_HASH;

    const partial = {
      index: this.entries.length,
      timestamp: new Date().toISOString(),
      action,
      params,
      result,
      previousHash,
    };

    const hash = computeHash(partial);
    const entry: AuditEntry = { ...partial, hash };
    this.entries.push(entry);
    return entry;
  }

  getAll(): AuditEntry[] {
    return [...this.entries];
  }

  verify(): { valid: boolean; entries: number; error?: string } {
    if (this.entries.length === 0) {
      return { valid: true, entries: 0 };
    }

    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];

      // Check previousHash linkage
      const expectedPrev =
        i === 0 ? GENESIS_HASH : this.entries[i - 1].hash;
      if (entry.previousHash !== expectedPrev) {
        return {
          valid: false,
          entries: this.entries.length,
          error: `Entry ${i}: previousHash mismatch.`,
        };
      }

      // Recompute hash
      const { hash, ...rest } = entry;
      const recomputed = computeHash(rest);
      if (recomputed !== hash) {
        return {
          valid: false,
          entries: this.entries.length,
          error: `Entry ${i}: hash mismatch (tampering detected).`,
        };
      }
    }

    return { valid: true, entries: this.entries.length };
  }
}
