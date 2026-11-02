import Link from "next/link";
import type { ArenaMcqSetSummary, ArenaProgress } from "@ge/core";
import { EmptyState, Icon } from "@ge/ui";
import { DifficultyBadge } from "./parts";

export function McqList({
  sets,
  best,
}: {
  sets: ArenaMcqSetSummary[];
  best: ArenaProgress["mcq"];
}) {
  if (!sets.length) {
    return (
      <EmptyState
        icon="list-checks"
        title="No sets here yet"
        body="Problem setters haven't published anything in this arena. Check back soon."
      />
    );
  }
  const bestBy = new Map(best.map((b) => [b.setId, b]));
  const ordered = [...sets].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  return (
    <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
      {ordered.map((s) => {
        const b = bestBy.get(s.setId);
        return (
          <Link
            key={s.setId}
            href={`/arena/mcq/${s.setId}`}
            className="group box-border flex flex-col gap-3 rounded-lg border border-hairline bg-surface-1 p-5 text-ink shadow-edge transition-colors duration-(--duration-base) ease-standard hover:border-hairline-strong hover:bg-surface-2 hover:text-ink"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-body font-medium">{s.title}</span>
              <DifficultyBadge difficulty={s.difficulty} />
            </div>
            <p className="m-0 text-small text-pretty text-ink-subtle">{s.description}</p>
            <div className="mt-auto flex flex-wrap items-center gap-4 text-caption text-ink-subtle">
              <span className="inline-flex items-center gap-1.5">
                <Icon name="list-checks" size={13} />
                {s.questionCount} questions
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Icon name="timer" size={13} />
                {s.minutes} min
              </span>
              <span className="ml-auto font-mono">
                {b ? (
                  <span className="text-ink-muted">
                    Best {b.best} / {b.total}
                  </span>
                ) : (
                  "Not attempted"
                )}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
