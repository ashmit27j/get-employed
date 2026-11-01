import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import type { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { describe, expect, it } from "vitest";
import { rateLimitUpdate, takeSubmitSlot } from "../../shared/ratelimit";

/** In-memory stand-in that evaluates the same condition DynamoDB would. */
function fakeTable() {
  const rows = new Map<string, number>();
  return {
    rows,
    async send(cmd: UpdateCommand) {
      const input = cmd.input;
      const key = `${input.Key!.PK}|${input.Key!.SK}`;
      const v = input.ExpressionAttributeValues!;
      const last = rows.get(key);
      if (last !== undefined && last > (v[":cutoff"] as number)) {
        throw Object.assign(
          new ConditionalCheckFailedException({ message: "conditional", $metadata: {} }),
          { Item: { lastAt: { N: String(last) } } },
        );
      }
      rows.set(key, v[":now"] as number);
      return {};
    },
  };
}

describe("takeSubmitSlot", () => {
  it("allows the first submission and blocks a second inside the window", async () => {
    const db = fakeTable();
    expect(await takeSubmitSlot(db, "t", "u1", 1_000_000)).toEqual({ allowed: true });
    expect(await takeSubmitSlot(db, "t", "u1", 1_004_000)).toEqual({
      allowed: false,
      retryAfterMs: 6_000,
    });
  });
  it("allows again once the window has passed", async () => {
    const db = fakeTable();
    await takeSubmitSlot(db, "t", "u1", 1_000_000);
    expect(await takeSubmitSlot(db, "t", "u1", 1_010_000)).toEqual({ allowed: true });
  });
  it("keeps users independent", async () => {
    const db = fakeTable();
    await takeSubmitSlot(db, "t", "u1", 1_000_000);
    expect(await takeSubmitSlot(db, "t", "u2", 1_000_001)).toEqual({ allowed: true });
  });
  it("rethrows other errors", async () => {
    const db = { send: async () => Promise.reject(new Error("boom")) };
    await expect(takeSubmitSlot(db, "t", "u1")).rejects.toThrow("boom");
  });
  it("builds an atomic conditional update", () => {
    const input = rateLimitUpdate("t", "u1", 50_000, 10_000);
    expect(input.ConditionExpression).toContain("lastAt <= :cutoff");
    expect(input.ExpressionAttributeValues![":cutoff"]).toBe(40_000);
    expect(input.Key).toEqual({ PK: "USER#u1", SK: "RATE" });
  });
});
