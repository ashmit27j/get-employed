// Aggregate + Finalize in one state (fewer state transitions on the free tier): work out the
// verdict, store it with a per-test summary (no test data), record the solve, push the result.
import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, env } from "../shared/aws";
import { keys } from "../shared/keys";
import { pushToUser } from "../shared/push";
import { publicSubmission } from "../shared/submission";
import type { BatchResult, CompileStepResult, Verdict } from "../shared/types";
import { aggregate } from "../shared/verdict";

export interface FinalizeEvent {
  submissionId: string;
  compile?: CompileStepResult;
  batches?: BatchResult[];
  error?: { Error?: string; Cause?: string };
}

export async function handler(event: FinalizeEvent): Promise<{ verdict: Verdict }> {
  const table = env("TABLE_NAME");
  const key = keys.submission(event.submissionId);
  const sub = (
    await ddb().send(new GetCommand({ TableName: table, Key: key, ConsistentRead: true }))
  ).Item;
  if (!sub) throw new Error(`submission ${event.submissionId} not found`);

  const now = new Date().toISOString();
  let fields: Record<string, unknown>;
  if (event.error) {
    console.error(
      "pipeline error",
      event.submissionId,
      event.error.Error,
      event.error.Cause?.slice(0, 1000),
    );
    fields = {
      status: "FAILED",
      verdict: "Internal Error" satisfies Verdict,
      message: "The judge couldn't finish this submission. Submit again in a moment.",
    };
  } else if (event.compile && !event.compile.ok) {
    fields = {
      status: "DONE",
      verdict: "Compile Error" satisfies Verdict,
      compileOutput: (event.compile.compileOutput ?? "").slice(0, 8000),
      tests: [],
      passed: 0,
      totalTests: event.compile.totalTests,
    };
  } else {
    const agg = aggregate(event.batches ?? [], event.compile?.totalTests ?? 0);
    fields = {
      status: "DONE",
      verdict: agg.verdict,
      tests: agg.tests,
      passed: agg.passed,
      totalTests: agg.total,
      failedTest: agg.failedTest,
      maxTimeMs: agg.maxTimeMs,
      maxMemKb: agg.maxMemKb,
    };
  }
  fields.finishedAt = now;

  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};
  const sets = Object.entries(fields).map(([k, v], i) => {
    names[`#f${i}`] = k;
    values[`:v${i}`] = v;
    return `#f${i} = :v${i}`;
  });
  const updated = await ddb().send(
    new UpdateCommand({
      TableName: table,
      Key: key,
      UpdateExpression: `SET ${sets.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    }),
  );
  const item = updated.Attributes ?? { ...sub, ...fields };

  if (fields.verdict === "Accepted" && sub.kind !== "validate") {
    await ddb()
      .send(
        new PutCommand({
          TableName: table,
          Item: {
            ...keys.solved(sub.userId as string, sub.slug as string),
            type: "solved",
            slug: sub.slug,
            language: sub.language,
            submissionId: event.submissionId,
            solvedAt: now,
          },
          ConditionExpression: "attribute_not_exists(PK)", // keep the first solve
        }),
      )
      .catch((err: Error) => {
        if (err.name !== "ConditionalCheckFailedException") throw err;
      });
  }

  await pushToUser(sub.userId as string, {
    type: "verdict",
    submissionId: event.submissionId,
    submission: publicSubmission(item),
  });
  return { verdict: fields.verdict as Verdict };
}
