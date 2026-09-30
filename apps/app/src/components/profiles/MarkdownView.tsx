import type { ReactNode } from "react";

/**
 * Minimal Markdown for README previews (MarkdownView in prototype/ge-app.js): # to ###, - lists,
 * ``` code blocks, **bold**, `code`, [text](url) and paragraphs. Output is React elements, never HTML.
 */
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g; // bold may contain a link
  let last = 0;
  let i = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const x = m[0];
    if (x.startsWith("**"))
      out.push(
        <strong key={`${key}b${i++}`} className="font-semibold text-ink">
          {inline(x.slice(2, -2), `${key}b${i}`)}
        </strong>,
      );
    else if (x.startsWith("`"))
      out.push(
        <code
          key={`${key}c${i++}`}
          className="rounded-xs bg-surface-3 px-[5px] py-px font-mono text-[0.9em]"
        >
          {x.slice(1, -1)}
        </code>,
      );
    else {
      const [, label, href] = /\[([^\]]+)\]\(([^)]+)\)/.exec(x)!;
      const safe = /^(https?:|mailto:)/i.test(href!) ? href : undefined;
      out.push(
        <a
          key={`${key}a${i++}`}
          href={safe}
          target="_blank"
          rel="noreferrer"
          className="text-primary no-underline hover:underline"
        >
          {label}
        </a>,
      );
    }
    last = m.index + x.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function MarkdownView({ source }: { source: string }) {
  const lines = source.split("\n");
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
      const cls =
        level === 1
          ? "mb-0.5 border-b border-hairline pb-1.5 text-title tracking-[-0.4px]"
          : level === 2
            ? "mt-2 border-b border-hairline pb-1.5 text-body"
            : "mt-2 text-small";
      const Tag = `h${level}` as "h1" | "h2" | "h3";
      out.push(
        <Tag key={k++} className={`m-0 font-semibold text-ink ${cls}`}>
          {inline(h[2]!, `h${k}`)}
        </Tag>,
      );
      i++;
      continue;
    }
    if (/^\s*-\s+/.test(l)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i]!))
        items.push(lines[i++]!.replace(/^\s*-\s+/, ""));
      out.push(
        <ul key={k++} className="m-0 flex list-disc flex-col gap-1 pl-5">
          {items.map((t, j) => (
            <li key={j}>{inline(t, `l${k}${j}`)}</li>
          ))}
        </ul>,
      );
      continue;
    }
    if (!l.trim()) {
      i++;
      continue;
    }
    const buf: string[] = [];
    while (i < lines.length && lines[i]!.trim() && !/^(#|```|\s*-\s)/.test(lines[i]!))
      buf.push(lines[i++]!);
    out.push(
      <p key={k++} className="m-0 text-pretty">
        {inline(buf.join(" "), `p${k}`)}
      </p>,
    );
  }
  return <div className="flex min-w-0 flex-col gap-3 text-small text-ink-muted">{out}</div>;
}
