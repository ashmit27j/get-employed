// Coding Arena HTTP API (one function, small router). The Lambda authorizer has already
// verified the GetEmployed-minted token; its userId/isAdmin arrive in the request context.
import { randomUUID } from "node:crypto";
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { BatchWriteCommand, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type {
  APIGatewayProxyEventV2WithLambdaAuthorizer,
  APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import type { z } from "zod";
import { ddb, env } from "../shared/aws";
import { TTL, epochSeconds, keys } from "../shared/keys";
import { takeSubmitSlot } from "../shared/ratelimit";
import {
  McqAttemptSchema,
  McqSetSchema,
  ProblemUpsertSchema,
  SubmitSchema,
  TestUploadSchema,
  ValidateSchema,
} from "../shared/schemas";
import type { ArenaId, Language, McqSet, ProblemMeta, TestManifest } from "../shared/types";
import { ARENAS, JUDGED_ARENAS } from "../shared/types";
import { planBatches } from "../shared/verdict";
import { publicSubmission } from "../shared/submission";

type Event = APIGatewayProxyEventV2WithLambdaAuthorizer<{ userId: string; isAdmin: string }>;
type Res = APIGatewayProxyStructuredResultV2;
interface Ctx {
  userId: string;
  isAdmin: boolean;
  params: Record<string, string>;
  query: Record<string, string | undefined>;
  body: unknown;
}

const s3 = new S3Client({});
const sqs = new SQSClient({});
const table = () => env("TABLE_NAME");

const json = (statusCode: number, body: unknown): Res => ({
  statusCode,
  headers: { "content-type": "application/json", "cache-control": "no-store" },
  body: JSON.stringify(body),
});
const fail = (statusCode: number, error: string, extra: Record<string, unknown> = {}) =>
  json(statusCode, { error, ...extra });

function parse<T extends z.ZodType>(schema: T, body: unknown): z.infer<T> | Res {
  const r = schema.safeParse(body);
  if (r.success) return r.data;
  return fail(400, "Check the request and try again.", {
    issues: r.error.issues
      .slice(0, 10)
      .map((i) => ({ path: i.path.join("."), message: i.message })),
  });
}
const isRes = (v: unknown): v is Res => typeof v === "object" && v !== null && "statusCode" in v;

// ── caches (per warm container) ───────────────────────────────────────────────────────

const LIST_CACHE_MS = 60_000;
const listCache = new Map<string, { at: number; items: Record<string, unknown>[] }>();

async function arenaItems(arena: ArenaId, prefix: "P#" | "M#") {
  const cacheKey = `${arena}:${prefix}`;
  const hit = listCache.get(cacheKey);
  if (hit && Date.now() - hit.at < LIST_CACHE_MS) return hit.items;
  const items: Record<string, unknown>[] = [];
  let start: Record<string, unknown> | undefined;
  do {
    const out = await ddb().send(
      new QueryCommand({
        TableName: table(),
        IndexName: "GSI1",
        KeyConditionExpression: "GSI1PK = :a AND begins_with(GSI1SK, :p)",
        ExpressionAttributeValues: { ":a": `ARENA#${arena}`, ":p": prefix },
        ExclusiveStartKey: start,
      }),
    );
    items.push(...(out.Items ?? []));
    start = out.LastEvaluatedKey;
  } while (start);
  listCache.set(cacheKey, { at: Date.now(), items });
  return items;
}

async function userItems(userId: string, prefix: string) {
  const out = await ddb().send(
    new QueryCommand({
      TableName: table(),
      KeyConditionExpression: "PK = :u AND begins_with(SK, :p)",
      ExpressionAttributeValues: { ":u": keys.user(userId), ":p": prefix },
    }),
  );
  return out.Items ?? [];
}

async function getItem<T>(key: Record<string, string>): Promise<T | undefined> {
  return (await ddb().send(new GetCommand({ TableName: table(), Key: key }))).Item as T | undefined;
}

const stripKeys = (item: Record<string, unknown>) => {
  const { PK: _a, SK: _b, GSI1PK: _c, GSI1SK: _d, GSI2PK: _e, GSI2SK: _f, ...rest } = item;
  return rest;
};

const matches = (list: unknown, v?: string) => !v || (Array.isArray(list) && list.includes(v));

// ── problems ──────────────────────────────────────────────────────────────────────────

async function listProblems(c: Ctx): Promise<Res> {
  const arena = c.query.arena as ArenaId | undefined;
  if (!arena || !ARENAS.includes(arena)) return fail(400, "Choose an arena.");
  const [items, solved] = await Promise.all([
    arenaItems(arena, "P#"),
    userItems(c.userId, keys.solvedPrefix),
  ]);
  const solvedSet = new Set(solved.map((s) => s.slug as string));
  const q = c.query.q?.trim().toLowerCase();
  const list = items
    .filter(
      (p) =>
        (!c.query.difficulty || p.difficulty === c.query.difficulty) &&
        matches(p.topics, c.query.topic) &&
        matches(p.companyTags, c.query.company) &&
        matches(p.roleTags, c.query.role) &&
        (!q ||
          String(p.title).toLowerCase().includes(q) ||
          (p.topics as string[]).some((t) => t.includes(q))),
    )
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      arena: p.arena,
      difficulty: p.difficulty,
      topics: p.topics,
      companyTags: p.companyTags,
      roleTags: p.roleTags,
      order: p.order,
      solved: solvedSet.has(p.slug as string),
    }));
  return json(200, { problems: list });
}

async function getProblem(c: Ctx): Promise<Res> {
  const slug = c.params.slug!;
  const [meta, solved] = await Promise.all([
    getItem<ProblemMeta & Record<string, unknown>>(keys.problem(slug)),
    getItem(keys.solved(c.userId, slug)),
  ]);
  if (!meta) return fail(404, "That problem doesn't exist.");
  return json(200, { problem: { ...stripKeys(meta), solved: Boolean(solved) } });
}

async function getEditorial(c: Ctx): Promise<Res> {
  const ed = await getItem<Record<string, unknown>>(keys.editorial(c.params.slug!));
  if (!ed) return fail(404, "There's no editorial for this problem yet.");
  return json(200, { editorial: stripKeys(ed) });
}

async function mySubmissions(c: Ctx): Promise<Res> {
  const out = await ddb().send(
    new QueryCommand({
      TableName: table(),
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :k",
      ExpressionAttributeValues: { ":k": `USER#${c.userId}#P#${c.params.slug}` },
      ScanIndexForward: false,
      Limit: 25,
    }),
  );
  return json(200, {
    submissions: (out.Items ?? []).map((i) => ({ ...publicSubmission(i), code: i.code })),
  });
}

// ── submissions ───────────────────────────────────────────────────────────────────────

async function enqueue(item: Record<string, unknown>) {
  await ddb().send(new PutCommand({ TableName: table(), Item: item }));
  await sqs.send(
    new SendMessageCommand({
      QueueUrl: env("QUEUE_URL"),
      MessageBody: JSON.stringify({ submissionId: item.submissionId }),
    }),
  );
}

function submissionItem(
  userId: string,
  slug: string,
  language: Language,
  code: string,
  kind: "submit" | "validate",
) {
  const submissionId = randomUUID();
  const createdAt = new Date().toISOString();
  return {
    ...keys.submission(submissionId),
    // Validation runs stay out of the setter's own history.
    ...(kind === "submit" ? keys.submissionByUserProblem(userId, slug, createdAt) : {}),
    type: "submission",
    submissionId,
    userId,
    slug,
    language,
    code,
    kind,
    status: "QUEUED",
    createdAt,
    ttl: epochSeconds() + TTL.submissionSeconds,
  };
}

async function submit(c: Ctx): Promise<Res> {
  const body = parse(SubmitSchema, c.body);
  if (isRes(body)) return body;
  const [meta, manifest] = await Promise.all([
    getItem<ProblemMeta>(keys.problem(body.slug)),
    getItem<TestManifest>(keys.tests(body.slug)),
  ]);
  if (!meta) return fail(404, "That problem doesn't exist.");
  if (!JUDGED_ARENAS.includes(meta.arena)) return fail(400, "This problem isn't judged.");
  if (!manifest?.count) return fail(409, "This problem has no tests yet.");

  const slot = await takeSubmitSlot(ddb(), table(), c.userId);
  if (!slot.allowed) {
    const seconds = Math.ceil(slot.retryAfterMs / 1000);
    return {
      ...fail(429, `You can submit again in ${seconds} s.`, { retryAfterMs: slot.retryAfterMs }),
      headers: { "content-type": "application/json", "retry-after": String(seconds) },
    };
  }
  const item = submissionItem(c.userId, body.slug, body.language, body.code, "submit");
  await enqueue(item);
  return json(202, { submissionId: item.submissionId, status: item.status });
}

async function getSubmission(c: Ctx): Promise<Res> {
  const id = c.params.id!;
  if (!/^[0-9a-f-]{36}$/.test(id)) return fail(404, "That submission doesn't exist.");
  const item = await getItem<Record<string, unknown>>(keys.submission(id));
  if (!item || (item.userId !== c.userId && !c.isAdmin))
    return fail(404, "That submission doesn't exist.");
  return json(200, {
    submission: {
      ...publicSubmission(item),
      code: item.code,
      progress: { done: item.batchesDone ?? 0, total: item.totalBatches ?? 0 },
    },
  });
}

async function myProgress(c: Ctx): Promise<Res> {
  const [solved, attempts] = await Promise.all([
    userItems(c.userId, keys.solvedPrefix),
    userItems(c.userId, keys.mcqAttemptPrefix),
  ]);
  const best = new Map<
    string,
    { setId: string; best: number; total: number; attempts: number; lastAt: string }
  >();
  for (const a of attempts) {
    const cur = best.get(a.setId as string);
    const score = a.score as number;
    best.set(a.setId as string, {
      setId: a.setId as string,
      best: Math.max(cur?.best ?? 0, score),
      total: a.total as number,
      attempts: (cur?.attempts ?? 0) + 1,
      lastAt: a.at as string,
    });
  }
  return json(200, {
    solved: solved.map((s) => ({ slug: s.slug, solvedAt: s.solvedAt, language: s.language })),
    mcq: [...best.values()],
  });
}

// ── multiple choice ───────────────────────────────────────────────────────────────────

async function listMcq(c: Ctx): Promise<Res> {
  const arena = c.query.arena as ArenaId | undefined;
  if (!arena || !ARENAS.includes(arena)) return fail(400, "Choose an arena.");
  const items = await arenaItems(arena, "M#");
  return json(200, {
    sets: items
      .filter(
        (s) =>
          (!c.query.topic || s.topic === c.query.topic) && matches(s.companyTags, c.query.company),
      )
      .map((s) => {
        const { questions, ...rest } = stripKeys(s) as unknown as McqSet;
        return { ...rest, questionCount: questions.length };
      }),
  });
}

async function getMcq(c: Ctx): Promise<Res> {
  const set = await getItem<McqSet & Record<string, unknown>>(keys.mcqSet(c.params.setId!));
  if (!set) return fail(404, "That set doesn't exist.");
  const { questions, ...rest } = stripKeys(set) as unknown as McqSet;
  // Answers and explanations are only returned after an attempt.
  return json(200, {
    set: {
      ...rest,
      questions: questions.map(({ id, prompt, options }) => ({ id, prompt, options })),
    },
  });
}

async function attemptMcq(c: Ctx): Promise<Res> {
  const body = parse(McqAttemptSchema, c.body);
  if (isRes(body)) return body;
  const set = await getItem<McqSet>(keys.mcqSet(c.params.setId!));
  if (!set) return fail(404, "That set doesn't exist.");
  const review = set.questions.map((q, i) => {
    const chosen = body.answers[i] ?? -1;
    return {
      id: q.id,
      chosen,
      answer: q.answer,
      correct: chosen === q.answer,
      explanation: q.explanation,
    };
  });
  const score = review.filter((r) => r.correct).length;
  const at = new Date().toISOString();
  await ddb().send(
    new PutCommand({
      TableName: table(),
      Item: {
        ...keys.mcqAttempt(c.userId, set.setId, at),
        type: "mcq-attempt",
        setId: set.setId,
        score,
        total: set.questions.length,
        seconds: body.seconds,
        at,
      },
    }),
  );
  return json(200, { score, total: set.questions.length, review });
}

// ── admin (problem setters) ───────────────────────────────────────────────────────────

async function adminGetProblem(c: Ctx): Promise<Res> {
  const slug = c.params.slug!;
  const [meta, editorial, tests] = await Promise.all([
    getItem<Record<string, unknown>>(keys.problem(slug)),
    getItem<Record<string, unknown>>(keys.editorial(slug)),
    getItem<Record<string, unknown>>(keys.tests(slug)),
  ]);
  if (!meta) return fail(404, "That problem doesn't exist.");
  return json(200, {
    meta: stripKeys(meta),
    editorial: editorial ? stripKeys(editorial) : null,
    tests: tests ? stripKeys(tests) : null,
  });
}

export function problemItems(
  meta: ProblemMeta,
  editorial: unknown,
  now = new Date().toISOString(),
) {
  return [
    {
      ...keys.problem(meta.slug),
      ...keys.problemByArena(meta.arena, meta.difficulty, meta.order, meta.slug),
      type: "problem",
      ...meta,
      updatedAt: now,
    },
    {
      ...keys.editorial(meta.slug),
      type: "editorial",
      slug: meta.slug,
      ...(editorial as object),
      updatedAt: now,
    },
  ];
}

async function adminPutProblem(c: Ctx): Promise<Res> {
  const body = parse(ProblemUpsertSchema, c.body);
  if (isRes(body)) return body;
  if (body.meta.slug !== c.params.slug)
    return fail(400, "The slug in the body must match the URL.");
  const [meta, editorial] = problemItems({ ...body.meta, updatedAt: "" }, body.editorial);
  await ddb().send(
    new BatchWriteCommand({
      RequestItems: {
        [table()]: [{ PutRequest: { Item: meta } }, { PutRequest: { Item: editorial } }],
      },
    }),
  );
  listCache.clear();
  return json(200, { ok: true });
}

async function adminPutMcq(c: Ctx): Promise<Res> {
  const body = parse(McqSetSchema, c.body);
  if (isRes(body)) return body;
  if (body.setId !== c.params.setId) return fail(400, "The set id in the body must match the URL.");
  await ddb().send(
    new PutCommand({
      TableName: table(),
      Item: {
        ...keys.mcqSet(body.setId),
        ...keys.mcqByArena(body.arena, body.order, body.setId),
        type: "mcq",
        ...body,
      },
    }),
  );
  listCache.clear();
  return json(200, { ok: true });
}

const testKey = (slug: string, name: string) => `problems/${slug}/tests/${name}`;

async function adminUploadUrls(c: Ctx): Promise<Res> {
  const body = parse(TestUploadSchema, c.body);
  if (isRes(body)) return body;
  const slug = c.params.slug!;
  if (!(await getItem(keys.problem(slug))))
    return fail(404, "Save the problem before uploading tests.");
  const bucket = env("TESTS_BUCKET");
  const urls: Record<string, string> = {};
  for (let n = 1; n <= body.count; n++) {
    for (const ext of ["in", "out"]) {
      urls[`${n}.${ext}`] = await getSignedUrl(
        s3,
        new PutObjectCommand({
          Bucket: bucket,
          Key: testKey(slug, `${n}.${ext}`),
          ContentType: "text/plain",
        }),
        { expiresIn: 900 },
      );
    }
  }
  return json(200, { urls, expiresInSeconds: 900 });
}

async function adminCommitTests(c: Ctx): Promise<Res> {
  const body = parse(TestUploadSchema, c.body);
  if (isRes(body)) return body;
  const slug = c.params.slug!;
  const bucket = env("TESTS_BUCKET");
  const objects: { Key: string; Size: number }[] = [];
  let token: string | undefined;
  do {
    const out = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: `problems/${slug}/tests/`,
        ContinuationToken: token,
      }),
    );
    for (const o of out.Contents ?? []) objects.push({ Key: o.Key!, Size: o.Size ?? 0 });
    token = out.NextContinuationToken;
  } while (token);

  const byName = new Map(objects.map((o) => [o.Key.split("/").pop()!, o]));
  const missing: string[] = [];
  const sizes: { n: number; bytes: number }[] = [];
  for (let n = 1; n <= body.count; n++) {
    const i = byName.get(`${n}.in`);
    const o = byName.get(`${n}.out`);
    if (!i) missing.push(`${n}.in`);
    if (!o) missing.push(`${n}.out`);
    if (i && o) {
      if (i.Size > 2_500_000 || o.Size > 500_000)
        return fail(400, `Test ${n} is too large: inputs up to 2.5 MB, outputs up to 500 KB.`);
      sizes.push({ n, bytes: i.Size + o.Size });
    }
  }
  if (missing.length) return fail(400, "Some test files didn't upload.", { missing });

  const keep = new Set(
    Array.from({ length: body.count }, (_, k) => [`${k + 1}.in`, `${k + 1}.out`]).flat(),
  );
  const stale = objects.filter((o) => !keep.has(o.Key.split("/").pop()!));
  if (stale.length) {
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: stale.map((o) => ({ Key: o.Key })) },
      }),
    );
  }
  const prev = await getItem<TestManifest>(keys.tests(slug));
  const manifest: TestManifest = {
    count: body.count,
    batches: planBatches(sizes),
    version: (prev?.version ?? 0) + 1,
    updatedAt: new Date().toISOString(),
  };
  await ddb().send(
    new PutCommand({
      TableName: table(),
      Item: { ...keys.tests(slug), type: "tests", ...manifest },
    }),
  );
  return json(200, { manifest });
}

async function adminValidate(c: Ctx): Promise<Res> {
  const body = parse(ValidateSchema, c.body ?? {});
  if (isRes(body)) return body;
  const slug = c.params.slug!;
  const editorial = await getItem<{ solutions?: Record<Language, string> }>(keys.editorial(slug));
  if (!editorial?.solutions) return fail(409, "Add reference solutions before validating.");
  if (!(await getItem(keys.tests(slug)))) return fail(409, "Upload tests before validating.");
  const ids: Record<string, string> = {};
  for (const lang of body.languages) {
    const code = editorial.solutions[lang];
    if (!code) continue;
    const item = submissionItem(c.userId, slug, lang, code, "validate");
    await enqueue(item);
    ids[lang] = item.submissionId;
  }
  return json(202, { submissions: ids });
}

// ── router ────────────────────────────────────────────────────────────────────────────

type Handler = (c: Ctx) => Promise<Res>;
const ROUTES: {
  method: string;
  pattern: RegExp;
  names: string[];
  handler: Handler;
  admin?: boolean;
}[] = [];
function route(method: string, path: string, handler: Handler, admin = false) {
  const names: string[] = [];
  const pattern = new RegExp(
    `^${path.replace(/\{(\w+)\}/g, (_, n: string) => {
      names.push(n);
      return "([a-zA-Z0-9_-]{1,64})";
    })}$`,
  );
  ROUTES.push({ method, pattern, names, handler, admin });
}

route("GET", "/problems", listProblems);
route("GET", "/problems/{slug}", getProblem);
route("GET", "/problems/{slug}/editorial", getEditorial);
route("GET", "/problems/{slug}/submissions", mySubmissions);
route("POST", "/submissions", submit);
route("GET", "/submissions/{id}", getSubmission);
route("GET", "/me/progress", myProgress);
route("GET", "/mcq", listMcq);
route("GET", "/mcq/{setId}", getMcq);
route("POST", "/mcq/{setId}/attempts", attemptMcq);
route("GET", "/admin/problems/{slug}", adminGetProblem, true);
route("PUT", "/admin/problems/{slug}", adminPutProblem, true);
route("POST", "/admin/problems/{slug}/tests/upload-urls", adminUploadUrls, true);
route("POST", "/admin/problems/{slug}/tests/commit", adminCommitTests, true);
route("POST", "/admin/problems/{slug}/validate", adminValidate, true);
route("PUT", "/admin/mcq/{setId}", adminPutMcq, true);

export async function handler(event: Event): Promise<Res> {
  const auth = event.requestContext.authorizer?.lambda;
  if (!auth?.userId) return fail(401, "Sign in again.");
  const method = event.requestContext.http.method;
  const path = event.rawPath.replace(/\/+$/, "") || "/";
  for (const r of ROUTES) {
    if (r.method !== method) continue;
    const m = r.pattern.exec(path);
    if (!m) continue;
    if (r.admin && auth.isAdmin !== "true") return fail(403, "Only problem setters can do this.");
    let body: unknown;
    if (event.body) {
      try {
        body = JSON.parse(
          event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body,
        );
      } catch {
        return fail(400, "The request body isn't valid JSON.");
      }
    }
    const params = Object.fromEntries(r.names.map((n, i) => [n, m[i + 1]!]));
    try {
      return await r.handler({
        userId: auth.userId,
        isAdmin: auth.isAdmin === "true",
        params,
        query: event.queryStringParameters ?? {},
        body,
      });
    } catch (err) {
      console.error("handler error", method, path, err);
      return fail(500, "Something went wrong on our side. Try again.");
    }
  }
  return fail(404, "Not found.");
}
