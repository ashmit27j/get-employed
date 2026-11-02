"use client";
import { useState, type ReactNode } from "react";
import { isFinished, LANGUAGE_LABEL, type ArenaLanguage, type ArenaSubmission } from "@ge/core";
import { Button, Icon, Panel, TextArea, TextInput } from "@ge/ui";
import { ArenaRequestError, arenaRequest, errorMessage } from "@/lib/arena-client";
import { VerdictBadge } from "./parts";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface Manifest {
  count: number;
  batches: number[][];
  version: number;
  updatedAt: string;
}

const NEW_PROBLEM = {
  meta: {
    slug: "new-problem",
    arena: "dsa",
    title: "New problem",
    difficulty: "easy",
    topics: ["arrays"],
    companyTags: [],
    roleTags: ["sde"],
    statementMd: "",
    inputFormatMd: "",
    outputFormatMd: "",
    constraintsMd: "",
    examples: [{ input: "", output: "", explanation: "" }],
    timeLimitMs: 2000,
    pythonTimeLimitMs: 5000,
    memoryLimitMb: 256,
    checker: "tokens",
    starter: { cpp: "", python: "" },
    resources: [],
    order: 100,
  },
  editorial: {
    hints: [""],
    editorialMd: "",
    complexity: { time: "", space: "" },
    solutions: { cpp: "", python: "" },
  },
};

function Feedback({ error, ok }: { error?: unknown; ok?: ReactNode }) {
  if (error) {
    const issues = error instanceof ArenaRequestError ? error.issues : [];
    return (
      <div className="flex flex-col gap-1 text-small text-danger-text" role="alert">
        {errorMessage(error) || "Something went wrong."}
        {issues.length > 0 && (
          <ul className="m-0 flex list-disc flex-col gap-0.5 pl-5 font-mono text-caption">
            {issues.map((i) => (
              <li key={i.path + i.message}>
                {i.path || "(body)"}: {i.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
  return ok ? (
    <p className="m-0 inline-flex items-center gap-1.5 text-small text-success-ink" role="status">
      <Icon name="circle-check" size={14} />
      {ok}
    </p>
  ) : null;
}

export function SetterTools() {
  return (
    <div className="flex flex-col gap-6">
      <ProblemEditor />
      <McqEditor />
    </div>
  );
}

function ProblemEditor() {
  const [slug, setSlug] = useState("");
  const [json, setJson] = useState("");
  const [tests, setTests] = useState<Manifest | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState<unknown>();
  const [ok, setOk] = useState<ReactNode>();
  const [files, setFiles] = useState<File[]>([]);
  const [runs, setRuns] = useState<Partial<Record<ArenaLanguage, ArenaSubmission>>>({});

  const run = async (what: string, fn: () => Promise<ReactNode>) => {
    setBusy(what);
    setError(undefined);
    setOk(undefined);
    try {
      setOk(await fn());
    } catch (e) {
      setError(e);
    } finally {
      setBusy("");
    }
  };
  const validSlug = SLUG.test(slug);

  const load = () =>
    run("load", async () => {
      const r = await arenaRequest<{
        meta: Record<string, unknown>;
        editorial: Record<string, unknown> | null;
        tests: Manifest | null;
      }>(`/admin/problems/${slug}`);
      const meta = Object.fromEntries(
        Object.entries(r.meta).filter(([k]) => !["type", "updatedAt"].includes(k)),
      );
      const editorial = r.editorial
        ? Object.fromEntries(
            Object.entries(r.editorial).filter(([k]) => !["slug", "type", "updatedAt"].includes(k)),
          )
        : NEW_PROBLEM.editorial;
      setJson(JSON.stringify({ meta, editorial }, null, 2));
      setTests(r.tests);
      return `Loaded ${slug}.`;
    });

  const save = () =>
    run("save", async () => {
      let body: { meta?: { slug?: string } };
      try {
        body = JSON.parse(json);
      } catch {
        throw new Error("That isn't valid JSON.");
      }
      const s = body.meta?.slug ?? "";
      if (!SLUG.test(s)) throw new Error("meta.slug must be lowercase words joined by dashes.");
      await arenaRequest(`/admin/problems/${s}`, { method: "PUT", body });
      setSlug(s);
      return `Saved ${s}. It shows in the problem list within a minute.`;
    });

  const pairs = (() => {
    const by = new Map(files.map((f) => [f.name, f]));
    let count = 0;
    while (by.has(`${count + 1}.in`) && by.has(`${count + 1}.out`)) count++;
    return { count, extra: files.length - count * 2 };
  })();

  const upload = () =>
    run("upload", async () => {
      if (!pairs.count) throw new Error("Choose files named 1.in, 1.out, 2.in, 2.out and so on.");
      if (pairs.extra)
        throw new Error("Every test needs both N.in and N.out, numbered from 1 with no gaps.");
      const { urls } = await arenaRequest<{ urls: Record<string, string> }>(
        `/admin/problems/${slug}/tests/upload-urls`,
        { method: "POST", body: { count: pairs.count } },
      );
      const by = new Map(files.map((f) => [f.name, f]));
      await Promise.all(
        Object.entries(urls).map(async ([name, url]) => {
          const res = await fetch(url, {
            method: "PUT",
            headers: { "content-type": "text/plain" },
            body: by.get(name),
          });
          if (!res.ok) throw new Error(`Uploading ${name} failed (${res.status}).`);
        }),
      );
      const { manifest } = await arenaRequest<{ manifest: Manifest }>(
        `/admin/problems/${slug}/tests/commit`,
        { method: "POST", body: { count: pairs.count } },
      );
      setTests(manifest);
      return `Uploaded ${manifest.count} tests (version ${manifest.version}).`;
    });

  const validate = () =>
    run("validate", async () => {
      const { submissions } = await arenaRequest<{
        submissions: Partial<Record<ArenaLanguage, string>>;
      }>(`/admin/problems/${slug}/validate`, {
        method: "POST",
        body: { languages: ["cpp", "python"] },
      });
      setRuns({});
      const results = await Promise.all(
        (Object.entries(submissions) as [ArenaLanguage, string][]).map(async ([lang, id]) => {
          for (let i = 0; i < 60; i++) {
            await new Promise((r) => setTimeout(r, 2000));
            const { submission } = await arenaRequest<{ submission: ArenaSubmission }>(
              `/submissions/${id}`,
            );
            setRuns((r) => ({ ...r, [lang]: submission }));
            if (isFinished(submission)) return submission;
          }
          throw new Error(`The ${LANGUAGE_LABEL[lang]} run didn't finish in two minutes.`);
        }),
      );
      return results.every((s) => s.verdict === "Accepted")
        ? "Both reference solutions pass every test."
        : "A reference solution failed. Check the results below.";
    });

  return (
    <Panel
      title="Judged problem"
      sub="Load a problem by its slug, edit the JSON, upload tests and check the reference solutions on the judge."
      icon="code-xml"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-2">
          <TextInput
            label="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.trim())}
            placeholder="drone-pairs"
            className="w-[260px]"
          />
          <Button variant="secondary" onClick={load} disabled={!validSlug || !!busy}>
            {busy === "load" ? "Loading" : "Load"}
          </Button>
          <Button
            variant="tertiary"
            onClick={() => {
              setJson(JSON.stringify(NEW_PROBLEM, null, 2));
              setTests(null);
              setOk(undefined);
              setError(undefined);
            }}
          >
            Start a new problem
          </Button>
        </div>
        <TextArea
          label="Problem and editorial (JSON)"
          hint="The same fields as content/<arena>/<slug>/ in infra/coding-arena, as { meta, editorial }."
          mono
          rows={18}
          value={json}
          onChange={(e) => setJson(e.target.value)}
          spellCheck={false}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={save} disabled={!json.trim() || !!busy}>
            {busy === "save" ? "Saving" : "Save problem"}
          </Button>
        </div>

        <div className="flex flex-col gap-2 border-t border-hairline pt-4">
          <div className="text-small font-medium text-ink">Tests</div>
          <p className="m-0 text-caption text-ink-subtle">
            {tests
              ? `${tests.count} tests in ${tests.batches.length} batches, version ${tests.version}.`
              : "No tests uploaded yet."}{" "}
            Choose N.in and N.out files numbered from 1. Uploading replaces the current set. Inputs
            can be up to 2.5 MB each and outputs up to 500 KB.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              multiple
              accept=".in,.out"
              aria-label="Test files"
              onChange={(e) => setFiles([...(e.target.files ?? [])])}
              className="text-small text-ink-muted file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-hairline-strong file:bg-surface-2 file:px-3 file:py-1.5 file:text-small file:text-ink"
            />
            {files.length > 0 && (
              <span className="font-mono text-caption text-ink-subtle">
                {pairs.count} pairs{pairs.extra ? `, ${pairs.extra} unmatched` : ""}
              </span>
            )}
            <Button
              variant="secondary"
              onClick={upload}
              disabled={!validSlug || !files.length || !!busy}
              iconLeft={<Icon name="upload" size={14} />}
            >
              {busy === "upload" ? "Uploading" : "Upload tests"}
            </Button>
            <Button
              variant="secondary"
              onClick={validate}
              disabled={!validSlug || !!busy}
              iconLeft={<Icon name="flask-conical" size={14} />}
            >
              {busy === "validate" ? "Validating" : "Validate references"}
            </Button>
          </div>
          {Object.keys(runs).length > 0 && (
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {(Object.entries(runs) as [ArenaLanguage, ArenaSubmission][]).map(([lang, s]) => (
                <li key={lang} className="flex items-center gap-3 text-small">
                  <span className="w-20 text-ink-muted">{LANGUAGE_LABEL[lang]}</span>
                  <VerdictBadge verdict={isFinished(s) ? s.verdict : undefined} />
                  {s.totalTests ? (
                    <span className="font-mono text-caption text-ink-subtle">
                      {s.passed ?? 0}/{s.totalTests} · slowest {s.maxTimeMs ?? 0} ms
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
        <Feedback error={error} ok={ok} />
      </div>
    </Panel>
  );
}

function McqEditor() {
  const [json, setJson] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [ok, setOk] = useState<ReactNode>();
  const save = async () => {
    setBusy(true);
    setError(undefined);
    setOk(undefined);
    try {
      let body: { setId?: string };
      try {
        body = JSON.parse(json);
      } catch {
        throw new Error("That isn't valid JSON.");
      }
      const id = body.setId ?? "";
      if (!SLUG.test(id)) throw new Error("setId must be lowercase words joined by dashes.");
      await arenaRequest(`/admin/mcq/${id}`, { method: "PUT", body });
      setOk(`Saved ${id}.`);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Panel
      title="Multiple-choice set"
      sub="Paste a set in the format of content/{aptitude,cs}/<setId>.json. Saving replaces the set with the same id."
      icon="list-checks"
    >
      <div className="flex flex-col gap-4">
        <TextArea
          label="Set (JSON)"
          mono
          rows={14}
          value={json}
          onChange={(e) => setJson(e.target.value)}
          spellCheck={false}
        />
        <div>
          <Button onClick={save} disabled={!json.trim() || busy}>
            {busy ? "Saving" : "Save set"}
          </Button>
        </div>
        <Feedback error={error} ok={ok} />
      </div>
    </Panel>
  );
}
