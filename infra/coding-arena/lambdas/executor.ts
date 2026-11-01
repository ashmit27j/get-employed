// Executor: the step between Step Functions and the sandbox. It runs outside the VPC with
// read access to test data, calls the sandbox synchronously with inputs only, and compares
// outputs here, so submitted code never sees an expected output. Step Functions state only
// ever carries {submissionId, batchId}; test data stays in S3 (256 KB state limit).
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, env } from "../shared/aws";
import { keys } from "../shared/keys";
import { pushToUser } from "../shared/push";
import type {
  BatchResult,
  CompileStepResult,
  Language,
  ProblemMeta,
  SandboxRequest,
  SandboxResponse,
  TestManifest,
} from "../shared/types";
import { judgeRun } from "../shared/verdict";

const lambda = new LambdaClient({});
const s3 = new S3Client({});

export type ExecutorEvent =
  | { mode: "compile"; submissionId: string }
  | { mode: "batch"; submissionId: string; batchId: number };

interface SubmissionRow {
  submissionId: string;
  userId: string;
  slug: string;
  language: Language;
  code: string;
  failed?: boolean;
  totalBatches?: number;
}

export async function handler(event: ExecutorEvent): Promise<CompileStepResult | BatchResult> {
  if (event.mode === "compile") return compileStep(event.submissionId);
  return batchStep(event.submissionId, event.batchId);
}

async function load(submissionId: string) {
  const table = env("TABLE_NAME");
  const sub = (
    await ddb().send(
      new GetCommand({
        TableName: table,
        Key: keys.submission(submissionId),
        ConsistentRead: true,
      }),
    )
  ).Item as SubmissionRow | undefined;
  if (!sub) throw new Error(`submission ${submissionId} not found`);
  const [meta, manifest] = await Promise.all([
    ddb().send(new GetCommand({ TableName: table, Key: keys.problem(sub.slug) })),
    ddb().send(new GetCommand({ TableName: table, Key: keys.tests(sub.slug) })),
  ]);
  if (!meta.Item) throw new Error(`problem ${sub.slug} not found`);
  return {
    table,
    sub,
    problem: meta.Item as ProblemMeta,
    manifest: manifest.Item as TestManifest | undefined,
  };
}

function limitsFor(problem: ProblemMeta, language: Language) {
  return {
    timeLimitMs: language === "python" ? problem.pythonTimeLimitMs : problem.timeLimitMs,
    memoryLimitMb: problem.memoryLimitMb,
  };
}

export async function invokeSandbox(req: SandboxRequest): Promise<SandboxResponse> {
  const out = await lambda.send(
    new InvokeCommand({
      FunctionName: env("SANDBOX_FUNCTION"),
      InvocationType: "RequestResponse",
      Payload: Buffer.from(JSON.stringify(req)),
    }),
  );
  const text = out.Payload ? Buffer.from(out.Payload).toString("utf8") : "";
  if (out.FunctionError) {
    // The sandbox process died mid-run (for example the program killed its own runner) or
    // timed out. That's the submission's doing, so it counts as a runtime error.
    console.warn("sandbox function error", out.FunctionError, text.slice(0, 500));
    // No compile block: in compile mode that reads as a compile failure.
    return { ok: true, results: [] };
  }
  const parsed = JSON.parse(text) as SandboxResponse;
  if (!parsed.ok) throw new Error(`sandbox rejected the request: ${parsed.error}`);
  return parsed;
}

async function compileStep(submissionId: string): Promise<CompileStepResult> {
  const { table, sub, problem, manifest } = await load(submissionId);
  if (!manifest || manifest.count === 0) throw new Error(`problem ${sub.slug} has no tests`);
  const batchIds = manifest.batches.map((_, i) => i);
  await ddb().send(
    new UpdateCommand({
      TableName: table,
      Key: keys.submission(submissionId),
      UpdateExpression:
        "SET #s = :running, totalBatches = :b, totalTests = :t, batchesDone = :zero, startedAt = :now",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: {
        ":running": "RUNNING",
        ":b": batchIds.length,
        ":t": manifest.count,
        ":zero": 0,
        ":now": new Date().toISOString(),
      },
    }),
  );
  await pushToUser(sub.userId, {
    type: "progress",
    submissionId,
    done: 0,
    total: batchIds.length,
    label: "Compiling",
  });
  const res = await invokeSandbox({
    language: sub.language,
    code: sub.code,
    inputs: [],
    ...limitsFor(problem, sub.language),
    compileOnly: true,
  });
  const compile = res.compile ?? {
    ok: false,
    output: "The judge couldn't compile this code.",
    timeMs: 0,
  };
  if (!compile.ok) {
    return { ok: false, compileOutput: compile.output, batchIds: [], totalTests: manifest.count };
  }
  return { ok: true, batchIds, totalTests: manifest.count };
}

async function readText(bucket: string, key: string): Promise<string> {
  const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return (await out.Body?.transformToString("utf8")) ?? "";
}

async function batchStep(submissionId: string, batchId: number): Promise<BatchResult> {
  const { table, sub, problem, manifest } = await load(submissionId);
  const numbers = manifest?.batches[batchId];
  if (!numbers) throw new Error(`batch ${batchId} missing for ${sub.slug}`);
  if (sub.failed) return { batchId, skipped: true, tests: [] }; // an earlier batch already failed

  const bucket = env("TESTS_BUCKET");
  const prefix = `problems/${sub.slug}/tests`;
  const files = await Promise.all(
    numbers.map(async (n) => ({
      n,
      input: await readText(bucket, `${prefix}/${n}.in`),
      expected: await readText(bucket, `${prefix}/${n}.out`),
    })),
  );
  const res = await invokeSandbox({
    language: sub.language,
    code: sub.code,
    inputs: files.map((f) => f.input),
    ...limitsFor(problem, sub.language),
    stopOnFailure: true,
  });

  const runs = res.results ?? [];
  const tests: BatchResult["tests"] = [];
  for (let i = 0; i < files.length; i++) {
    const run = runs[i];
    if (!run) {
      // The sandbox stopped early. If nothing ran, the runner itself was killed.
      if (tests.length === 0 || tests.at(-1)!.verdict === "Accepted") {
        tests.push({ n: files[i]!.n, verdict: "Runtime Error", timeMs: 0, memKb: 0 });
      }
      break;
    }
    const t = judgeRun(files[i]!.n, run, files[i]!.expected, problem.checker);
    tests.push(t);
    if (t.verdict !== "Accepted") break;
  }

  const failed = tests.some((t) => t.verdict !== "Accepted");
  const updated = await ddb().send(
    new UpdateCommand({
      TableName: table,
      Key: keys.submission(submissionId),
      UpdateExpression: failed ? "ADD batchesDone :one SET failed = :t" : "ADD batchesDone :one",
      ExpressionAttributeValues: failed ? { ":one": 1, ":t": true } : { ":one": 1 },
      ReturnValues: "ALL_NEW",
    }),
  );
  const done = Number(updated.Attributes?.batchesDone ?? 0);
  const total = Number(updated.Attributes?.totalBatches ?? manifest!.batches.length);
  await pushToUser(sub.userId, {
    type: "progress",
    submissionId,
    done,
    total,
    label: `Ran batch ${done} of ${total}`,
  });
  return { batchId, tests };
}
