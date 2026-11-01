// Loads Coding Arena content from content/<arena>/... and validates it with the same
// schemas the API uses.
//   judged problems: content/{dsa,logic}/<slug>/ {meta.json, statement.md, input.md, output.md,
//                    constraints.md, editorial.md, starter.*, solution.*, gen.py, brute.py?}
//   MCQ sets:        content/{aptitude,cs}/<setId>.json
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { EditorialSchema, McqSetSchema, ProblemMetaSchema } from "../shared/schemas";
import type { Editorial, McqSet, ProblemMeta } from "../shared/types";

export const CONTENT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../content");

export interface LoadedProblem {
  dir: string;
  testsDir: string;
  meta: ProblemMeta;
  editorial: Editorial;
}

const read = (dir: string, name: string) =>
  readFileSync(path.join(dir, name), "utf8").replace(/\r\n/g, "\n");

export function loadProblems(filter?: string): LoadedProblem[] {
  const out: LoadedProblem[] = [];
  for (const arena of ["dsa", "logic"]) {
    const root = path.join(CONTENT, arena);
    if (!existsSync(root)) continue;
    for (const slug of readdirSync(root).sort()) {
      const dir = path.join(root, slug);
      if (!statSync(dir).isDirectory() || (filter && slug !== filter)) continue;
      const raw = JSON.parse(read(dir, "meta.json")) as Record<string, unknown>;
      const meta = ProblemMetaSchema.parse({
        ...raw,
        arena,
        statementMd: read(dir, "statement.md"),
        inputFormatMd: read(dir, "input.md"),
        outputFormatMd: read(dir, "output.md"),
        constraintsMd: read(dir, "constraints.md"),
        starter: { cpp: read(dir, "starter.cpp"), python: read(dir, "starter.py") },
      });
      if (meta.slug !== slug) throw new Error(`${dir}: meta.slug must be "${slug}"`);
      const editorial = EditorialSchema.parse({
        hints: raw.hints,
        complexity: raw.complexity,
        editorialMd: read(dir, "editorial.md"),
        solutions: { cpp: read(dir, "solution.cpp"), python: read(dir, "solution.py") },
      });
      out.push({
        dir,
        testsDir: path.join(dir, "tests"),
        meta: { ...meta, updatedAt: "" },
        editorial,
      });
    }
  }
  return out;
}

export function loadMcqSets(filter?: string): McqSet[] {
  const out: McqSet[] = [];
  for (const arena of ["aptitude", "cs"]) {
    const root = path.join(CONTENT, arena);
    if (!existsSync(root)) continue;
    for (const file of readdirSync(root)
      .filter((f) => f.endsWith(".json"))
      .sort()) {
      const set = McqSetSchema.parse({ ...JSON.parse(read(root, file)), arena });
      if (filter && set.setId !== filter) continue;
      if (`${set.setId}.json` !== file) throw new Error(`${file}: setId must match the file name`);
      out.push(set);
    }
  }
  return out;
}

/** Test numbers present in a built tests/ directory. */
export function builtTests(testsDir: string): number[] {
  if (!existsSync(testsDir)) return [];
  return readdirSync(testsDir)
    .filter((f) => f.endsWith(".in"))
    .map((f) => Number(f.slice(0, -3)))
    .filter((n) => existsSync(path.join(testsDir, `${n}.out`)))
    .sort((a, b) => a - b);
}
