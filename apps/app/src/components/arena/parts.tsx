import Link from "next/link";
import {
  DIFFICULTY_LABEL,
  DIFFICULTY_TONE,
  verdictTone,
  type ArenaDifficulty,
  type ArenaVerdict,
} from "@ge/core";
import { Button, EmptyState, Icon, ToneBadge, type IconName } from "@ge/ui";

export function DifficultyBadge({ difficulty }: { difficulty: ArenaDifficulty }) {
  return (
    <ToneBadge tone={DIFFICULTY_TONE[difficulty]} dot={false}>
      {DIFFICULTY_LABEL[difficulty]}
    </ToneBadge>
  );
}

export function VerdictBadge({ verdict }: { verdict?: ArenaVerdict }) {
  return <ToneBadge tone={verdictTone(verdict)}>{verdict ?? "Judging"}</ToneBadge>;
}

/** Shown in place of Arena content when the judge isn't configured, is down, or the item is missing. */
export function ArenaUnavailable({ status, message }: { status: number; message: string }) {
  const notSetUp = status === 503;
  const missing = status === 404;
  const icon: IconName = notSetUp ? "plug" : missing ? "search" : "triangle-alert";
  return (
    <EmptyState
      icon={icon}
      title={
        notSetUp
          ? "Coding Arena isn't set up on this server"
          : missing
            ? "We couldn't find that"
            : "Coding Arena didn't respond"
      }
      body={
        notSetUp
          ? "The judge runs on AWS. Deploy infra/coding-arena and add its ARENA_* settings to turn it on."
          : message
      }
    >
      {!notSetUp && (
        <Button variant="secondary" size="sm" href="/arena">
          Back to Coding Arena
        </Button>
      )}
    </EmptyState>
  );
}

/** A ✓ circle for solved items, a dashed circle otherwise. */
export function SolvedMark({ solved }: { solved: boolean }) {
  return solved ? (
    <Icon name="circle-check" size={16} className="flex-none text-success-ink" />
  ) : (
    <Icon name="circle-dashed" size={16} className="flex-none text-ink-tertiary" />
  );
}

export function ResourceList({
  resources,
}: {
  resources: { title: string; url: string; kind: string }[];
}) {
  if (!resources.length) return null;
  const icon: Record<string, IconName> = {
    article: "book-open",
    video: "video",
    practice: "list-checks",
    visualizer: "eye",
    reference: "file-text",
  };
  return (
    <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
      {resources.map((r) => (
        <li key={r.url}>
          <a
            href={r.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-small text-ink-muted hover:text-ink"
          >
            <Icon name={icon[r.kind] ?? "link"} size={14} className="flex-none text-ink-subtle" />
            {r.title}
            <Icon name="external-link" size={12} className="text-ink-tertiary" />
          </a>
        </li>
      ))}
    </ul>
  );
}

export function ArenaCrumbLink({ href, children }: { href: string; children: string }) {
  return (
    <Link href={href} className="text-small text-ink-subtle hover:text-ink">
      {children}
    </Link>
  );
}
