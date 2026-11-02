import type { ReactNode } from "react";
import { cx } from "@ge/ui";

/**
 * Markdown for problem statements and editorials: ## and ### headings, paragraphs, - and 1. lists,
 * ``` code blocks, | tables |, **bold**, _italic_, `code` and [links](https://…). Output is React
 * elements only, never HTML, because problem text comes from the judge's database.
 */
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re =
    /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\)|(?<![\w*])[_*][^_*\s][^_*]*[_*](?![\w*]))/g;
  let last = 0;
  let i = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const x = m[0];
    const k = `${key}-${i++}`;
    if (x.startsWith("**")) {
      out.push(
        <strong key={k} className="font-semibold text-ink">
          {inline(x.slice(2, -2), k)}
        </strong>,
      );
    } else if (x.startsWith("`")) {
      out.push(
        <code
          key={k}
          className="rounded-xs bg-surface-3 px-[5px] py-px font-mono text-[0.9em] text-ink"
        >
          {x.slice(1, -1)}
        </code>,
      );
    } else if (x.startsWith("[")) {
      const [, label, href] = /\[([^\]]+)\]\(([^)\s]+)\)/.exec(x)!;
      const safe = /^https:\/\//i.test(href!) ? href : undefined;
      out.push(
        <a
          key={k}
          href={safe}
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline"
        >
          {label}
        </a>,
      );
    } else {
      out.push(<em key={k}>{inline(x.slice(1, -1), k)}</em>);
    }
    last = m.index + x.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const cells = (row: string) =>
  row
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());

const BLOCK_START = /^(#{1,3}\s|```|\s*[-*]\s|\s*\d+\.\s|\|)/;

export function ArenaMarkdown({ source, className }: { source: string; className?: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  let k = 0;
  while (i < lines.length) {
    const l = lines[i]!;
    if (l.startsWith("```")) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i]!.startsWith("```")) buf.push(lines[i++]!);
      i++;
      out.push(
        <pre
          key={k++}
          className="m-0 overflow-x-auto rounded-md border border-hairline bg-surface-2 px-3 py-2.5 font-mono text-caption leading-[1.6] text-ink-muted"
        >
          {buf.join("\n")}
        </pre>,
      );
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(l);
    if (h) {
      const level = h[1]!.length;
      const Tag = level === 1 ? "h2" : level === 2 ? "h3" : "h4";
      out.push(
        <Tag
          key={k++}
          className={cx(
            "m-0 font-semibold text-ink",
            level <= 2 ? "mt-2 text-body" : "mt-1 text-small",
          )}
        >
          {inline(h[2]!, `h${k}`)}
        </Tag>,
      );
      i++;
      continue;
    }
    if (l.trim().startsWith("|")) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i]!.trim().startsWith("|")) {
        const r = cells(lines[i++]!);
        if (!r.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(r);
      }
      const [head, ...body] = rows;
      out.push(
        <div key={k++} className="overflow-x-auto rounded-md border border-hairline">
          <table className="w-full border-collapse text-caption">
            {head && (
              <thead>
                <tr className="bg-surface-2">
                  {head.map((c, j) => (
                    <th key={j} scope="col" className="px-3 py-2 text-left font-medium text-ink">
                      {inline(c, `th${k}${j}`)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {body.map((r, ri) => (
                <tr key={ri} className="border-t border-hairline">
                  {r.map((c, j) => (
                    <td key={j} className="px-3 py-1.5 align-top font-mono text-ink-muted">
                      {inline(c, `td${k}${ri}${j}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    const list = /^\s*([-*]|\d+\.)\s+/.exec(l);
    if (list) {
      const ordered = /\d/.test(list[1]!);
      const items: string[] = [];
      const itemRe = ordered ? /^\s*\d+\.\s+/ : /^\s*[-*]\s+/;
      while (i < lines.length && itemRe.test(lines[i]!))
        items.push(lines[i++]!.replace(itemRe, ""));
      const ListTag = ordered ? "ol" : "ul";
      out.push(
        <ListTag
          key={k++}
          className={cx("m-0 flex flex-col gap-1 pl-5", ordered ? "list-decimal" : "list-disc")}
        >
          {items.map((t, j) => (
            <li key={j}>{inline(t, `l${k}${j}`)}</li>
          ))}
        </ListTag>,
      );
      continue;
    }
    if (!l.trim()) {
      i++;
      continue;
    }
    const buf: string[] = [];
    while (i < lines.length && lines[i]!.trim() && !BLOCK_START.test(lines[i]!))
      buf.push(lines[i++]!);
    out.push(
      <p key={k++} className="m-0 text-pretty">
        {inline(buf.join(" "), `p${k}`)}
      </p>,
    );
  }
  return (
    <div
      className={cx(
        "flex min-w-0 flex-col gap-3 text-small leading-[1.65] text-ink-muted",
        className,
      )}
    >
      {out}
    </div>
  );
}
