"use client";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChatAction as ActionCard,
  ChatBubble,
  Chip,
  Icon,
  MatchRing,
  SalaryBadge,
  cx,
  isIconName,
  type IconName,
} from "@ge/ui";
import type { ChatAction } from "@ge/core";
import { salaryProps } from "@/components/jobs/JobRow";
import { useDictation } from "@/lib/useDictation";
import type { ChatJob, ChatMessageView } from "@/server/assistant/threads";

const MAX = 3000;
const PROMPTS: [IconName, string][] = [
  ["search", "Find remote React roles for freshers"],
  ["file-check", "Tailor my resume for Zepto"],
  ["send", "Draft outreach for my top matches"],
  ["mic", "Book a mock interview for tomorrow"],
  ["link-2", "Rewrite my LinkedIn headline"],
  ["gauge", "Why is my ATS score low?"],
];
const hm = (iso: string) => {
  const d = new Date(iso);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
};

type Msg = ChatMessageView & { streaming?: boolean };
export interface ChatThreadView {
  id: string;
  title: string;
  messages: ChatMessageView[];
}

function Greeting() {
  return (
    <h1
      aria-label="What should we work on?"
      className="m-0 text-headline font-semibold tracking-[-0.6px]"
    >
      <span
        aria-hidden="true"
        className="-mr-1.5 -mb-1.5 inline-block pr-1.5 pb-1.5 [clip-path:inset(0_100%_0_0)] motion-safe:animate-[ge-as-wipe_.75s_cubic-bezier(.65,0,.35,1)_.1s_forwards] motion-reduce:[clip-path:none]"
      >
        What should we{" "}
        <span className="-mx-[3px] rounded-[2px] bg-glow bg-size-[0%_100%] bg-left bg-no-repeat px-[3px] motion-safe:animate-[ge-as-sel_.4s_cubic-bezier(.65,0,.35,1)_1.1s_forwards] motion-reduce:bg-size-[100%_100%]">
          work on
        </span>
        ?
      </span>
    </h1>
  );
}

function JobList({ jobs }: { jobs: ChatJob[] }) {
  return (
    <div className="overflow-hidden rounded-md border border-hairline">
      {jobs.map((j) => (
        <Link
          key={j.id}
          href={`/jobs/${j.id}`}
          className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 border-b border-hairline px-3 py-2.5 no-underline last:border-b-0 hover:bg-surface-2"
        >
          {j.score != null ? <MatchRing value={j.score} size={28} label={false} /> : <span />}
          <span className="flex min-w-0 flex-col">
            <span className="text-small text-ink">
              {j.title} · {j.company}
            </span>
            {j.reason && <span className="truncate text-caption text-ink-subtle">{j.reason}</span>}
          </span>
          <span className="max-md:hidden">
            {j.salary && <SalaryBadge {...salaryProps(j.salary)} compact />}
          </span>
        </Link>
      ))}
    </div>
  );
}

/** The assistant conversation, full page or in the dock. */
export function Chat({
  initial,
  userName,
  variant = "page",
  onThread,
}: {
  initial: ChatThreadView | null;
  userName: string;
  variant?: "page" | "dock";
  onThread?: (id: string) => void;
}) {
  const router = useRouter();
  const [threadId, setThreadId] = useState(initial?.id ?? null);
  const [msgs, setMsgs] = useState<Msg[]>(initial?.messages ?? []);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [focus, setFocus] = useState(false);
  const [promptsOpen, setPromptsOpen] = useState(false);
  const [dictated, setDictated] = useState("");
  const dictation = useDictation(setDictated);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const dock = variant === "dock";

  // Follow navigation to another chat (or a new one), but not the refresh after this chat
  // created its own thread: remounting then would cut off a reply that's still streaming.
  const incoming = initial?.id ?? null;
  const [seen, setSeen] = useState(incoming);
  if (incoming !== seen) {
    setSeen(incoming);
    if (incoming !== threadId) {
      setThreadId(incoming);
      setMsgs(initial?.messages ?? []);
    }
  }

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [msgs]);

  const patchLast = (p: Partial<Msg>) =>
    setMsgs((m) => [...m.slice(0, -1), { ...m[m.length - 1]!, ...p }]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const now = new Date().toISOString();
    setDraft("");
    setBusy(true);
    setMsgs((m) => [
      ...m,
      { id: `u-${now}`, role: "user", text: q, actions: [], jobs: [], at: now },
      {
        id: `a-${now}`,
        role: "assistant",
        text: "",
        actions: [],
        jobs: [],
        at: now,
        streaming: true,
      },
    ]);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, text: q }),
      });
      if (!res.ok || !res.body) throw new Error(String(res.status));
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const ev = JSON.parse(line) as
            | { type: "thread"; id: string }
            | { type: "text"; text: string }
            | { type: "actions"; actions: ChatAction[] }
            | { type: "jobs"; jobs: ChatJob[] }
            | { type: "done"; id: string }
            | { type: "error"; message: string };
          if (ev.type === "thread" && ev.id !== threadId) {
            setThreadId(ev.id);
            onThread?.(ev.id);
            if (!dock) window.history.replaceState(null, "", `/assistant?thread=${ev.id}`);
          } else if (ev.type === "text") patchLast({ text: ev.text });
          else if (ev.type === "actions") patchLast({ actions: ev.actions });
          else if (ev.type === "jobs") patchLast({ jobs: ev.jobs });
          else if (ev.type === "error") patchLast({ text: ev.message });
        }
      }
    } catch {
      patchLast({ text: "I couldn't reach the server. Check your connection and try again." });
    } finally {
      patchLast({ streaming: false, at: new Date().toISOString() });
      setBusy(false);
      router.refresh();
    }
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(draft);
    }
  };
  const pick = (text: string) => {
    setDraft(text);
    setPromptsOpen(false);
    input.current?.focus();
  };
  const listening = dictation.listening;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scroller}
        className={cx(
          "flex-1 overflow-x-hidden overflow-y-auto",
          dock ? "px-4 py-5" : "px-6 py-8 max-md:px-4",
        )}
      >
        {msgs.length === 0 && (
          <div className="mx-auto flex min-h-full max-w-[760px] flex-col justify-center gap-5 pb-6">
            <div className="flex flex-col gap-1.5">
              {dock ? (
                <h2 className="m-0 text-lead font-semibold">What should we work on?</h2>
              ) : (
                <Greeting />
              )}
              <p className="m-0 text-body text-ink-subtle">
                The assistant can search jobs, tailor resumes, draft outreach and book mock
                interviews.
              </p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-2">
              {PROMPTS.slice(0, 4).map(([icon, text]) => (
                <button
                  key={text}
                  type="button"
                  onClick={() => pick(text)}
                  className="box-border flex cursor-pointer items-center gap-2.5 rounded-md border border-hairline bg-surface-1 px-3.5 py-3 text-left text-small text-ink-muted hover:border-hairline-strong hover:bg-surface-2 hover:text-ink focus-visible:shadow-focus focus-visible:outline-none"
                >
                  <Icon name={icon} size={16} className="text-ink-subtle" />
                  {text}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="mx-auto flex max-w-[760px] flex-col gap-6" aria-live="polite">
          {msgs.map((m) => (
            <ChatBubble
              key={m.id}
              role={m.role}
              userName={userName}
              streaming={m.streaming}
              time={m.streaming ? undefined : hm(m.at)}
              text={m.text}
            >
              <span className="whitespace-pre-wrap">{m.text}</span>
              {m.actions.map((a, i) => (
                <ActionCard
                  key={i}
                  icon={isIconName(a.icon) ? a.icon : undefined}
                  title={a.title}
                  detail={a.detail}
                  status={a.status}
                  href={a.href}
                  cta={a.cta}
                />
              ))}
              {m.jobs.length > 0 && <JobList jobs={m.jobs} />}
            </ChatBubble>
          ))}
        </div>
      </div>

      <div
        className={cx(
          "border-t border-hairline",
          dock ? "px-3 pt-3 pb-3" : "px-6 pt-4 pb-6 max-md:px-4",
        )}
      >
        <div className="mx-auto flex max-w-[760px] flex-col gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send(draft);
            }}
            className={cx(
              "flex flex-col rounded-lg border bg-surface-1 transition-[border-color,box-shadow] duration-(--duration-base) ease-standard",
              focus || listening ? "border-primary-line shadow-focus" : "border-hairline-strong",
            )}
          >
            {listening ? (
              <div className="flex flex-col gap-2.5 px-4 pt-3.5 pb-3">
                <span className="text-small text-ink-subtle">{dictated || "Listening…"}</span>
                <div aria-hidden="true" className="flex h-7 items-center overflow-hidden">
                  <div className="flex w-max items-center gap-[3px] motion-safe:animate-[ge-wave-scroll_2.6s_linear_infinite]">
                    {Array.from({ length: 72 }, (_, i) => {
                      const k = i % 36;
                      const h = Math.max(
                        3,
                        Math.round(
                          Math.abs(6 + 9 * Math.sin(k * 0.55) + 5 * Math.sin(k * 1.7 + 1)) + 4,
                        ),
                      );
                      return (
                        <span
                          key={i}
                          className="w-0.5 flex-none rounded-full bg-primary"
                          style={{ height: h }}
                        />
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    title="Cancel dictation"
                    aria-label="Cancel dictation"
                    onClick={() => {
                      dictation.stop();
                      setDictated("");
                    }}
                    className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md bg-surface-3 text-ink hover:bg-surface-4"
                  >
                    <Icon name="x" size={14} />
                  </button>
                  <button
                    type="button"
                    title="Use transcript"
                    aria-label="Use transcript"
                    onClick={() => {
                      dictation.stop();
                      setDraft((d) =>
                        `${d ? `${d.replace(/\s*$/, "")} ` : ""}${dictated}`.slice(0, MAX),
                      );
                      setDictated("");
                    }}
                    className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md bg-primary text-on-primary shadow-glow-cta hover:bg-primary-hover"
                  >
                    <Icon name="check" size={15} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-2 px-4 pt-3 pb-2">
                  <textarea
                    ref={input}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={onKey}
                    onFocus={() => setFocus(true)}
                    onBlur={() => setFocus(false)}
                    maxLength={MAX}
                    rows={2}
                    placeholder="Ask to find jobs, tailor a resume, draft outreach, or book a mock interview"
                    aria-label="Message"
                    className="min-w-0 flex-1 resize-none border-none bg-transparent py-0.5 text-small leading-normal text-ink outline-none placeholder:text-ink-tertiary"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1 border-t border-hairline px-2 py-1.5">
                  <div className="relative">
                    <button
                      type="button"
                      aria-expanded={promptsOpen}
                      aria-haspopup="menu"
                      onClick={() => setPromptsOpen((o) => !o)}
                      className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-md px-2.5 text-small text-ink-muted hover:bg-surface-2 hover:text-ink focus-visible:shadow-focus focus-visible:outline-none"
                    >
                      <Icon name="file-search" size={15} />
                      Browse prompts
                    </button>
                    {promptsOpen && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setPromptsOpen(false)} />
                        <div
                          role="menu"
                          className="absolute bottom-[calc(100%+8px)] left-0 z-21 flex w-[300px] max-w-[calc(100vw-48px)] flex-col gap-0.5 rounded-lg border border-hairline-strong bg-surface-2 p-1.5"
                        >
                          {PROMPTS.map(([icon, text]) => (
                            <button
                              key={text}
                              type="button"
                              role="menuitem"
                              onClick={() => pick(text)}
                              className="flex cursor-pointer items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-small text-ink hover:bg-surface-3 focus-visible:bg-surface-3 focus-visible:outline-none"
                            >
                              <Icon name={icon} size={16} className="text-ink-subtle" />
                              {text}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <span className="flex-1" />
                  <span className="px-1.5 font-mono text-caption text-ink-tertiary">
                    {draft.length.toLocaleString("en-IN")} / {MAX.toLocaleString("en-IN")}
                  </span>
                  {!draft.trim() && dictation.supported && (
                    <button
                      type="button"
                      title="Dictate"
                      aria-label="Dictate"
                      aria-pressed={listening}
                      onClick={() => {
                        setDictated("");
                        dictation.start();
                      }}
                      className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-ink-muted hover:bg-surface-2 hover:text-ink focus-visible:shadow-focus focus-visible:outline-none"
                    >
                      <Icon name="mic" size={16} />
                    </button>
                  )}
                  {draft.trim() && !busy && (
                    <button
                      type="submit"
                      title="Send"
                      aria-label="Send"
                      className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md bg-primary text-on-primary shadow-glow-cta hover:bg-primary-hover focus-visible:shadow-focus focus-visible:outline-none"
                    >
                      <Icon name="send-horizontal" size={16} />
                    </button>
                  )}
                </div>
              </>
            )}
          </form>
          {dictation.error && <Chip icon="mic">{dictation.error}</Chip>}
          <span className="text-center text-caption text-ink-tertiary">
            The assistant asks before sending email or booking anything.
          </span>
        </div>
      </div>
    </div>
  );
}
