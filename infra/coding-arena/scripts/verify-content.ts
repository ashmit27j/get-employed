// Runs both reference solutions of every judged problem through the real sandbox (local image
// via SANDBOX_URL, or the deployed function via SANDBOX_FUNCTION) and fails unless every test
// is Accepted. Warns when a reference uses more than half of the time limit.
// Usage: SANDBOX_URL=http://localhost:9000 pnpm content:verify [slug]
import { readFileSync } from "node:fs";
import * as path from "node:path";
import { invoke, target } from "../test/sandbox/invoke";
import { LANGUAGES } from "../shared/types";
import { judgeRun, planBatches } from "../shared/verdict";
import { builtTests, loadProblems } from "./content";

if (!target) {
  console.error("Set SANDBOX_URL (local image) or SANDBOX_FUNCTION (deployed) first.");
  process.exit(2);
}
console.log(`verifying against ${target}`);
let failed = 0;
for (const p of loadProblems(process.argv[2])) {
  const tests = builtTests(p.testsDir);
  const file = (n: number, ext: string) =>
    readFileSync(path.join(p.testsDir, `${n}.${ext}`), "utf8");
  const batches = planBatches(
    tests.map((n) => ({ n, bytes: file(n, "in").length + file(n, "out").length })),
  );
  for (const language of LANGUAGES) {
    const limit = language === "python" ? p.meta.pythonTimeLimitMs : p.meta.timeLimitMs;
    let worst = 0;
    let ok = 0;
    for (const batch of batches) {
      const res = await invoke({
        language,
        code: p.editorial.solutions[language],
        inputs: batch.map((n) => file(n, "in")),
        timeLimitMs: limit,
        memoryLimitMb: p.meta.memoryLimitMb,
      });
      if (!res.compile?.ok) {
        console.error(`✗ ${p.meta.slug} ${language}: compile error\n${res.compile?.output}`);
        failed++;
        break;
      }
      batch.forEach((n, i) => {
        const run = res.results![i]!;
        const t = judgeRun(n, run, file(n, "out"), p.meta.checker);
        worst = Math.max(worst, t.timeMs);
        if (t.verdict === "Accepted") ok++;
        else {
          failed++;
          console.error(
            `✗ ${p.meta.slug} ${language} test ${n}: ${t.verdict} (${t.timeMs} ms) ${run.stderr.slice(0, 300)}`,
          );
        }
      });
    }
    const note =
      worst > limit / 2 ? `  ! uses ${Math.round((worst / limit) * 100)}% of the limit` : "";
    console.log(
      `${ok === tests.length ? "✓" : "✗"} ${p.meta.slug} ${language}: ${ok}/${tests.length}, slowest ${worst} ms of ${limit}${note}`,
    );
  }
}
process.exit(failed ? 1 : 0);
