// Generates tests for every judged problem: gen.py writes N.in, the Python reference writes
// N.out, and brute.py (when present) cross-checks every small test. Needs python on PATH
// (PYTHON overrides). Usage: pnpm content:build [slug]
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import { outputsMatch } from "../shared/compare";
import { loadProblems } from "./content";

const PYTHON = process.env.PYTHON ?? (process.platform === "win32" ? "python" : "python3");
const SMALL_INPUT_BYTES = 4096;
const MAX_IN = 2_500_000;
const MAX_OUT = 500_000;

function py(script: string, args: string[], input?: string, timeoutMs = 120_000): string {
  const r = spawnSync(PYTHON, ["-I", script, ...args], {
    input,
    encoding: "utf8",
    timeout: timeoutMs,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.error) throw r.error;
  if (r.status !== 0)
    throw new Error(`${path.basename(script)} failed (${r.status}): ${r.stderr.slice(0, 2000)}`);
  return r.stdout;
}

let failures = 0;
for (const p of loadProblems(process.argv[2])) {
  rmSync(p.testsDir, { recursive: true, force: true });
  py(path.join(p.dir, "gen.py"), [p.testsDir]);
  const tests = builtTestsIn(p.testsDir);
  let brute = 0;
  for (const n of tests) {
    const inPath = path.join(p.testsDir, `${n}.in`);
    const input = readFileSync(inPath, "utf8");
    if (Buffer.byteLength(input) > MAX_IN)
      throw new Error(`${p.meta.slug} test ${n}: input over 2.5 MB`);
    const expected = py(path.join(p.dir, "solution.py"), [], input);
    if (Buffer.byteLength(expected) > MAX_OUT)
      throw new Error(`${p.meta.slug} test ${n}: output over 500 KB`);
    writeFileSync(path.join(p.testsDir, `${n}.out`), expected);
    if (statSync(inPath).size <= SMALL_INPUT_BYTES && existsBrute(p.dir)) {
      const oracle = py(path.join(p.dir, "brute.py"), [], input, 30_000);
      brute++;
      if (!outputsMatch(oracle, expected, p.meta.checker)) {
        failures++;
        console.error(
          `✗ ${p.meta.slug} test ${n}: reference says ${expected.trim()}, brute force says ${oracle.trim()}`,
        );
      }
    }
  }
  // Every example must be test 1..k with the same answer, so the statement can't drift.
  p.meta.examples.forEach((ex, i) => {
    const got = readFileSync(path.join(p.testsDir, `${i + 1}.out`), "utf8");
    const inp = readFileSync(path.join(p.testsDir, `${i + 1}.in`), "utf8");
    if (!outputsMatch(ex.input, inp) || !outputsMatch(ex.output, got)) {
      failures++;
      console.error(`✗ ${p.meta.slug}: example ${i + 1} doesn't match test ${i + 1}`);
    }
  });
  console.log(`✓ ${p.meta.slug}: ${tests.length} tests (${brute} brute-checked)`);
  if (tests.length < 15 || tests.length > 30)
    console.warn(`  ! ${p.meta.slug} has ${tests.length} tests; aim for 15–30`);
}
if (failures) {
  console.error(`${failures} problem(s) failed`);
  process.exit(1);
}

function builtTestsIn(dir: string): number[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".in"))
    .map((f) => Number(f.slice(0, -3)))
    .sort((a, b) => a - b);
}
function existsBrute(dir: string) {
  try {
    return statSync(path.join(dir, "brute.py")).isFile();
  } catch {
    return false;
  }
}
