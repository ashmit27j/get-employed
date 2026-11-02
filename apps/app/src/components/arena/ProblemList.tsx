"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { tagLabel, type ArenaDifficulty, type ArenaProblemSummary } from "@ge/core";
import { Chip, Dropdown, EmptyState, Icon, Segmented, Tag, TextInput } from "@ge/ui";
import { DifficultyBadge, SolvedMark } from "./parts";

const DIFFICULTY_RANK: Record<ArenaDifficulty, number> = { easy: 0, medium: 1, hard: 2 };
const ALL_TOPICS = "All topics";

export function ProblemList({
  problems,
  initial,
}: {
  problems: ArenaProblemSummary[];
  initial: { role?: string; company?: string; topic?: string };
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [status, setStatus] = useState("all");
  const [topic, setTopic] = useState(initial.topic ?? "");
  const [role, setRole] = useState(initial.role ?? "");
  const [company, setCompany] = useState(initial.company ?? "");

  const topics = useMemo(() => [...new Set(problems.flatMap((p) => p.topics))].sort(), [problems]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return problems
      .filter(
        (p) =>
          (difficulty === "all" || p.difficulty === difficulty) &&
          (status === "all" || (status === "solved") === p.solved) &&
          (!topic || p.topics.includes(topic)) &&
          (!role || p.roleTags.includes(role)) &&
          (!company || p.companyTags.includes(company)) &&
          (!q || p.title.toLowerCase().includes(q) || p.topics.some((t) => t.includes(q))),
      )
      .sort(
        (a, b) =>
          DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty] ||
          a.order - b.order ||
          a.title.localeCompare(b.title),
      );
  }, [problems, query, difficulty, status, topic, role, company]);

  const solved = problems.filter((p) => p.solved).length;
  // Keep the URL in step with chips that came from it, so a reload shows the same list.
  const dropParam = (name: string) => {
    const url = new URL(window.location.href);
    url.searchParams.delete(name);
    router.replace(url.pathname + url.search, { scroll: false });
  };

  if (!problems.length) {
    return (
      <EmptyState
        icon="code-xml"
        title="No problems here yet"
        body="Problem setters haven't published anything in this arena. Check back soon."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <TextInput
          aria-label="Search problems"
          placeholder="Search by title or topic"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          iconLeft={<Icon name="search" size={14} />}
          className="w-[260px] max-md:w-full"
        />
        <Segmented
          label="Difficulty"
          value={difficulty}
          onChange={setDifficulty}
          options={[
            { value: "all", label: "All" },
            { value: "easy", label: "Easy" },
            { value: "medium", label: "Medium" },
            { value: "hard", label: "Hard" },
          ]}
        />
        <Segmented
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "all", label: "All" },
            { value: "unsolved", label: "To do" },
            { value: "solved", label: "Solved" },
          ]}
        />
        <Dropdown
          options={[ALL_TOPICS, ...topics.map(tagLabel)]}
          value={topic ? tagLabel(topic) : ALL_TOPICS}
          onChange={(v) => setTopic(topics.find((t) => tagLabel(t) === v) ?? "")}
          className="w-[180px]"
        />
        <span className="ml-auto font-mono text-caption text-ink-subtle">
          {solved} / {problems.length} solved
        </span>
      </div>
      {(role || company) && (
        <div className="flex flex-wrap items-center gap-2 text-caption text-ink-subtle">
          Practice for
          {role && (
            <Chip
              icon="briefcase"
              active
              onRemove={() => {
                setRole("");
                dropParam("role");
              }}
              removeLabel="Show every role"
            >
              {tagLabel(role)} roles
            </Chip>
          )}
          {company && (
            <Chip
              icon="building-2"
              active
              onRemove={() => {
                setCompany("");
                dropParam("company");
              }}
              removeLabel="Show every company"
            >
              {tagLabel(company)}
            </Chip>
          )}
        </div>
      )}
      {shown.length === 0 ? (
        <EmptyState
          icon="list-filter"
          title="No problems match these filters"
          body="Clear a filter or search for something else."
        />
      ) : (
        <ul className="m-0 flex list-none flex-col divide-y divide-hairline rounded-lg border border-hairline bg-surface-1 p-0">
          {shown.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/arena/problems/${p.slug}`}
                className="flex items-center gap-3 px-4 py-3 text-ink transition-colors duration-(--duration-base) ease-standard hover:bg-surface-2 hover:text-ink max-md:flex-wrap"
              >
                <SolvedMark solved={p.solved} />
                <span className="sr-only">{p.solved ? "Solved" : "Not solved yet"}</span>
                <span className="min-w-0 flex-1 truncate text-small font-medium">{p.title}</span>
                <span className="flex flex-wrap justify-end gap-1.5 max-md:order-last max-md:w-full max-md:justify-start max-md:pl-7">
                  {p.topics.slice(0, 3).map((t) => (
                    <Tag key={t}>{tagLabel(t)}</Tag>
                  ))}
                </span>
                <span className="flex w-[72px] justify-end">
                  <DifficultyBadge difficulty={p.difficulty} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
