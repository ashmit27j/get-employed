// Uploads content to the deployed stack: problems (META, EDITORIAL, TESTS manifest) and MCQ
// sets to DynamoDB, test files to S3. Run `pnpm content:build` first.
// Usage: pnpm seed [slug-or-setId]
import { readFileSync, statSync } from "node:fs";
import * as path from "node:path";
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { BatchWriteCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { problemItems } from "../lambdas/api";
import { ddb } from "../shared/aws";
import { keys } from "../shared/keys";
import type { TestManifest } from "../shared/types";
import { planBatches } from "../shared/verdict";
import { builtTests, loadMcqSets, loadProblems } from "./content";
import { stackOutputs } from "./outputs";

const { TableName, TestsBucket } = stackOutputs();
const s3 = new S3Client({});
const filter = process.argv[2];

for (const p of loadProblems(filter)) {
  const tests = builtTests(p.testsDir);
  if (tests.length === 0)
    throw new Error(`${p.meta.slug}: no built tests (run pnpm content:build)`);
  const prefix = `problems/${p.meta.slug}/tests/`;
  const sizes: { n: number; bytes: number }[] = [];
  for (const n of tests) {
    let bytes = 0;
    for (const ext of ["in", "out"]) {
      const file = path.join(p.testsDir, `${n}.${ext}`);
      bytes += statSync(file).size;
      await s3.send(
        new PutObjectCommand({
          Bucket: TestsBucket,
          Key: `${prefix}${n}.${ext}`,
          Body: readFileSync(file),
          ContentType: "text/plain",
        }),
      );
    }
    sizes.push({ n, bytes });
  }
  const keep = new Set(tests.flatMap((n) => [`${prefix}${n}.in`, `${prefix}${n}.out`]));
  const listed = await s3.send(new ListObjectsV2Command({ Bucket: TestsBucket, Prefix: prefix }));
  const stale = (listed.Contents ?? []).filter((o) => o.Key && !keep.has(o.Key));
  if (stale.length) {
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: TestsBucket,
        Delete: { Objects: stale.map((o) => ({ Key: o.Key! })) },
      }),
    );
  }

  const manifest: TestManifest = {
    count: tests.length,
    batches: planBatches(sizes),
    version: Date.now(),
    updatedAt: new Date().toISOString(),
  };
  const [meta, editorial] = problemItems(p.meta, p.editorial);
  await ddb().send(
    new BatchWriteCommand({
      RequestItems: {
        [TableName]: [
          { PutRequest: { Item: meta } },
          { PutRequest: { Item: editorial } },
          { PutRequest: { Item: { ...keys.tests(p.meta.slug), type: "tests", ...manifest } } },
        ],
      },
    }),
  );
  console.log(`✓ ${p.meta.slug}: ${tests.length} tests in ${manifest.batches.length} batches`);
}

for (const set of loadMcqSets(filter)) {
  await ddb().send(
    new PutCommand({
      TableName,
      Item: {
        ...keys.mcqSet(set.setId),
        ...keys.mcqByArena(set.arena, set.order, set.setId),
        type: "mcq",
        ...set,
      },
    }),
  );
  console.log(`✓ ${set.setId}: ${set.questions.length} questions`);
}
