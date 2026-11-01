import { ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { UpdateCommand, type UpdateCommandInput } from "@aws-sdk/lib-dynamodb";
import { keys } from "./keys";

export const SUBMIT_WINDOW_MS = 10_000;

export function rateLimitUpdate(
  table: string,
  userId: string,
  nowMs: number,
  windowMs = SUBMIT_WINDOW_MS,
): UpdateCommandInput {
  return {
    TableName: table,
    Key: keys.rate(userId),
    UpdateExpression: "SET lastAt = :now, #ttl = :ttl",
    ConditionExpression: "attribute_not_exists(lastAt) OR lastAt <= :cutoff",
    ExpressionAttributeNames: { "#ttl": "ttl" },
    ExpressionAttributeValues: {
      ":now": nowMs,
      ":cutoff": nowMs - windowMs,
      ":ttl": Math.floor((nowMs + windowMs) / 1000) + 3600,
    },
    ReturnValuesOnConditionCheckFailure: "ALL_OLD",
  };
}

export type RateResult = { allowed: true } | { allowed: false; retryAfterMs: number };

interface Sender {
  send(command: UpdateCommand): Promise<unknown>;
}

/** One submission per user per window, enforced atomically by a conditional write. */
export async function takeSubmitSlot(
  db: Sender,
  table: string,
  userId: string,
  nowMs = Date.now(),
  windowMs = SUBMIT_WINDOW_MS,
): Promise<RateResult> {
  try {
    await db.send(new UpdateCommand(rateLimitUpdate(table, userId, nowMs, windowMs)));
    return { allowed: true };
  } catch (err) {
    if (
      err instanceof ConditionalCheckFailedException ||
      (err as Error)?.name === "ConditionalCheckFailedException"
    ) {
      const item = (err as { Item?: Record<string, { N?: string }> }).Item;
      const last = Number(item?.lastAt?.N ?? nowMs);
      return { allowed: false, retryAfterMs: Math.max(0, last + windowMs - nowMs) };
    }
    throw err;
  }
}
