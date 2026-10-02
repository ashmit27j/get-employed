"use client";
import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Avatar,
  Button,
  ConfidenceMeter,
  Dropzone,
  EmptyState,
  Icon,
  IconButton,
  MatchRing,
  PageHeader,
  Panel,
  Segmented,
  StatusBadge,
  TextArea,
  TextInput,
  cx,
  type IconName,
} from "@ge/ui";
import {
  replyDraft,
  wordCount,
  type EmailAttachment,
  type EmailStatus,
  type InboxKind,
} from "@ge/core";
import {
  approveEmails,
  archiveMessage,
  discardDraft,
  draftForJob,
  markBounced,
  markMessagesRead,
  markReplied,
  regenerateDraft,
  sendReply,
  setAttachments,
  updateDraft,
} from "@/server/actions/mailbox";
import type { InboxMessage, MailboxData, OutboxEmail } from "@/server/mailbox";

type Box = "inbox" | "outbox";
type OutTab = "Needs review" | "Queued" | "Sent" | "Replied" | "Bounced";
type InTab = "All mail" | "Unread" | "Interviews" | "Replies" | "Recruiters";

const OUT_GROUPS: Record<OutTab, EmailStatus[]> = {
  "Needs review": ["draft"],
  Queued: ["approved"],
  Sent: ["sent", "opened"],
  Replied: ["replied"],
  Bounced: ["bounced"],
};
const OUT_SUBS: Record<OutTab, string> = {
  "Needs review": "Drafts written for your best matches. Edit, then approve to queue.",
  Queued: "Approved and waiting for the next sending window.",
  Sent: "Delivered from your mailbox. Opens are tracked.",
  Replied: "Conversations to pick up in Gmail.",
  Bounced: "Addresses that failed. We can try another contact.",
};
const OUT_EMPTY: Record<OutTab, [IconName, string, string]> = {
  "Needs review": [
    "inbox",
    "Nothing waiting for review",
    "New drafts appear here when a saved search finds a match above your outreach threshold.",
  ],
  Queued: [
    "clock",
    "Nothing queued",
    "Approve a draft and it will wait here until the next sending window.",
  ],
  Sent: ["send", "Nothing sent yet", "Approved emails show here once they leave your mailbox."],
  Replied: ["message-square", "No replies yet", "Replies usually arrive within 3–5 working days."],
  Bounced: [
    "circle-check",
    "No bounces",
    "Every address you've emailed so far has accepted delivery.",
  ],
};
const STATUS_LABEL: Record<EmailStatus, string> = {
  draft: "Needs review",
  approved: "Queued",
  sent: "Sent",
  opened: "Opened",
  replied: "Replied",
  bounced: "Bounced",
};
const IN_FILTERS: Record<InTab, (m: InboxMessage) => boolean> = {
  "All mail": () => true,
  Unread: (m) => m.unread,
  Interviews: (m) => m.kind === "interview",
  Replies: (m) => m.kind === "reply",
  Recruiters: (m) => m.kind === "recruiter",
};
const IN_SUBS: Record<InTab, string> = {
  "All mail": "Mail matched to your applications and outreach.",
  Unread: "Messages you haven't opened yet.",
  Interviews: "Invites and scheduling. Reply quickly, slots fill.",
  Replies: "Answers to emails you sent from the outbox.",
  Recruiters: "Recruiters who contacted you first.",
};
const KIND: Record<InboxKind, [string, "success" | "accent" | "neutral"]> = {
  interview: ["Interview", "success"],
  reply: ["Reply", "accent"],
  recruiter: ["Recruiter", "neutral"],
  update: ["Update", "neutral"],
};
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "10:42" today, "Yesterday", else "Sep 25". */
function mailDate(iso: string, now: Date) {
  const d = new Date(iso);
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 86_400_000);
  if (diff === 0)
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  if (diff === 1) return "Yesterday";
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function StatTabs<T extends string>({
  tabs,
  value,
  onPick,
  counts,
}: {
  tabs: readonly T[];
  value: T;
  onPick: (t: T) => void;
  counts: Record<T, number>;
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3 max-md:grid-cols-2">
      {tabs.map((t) => {
        const on = t === value;
        return (
          <button
            key={t}
            type="button"
            aria-pressed={on}
            onClick={() => onPick(t)}
            className={cx(
              "box-border flex cursor-pointer flex-col gap-3 rounded-lg border p-4 text-left transition-[background-color,border-color] duration-(--duration-base) ease-standard hover:border-hairline-strong hover:bg-surface-2 focus-visible:shadow-focus focus-visible:outline-none",
              on
                ? "border-primary! bg-glow-soft shadow-glow-active"
                : "border-hairline bg-surface-1",
            )}
          >
            <span className="text-small text-ink-muted">{t}</span>
            <span className="font-mono text-title leading-none text-ink">{counts[t]}</span>
          </button>
        );
      })}
    </div>
  );
}

function Drawer({
  label,
  onClose,
  header,
  children,
  footer,
}: {
  label: string;
  onClose: () => void;
  header: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const close = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    close.current?.querySelector("button")?.focus();
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <>
      <div aria-hidden="true" onClick={onClose} className="fixed inset-0 z-50 bg-scrim" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="fixed inset-y-0 right-0 z-50 box-border flex w-[min(600px,100vw)] flex-col border-l border-hairline bg-canvas"
      >
        <div className="flex h-16 flex-none items-center gap-3 border-b border-hairline pr-3 pl-6">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">{header}</div>
          <div ref={close} className="contents">
            <IconButton icon="x" title="Close" onClick={onClose} size={40} />
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-6 max-md:p-4">
          {children}
        </div>
        {footer && (
          <div className="flex flex-none flex-wrap items-center gap-2 border-t border-hairline px-6 py-4">
            {footer}
          </div>
        )}
      </aside>
    </>
  );
}

function PersonCard({
  name,
  role,
  company,
  email,
  aside,
}: {
  name: string;
  role: string | null;
  company: string;
  email: string;
  aside?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-lg border border-hairline bg-surface-1 p-4">
      <Avatar name={name} size={44} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-small font-medium text-ink">{name}</span>
        <span className="text-caption text-ink-subtle">
          {role ? `${role}, ` : ""}
          {company}
        </span>
        <span className="font-mono text-caption text-ink-muted">{email}</span>
      </div>
      {aside}
    </div>
  );
}

/* ---------- Inbox ---------- */

function InboxView({ data, now, sender }: { data: InboxMessage[]; now: Date; sender: string }) {
  const [messages, setMessages] = useState(data);
  const [tab, setTab] = useState<InTab>("All mail");
  const [open, setOpen] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [, start] = useTransition();
  const rows = messages.filter(IN_FILTERS[tab]);
  const msg = messages.find((m) => m.id === open);
  const counts = Object.fromEntries(
    (Object.keys(IN_FILTERS) as InTab[]).map((t) => [t, messages.filter(IN_FILTERS[t]).length]),
  ) as Record<InTab, number>;

  const openMsg = (m: InboxMessage) => {
    setOpen(m.id);
    setReply("");
    if (m.unread) {
      setMessages((ms) => ms.map((x) => (x.id === m.id ? { ...x, unread: false } : x)));
      start(() => markMessagesRead([m.id]));
    }
  };
  const archive = () => {
    if (!msg) return;
    setMessages((ms) => ms.filter((x) => x.id !== msg.id));
    setOpen(null);
    start(() => archiveMessage(msg.id));
  };
  const send = () => {
    if (!msg || !reply.trim()) return;
    const text = reply.trim();
    setReply("");
    start(async () => {
      const r = await sendReply(msg.id, text);
      setMessages((ms) =>
        ms.map((x) =>
          x.id === msg.id
            ? { ...x, replies: [...x.replies, { id: r.id, body: text, at: r.at }] }
            : x,
        ),
      );
    });
  };

  return (
    <>
      <StatTabs
        tabs={Object.keys(IN_FILTERS) as InTab[]}
        value={tab}
        onPick={setTab}
        counts={counts}
      />
      <div className="@container">
        <Panel>
          <div className="box-border flex min-h-[60px] flex-wrap items-center gap-4 border-b border-hairline px-5 py-3.5">
            <div className="flex min-w-[200px] flex-1 flex-col gap-0.5">
              <span className="text-body font-semibold">{tab}</span>
              <span className="text-caption text-ink-subtle">{IN_SUBS[tab]}</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={!messages.some((m) => m.unread)}
              onClick={() => {
                setMessages((ms) => ms.map((m) => ({ ...m, unread: false })));
                start(() => markMessagesRead("all"));
              }}
            >
              Mark all read
            </Button>
          </div>
          <div className="hidden grid-cols-[8px_minmax(180px,1.2fr)_minmax(220px,2.4fr)_100px_72px] items-center gap-4 border-b border-hairline px-5 py-2.5 text-caption text-ink-tertiary @min-[880px]:grid">
            <span />
            <span>From</span>
            <span>Message</span>
            <span>Type</span>
            <span className="text-right">Received</span>
          </div>
          {rows.map((m) => (
            <div
              key={m.id}
              role="button"
              tabIndex={0}
              onClick={() => openMsg(m)}
              onKeyDown={(e) =>
                (e.key === "Enter" || e.key === " ") && (e.preventDefault(), openMsg(m))
              }
              className={cx(
                "grid cursor-pointer grid-cols-[8px_minmax(0,1fr)_100px] items-center gap-4 border-b border-hairline px-5 py-4 transition-colors duration-(--duration-base) ease-standard last:border-b-0 hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none @min-[880px]:grid-cols-[8px_minmax(180px,1.2fr)_minmax(220px,2.4fr)_100px_72px]",
                open === m.id && "bg-glow-soft",
              )}
            >
              <span className={cx("size-2 rounded-full", m.unread && "bg-primary")}>
                {m.unread && <span className="sr-only">Unread</span>}
              </span>
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={m.fromName} size={36} />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span
                    className={cx(
                      "truncate text-small text-ink",
                      m.unread ? "font-semibold" : "font-normal",
                    )}
                  >
                    {m.fromName}
                  </span>
                  <span className="truncate text-caption text-ink-subtle">
                    {m.fromRole ? `${m.fromRole} · ` : ""}
                    {m.company}
                  </span>
                  <span className="truncate pt-0.5 text-small text-ink-muted @min-[880px]:hidden">
                    {m.subject}
                  </span>
                </div>
              </div>
              <div className="hidden min-w-0 flex-col gap-0.5 @min-[880px]:flex">
                <span
                  className={cx(
                    "truncate text-small text-ink",
                    m.unread ? "font-semibold" : "font-normal",
                  )}
                >
                  {m.subject}
                </span>
                <span className="truncate text-caption text-ink-subtle">{m.body}</span>
              </div>
              <div>
                <StatusBadge tone={KIND[m.kind][1]}>{KIND[m.kind][0]}</StatusBadge>
              </div>
              <span className="hidden text-right text-caption whitespace-nowrap text-ink-subtle @min-[880px]:block">
                {mailDate(m.receivedAt, now)}
              </span>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="p-4">
              <EmptyState
                icon="inbox"
                title="Nothing here"
                body="Replies to your outreach and new recruiter mail land here."
              />
            </div>
          )}
        </Panel>
      </div>

      {msg && (
        <Drawer
          label={msg.subject}
          onClose={() => setOpen(null)}
          header={
            <>
              <span className="text-caption text-ink-subtle">{KIND[msg.kind][0]}</span>
              <span className="truncate text-body font-semibold">{msg.subject}</span>
            </>
          }
          footer={
            <>
              <Button variant="tertiary" size="sm" onClick={archive}>
                Archive
              </Button>
              <span className="flex-1" />
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setReply(
                    replyDraft({ fromName: msg.fromName, kind: msg.kind, senderName: sender }),
                  )
                }
              >
                Draft reply
              </Button>
              <Button size="sm" disabled={!reply.trim()} onClick={send}>
                Send reply
              </Button>
            </>
          }
        >
          <PersonCard
            name={msg.fromName}
            role={msg.fromRole}
            company={msg.company}
            email={msg.fromEmail}
            aside={
              <Button variant="secondary" size="sm" href="/tracker">
                View in tracker
              </Button>
            }
          />
          {[
            { id: msg.id, name: msg.fromName, at: msg.receivedAt, body: msg.body, mine: false },
            ...msg.replies.map((r) => ({
              id: r.id,
              name: "You",
              at: r.at,
              body: r.body,
              mine: true,
            })),
          ].map((t) => (
            <div key={t.id} className="flex flex-col gap-2">
              <div className="flex justify-between gap-3 text-caption text-ink-subtle">
                <span>{t.name}</span>
                <span>{mailDate(t.at, now)}</span>
              </div>
              <div
                className={cx(
                  "rounded-md border border-hairline px-4 py-3.5 text-small leading-[1.55] text-pretty whitespace-pre-wrap text-ink",
                  t.mine ? "bg-surface-2" : "bg-surface-1",
                )}
              >
                {t.body}
              </div>
            </div>
          ))}
          <TextArea
            label="Reply"
            rows={6}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            hint={`Sends from ${sender}`}
          />
        </Drawer>
      )}
    </>
  );
}

/* ---------- Outbox ---------- */

function Timeline({ e, sender, now }: { e: OutboxEmail; sender: string; now: Date }) {
  const items: { title: string; sub: string; dot: string; quote?: string | null }[] = [];
  items.push(
    e.status === "approved"
      ? { title: "Queued", sub: "Goes out in the next sending window", dot: "bg-ink-subtle" }
      : {
          title: "Sent",
          sub: `${e.sentAt ? mailDate(e.sentAt, now) : "Today"} from ${sender}`,
          dot: "bg-ink-subtle",
        },
  );
  if (e.status === "opened" || e.status === "replied")
    items.push({ title: "Opened", sub: "Read at least once", dot: "bg-primary" });
  if (e.status === "replied")
    items.push({
      title: `Reply from ${e.toName}`,
      sub: "Continue the thread in Gmail",
      dot: "bg-success-ink",
      quote: e.replyText,
    });
  if (e.status === "bounced" && e.error)
    items.push({
      title: "Bounced",
      sub: `${e.error}. We'll try the next best contact at ${e.company} if you allow it.`,
      dot: "bg-danger-ink",
    });
  return (
    <div className="flex flex-col">
      {items.map((t) => (
        <div key={t.title} className="grid grid-cols-[20px_minmax(0,1fr)] gap-3 pb-4">
          <span
            className={cx(
              "mt-1 ml-[5px] size-2.5 rounded-full shadow-[0_0_0_4px_var(--color-canvas)]",
              t.dot,
            )}
          />
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="text-small text-ink">{t.title}</span>
            <span className="text-caption text-ink-subtle">{t.sub}</span>
            {t.quote && (
              <div className="rounded-md border border-hairline bg-surface-1 px-4 py-3.5 text-small text-pretty text-ink">
                {t.quote}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function AttachModal({
  library,
  onPick,
  onClose,
}: {
  library: MailboxData["library"];
  onPick: (a: EmailAttachment) => void;
  onClose: () => void;
}) {
  const [state, setState] = useState<{ status: "idle" | "uploading"; error?: string }>({
    status: "idle",
  });
  const upload = async (file: File) => {
    setState({ status: "uploading" });
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/uploads/document", { method: "POST", body });
    const json = (await res.json().catch(() => ({}))) as {
      key?: string;
      name?: string;
      error?: string;
    };
    if (!res.ok || !json.key)
      return setState({
        status: "idle",
        error: json.error ?? "That upload didn't work. Try again.",
      });
    onPick({ name: json.name ?? file.name, key: json.key });
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <>
      <div aria-hidden="true" onClick={onClose} className="fixed inset-0 z-60 bg-scrim" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Attach a document"
        className="fixed top-1/2 left-1/2 z-60 box-border flex max-h-[80vh] w-[min(480px,92vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-lg border border-hairline bg-canvas"
      >
        <div className="flex h-14 flex-none items-center gap-3 border-b border-hairline pr-2.5 pl-5">
          <span className="min-w-0 flex-1 text-body font-semibold">Attach a document</span>
          <IconButton icon="x" title="Close" onClick={onClose} size={36} />
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
          <Dropzone
            title="Drop a document here"
            hint="PDF or DOCX, up to 10 MB"
            accept=".pdf,.docx"
            state={state.status === "uploading" ? "uploading" : "idle"}
            progress={state.status === "uploading" ? 60 : 0}
            onFile={(f) => void upload(f)}
          />
          {state.error && (
            <p role="alert" className="m-0 text-small text-danger-ink">
              {state.error}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <span className="text-caption text-ink-subtle">Your documents</span>
            {library.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => onPick({ name: d.name, resumeId: d.id })}
                className="flex cursor-pointer items-center gap-2.5 rounded-md border border-hairline px-3.5 py-3 text-left text-small text-ink-muted hover:bg-surface-2 hover:text-ink focus-visible:shadow-focus focus-visible:outline-none"
              >
                <Icon name="file-text" size={16} className="text-ink-subtle" />
                <span className="min-w-0 flex-1 truncate">{d.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function EmailDrawer({
  e,
  userName,
  sender,
  now,
  library,
  onClose,
  onChange,
  onApprove,
  onDiscard,
  onMarked,
}: {
  e: OutboxEmail;
  userName: string;
  sender: string;
  now: Date;
  library: MailboxData["library"];
  onClose: () => void;
  onChange: (patch: Partial<OutboxEmail>) => void;
  onApprove: () => void;
  onDiscard: () => void;
  onMarked: (patch: Partial<OutboxEmail>) => void;
}) {
  const [attachOpen, setAttachOpen] = useState(false);
  const [marking, setMarking] = useState(false);
  const [pasted, setPasted] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const draft = e.status === "draft";

  const edit = (patch: { subject?: string; body?: string }) => {
    onChange(patch);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => start(() => updateDraft(e.id, patch)), 600);
  };
  const attach = (list: EmailAttachment[]) => {
    onChange({ attachments: list });
    start(() => setAttachments(e.id, list));
  };
  const attachName = `${userName.replace(/\s+/g, "_")}_${e.company.replace(/\s+/g, "_")}.pdf · ${e.resume?.tailored ? "tailored resume" : "main resume"}`;

  return (
    <Drawer
      label={e.subject}
      onClose={onClose}
      header={
        <>
          <span className="text-caption text-ink-subtle">{STATUS_LABEL[e.status]}</span>
          <span className="truncate text-body font-semibold">{e.subject}</span>
        </>
      }
      footer={
        draft ? (
          <>
            <Button variant="tertiary" size="sm" onClick={onDiscard}>
              Discard
            </Button>
            <span className="flex-1" />
            <Button
              variant="secondary"
              size="sm"
              disabled={regenerating}
              onClick={() => {
                setRegenerating(true);
                start(async () => {
                  await regenerateDraft(e.id);
                  setRegenerating(false);
                });
              }}
            >
              {regenerating ? "Regenerating…" : "Regenerate"}
            </Button>
            <Button size="sm" onClick={onApprove}>
              Approve and queue
            </Button>
          </>
        ) : e.status === "sent" || e.status === "opened" ? (
          marking ? (
            <>
              <Button variant="tertiary" size="sm" onClick={() => setMarking(false)}>
                Cancel
              </Button>
              <span className="flex-1" />
              <Button
                size="sm"
                onClick={() =>
                  start(async () => {
                    await markReplied(e.id, pasted);
                    onMarked({
                      status: "replied",
                      replyText: pasted.trim() || null,
                      repliedAt: new Date().toISOString(),
                    });
                    setMarking(false);
                  })
                }
              >
                Save reply
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="tertiary"
                size="sm"
                onClick={() =>
                  start(async () => {
                    await markBounced(e.id);
                    onMarked({ status: "bounced", error: "Marked as bounced" });
                  })
                }
              >
                Mark as bounced
              </Button>
              <span className="flex-1" />
              <Button variant="secondary" size="sm" onClick={() => setMarking(true)}>
                Mark as replied
              </Button>
            </>
          )
        ) : undefined
      }
    >
      <PersonCard
        name={e.toName}
        role={e.toRole}
        company={e.company}
        email={e.toEmail}
        aside={
          <div className="flex flex-col items-end gap-1">
            {e.confidence != null && <ConfidenceMeter value={e.confidence} label="confidence" />}
            <span className="text-right text-caption text-ink-subtle">
              {e.method ?? "Verified contact"}
            </span>
          </div>
        }
      />
      {draft ? (
        <>
          <TextInput
            label="Subject"
            value={e.subject}
            onChange={(ev) => edit({ subject: ev.target.value })}
          />
          <TextArea
            label="Message"
            rows={14}
            value={e.body}
            onChange={(ev) => edit({ body: ev.target.value })}
            hint={`${wordCount(e.body)} words · aim for under 120`}
          />
          <div className="flex flex-col gap-2">
            {e.resume && (
              <Link
                href={e.resume.href}
                className="flex items-center gap-2.5 rounded-md border border-hairline px-3.5 py-3 text-small text-ink-muted no-underline hover:bg-surface-2 hover:text-ink-muted"
              >
                <Icon name="paperclip" size={16} className="text-ink-subtle" />
                <span className="min-w-0 flex-1">{attachName}</span>
                {e.resume.atsScore != null && (
                  <MatchRing value={e.resume.atsScore} size={28} label={false} />
                )}
              </Link>
            )}
            {e.attachments.map((d, i) => (
              <div
                key={`${d.name}-${i}`}
                className="flex items-center gap-2.5 rounded-md border border-hairline px-3.5 py-3 text-small text-ink-muted"
              >
                <Icon name="file-text" size={16} className="text-ink-subtle" />
                <span className="min-w-0 flex-1 truncate">{d.name}</span>
                <IconButton
                  icon="x"
                  title="Remove attachment"
                  onClick={() => attach(e.attachments.filter((_, j) => j !== i))}
                  size={24}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setAttachOpen(true)}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-hairline-strong px-3.5 py-2.5 text-left text-small text-ink-subtle hover:bg-surface-2 hover:text-ink focus-visible:shadow-focus focus-visible:outline-none"
            >
              <Icon name="plus" size={14} />
              Attach another document
            </button>
          </div>
        </>
      ) : (
        <>
          <Timeline e={e} sender={sender} now={now} />
          {marking && (
            <TextArea
              label="Their reply (optional)"
              rows={5}
              value={pasted}
              onChange={(ev) => setPasted(ev.target.value)}
              hint="Paste it to keep the conversation in your inbox."
            />
          )}
        </>
      )}
      {attachOpen && (
        <AttachModal
          library={library}
          onClose={() => setAttachOpen(false)}
          onPick={(a) => {
            attach([...e.attachments, a]);
            setAttachOpen(false);
          }}
        />
      )}
    </Drawer>
  );
}

function OutboxView({
  data,
  now,
  sender,
  userName,
  library,
  openId,
  onOpen,
}: {
  data: OutboxEmail[];
  now: Date;
  sender: string;
  userName: string;
  library: MailboxData["library"];
  openId: string | null;
  onOpen: (id: string | null) => void;
}) {
  const [mails, setMails] = useState(data);
  const [tab, setTab] = useState<OutTab>(() => {
    const e = data.find((x) => x.id === openId);
    return (
      (Object.keys(OUT_GROUPS) as OutTab[]).find((t) => e && OUT_GROUPS[t].includes(e.status)) ??
      "Needs review"
    );
  });
  // Pre-select drafts to contacts we're confident about (80%+, "likely to reply").
  const [checked, setChecked] = useState<string[]>(() =>
    data.filter((e) => e.status === "draft" && (e.confidence ?? 0) >= 80).map((e) => e.id),
  );
  const [, start] = useTransition();
  const review = tab === "Needs review";
  const rows = mails.filter((e) => OUT_GROUPS[tab].includes(e.status));
  const drafts = mails.filter((e) => e.status === "draft").map((e) => e.id);
  const sel = checked.filter((id) => drafts.includes(id));
  const open = mails.find((e) => e.id === openId);
  const counts = Object.fromEntries(
    (Object.keys(OUT_GROUPS) as OutTab[]).map((t) => [
      t,
      mails.filter((e) => OUT_GROUPS[t].includes(e.status)).length,
    ]),
  ) as Record<OutTab, number>;
  const patch = (id: string, p: Partial<OutboxEmail>) =>
    setMails((ms) => ms.map((m) => (m.id === id ? { ...m, ...p } : m)));
  const approve = (ids: string[]) => {
    setMails((ms) => ms.map((m) => (ids.includes(m.id) ? { ...m, status: "approved" } : m)));
    setChecked((c) => c.filter((id) => !ids.includes(id)));
    if (openId && ids.includes(openId)) onOpen(null);
    start(() => approveEmails(ids).then(() => undefined));
  };
  const cols = cx(
    review
      ? "grid-cols-[16px_minmax(0,1fr)] @min-[880px]:grid-cols-[16px_minmax(140px,1fr)_minmax(160px,1.4fr)_56px]"
      : "grid-cols-[minmax(0,1fr)] @min-[880px]:grid-cols-[minmax(140px,1fr)_minmax(160px,1.4fr)_56px]",
  );
  const [icon, emptyTitle, emptyBody] = OUT_EMPTY[tab];

  return (
    <>
      <StatTabs
        tabs={Object.keys(OUT_GROUPS) as OutTab[]}
        value={tab}
        onPick={setTab}
        counts={counts}
      />
      <div className="@container">
        <Panel>
          <div className="box-border flex min-h-[60px] flex-wrap items-center gap-4 border-b border-hairline px-5 py-3.5">
            {review && (
              <input
                type="checkbox"
                aria-label="Select all drafts"
                checked={drafts.length > 0 && sel.length === drafts.length}
                onChange={() => setChecked(sel.length === drafts.length ? [] : drafts)}
                className="size-4 cursor-pointer accent-primary"
              />
            )}
            <div className="flex min-w-[200px] flex-1 flex-col gap-0.5">
              <span className="text-body font-semibold">{tab}</span>
              <span className="text-caption text-ink-subtle">{OUT_SUBS[tab]}</span>
            </div>
            {review && (
              <Button size="sm" disabled={sel.length === 0} onClick={() => approve(sel)}>
                {sel.length
                  ? `Approve ${sel.length} ${sel.length === 1 ? "email" : "emails"}`
                  : "Approve selected"}
              </Button>
            )}
          </div>
          <div
            className={cx(
              "hidden items-center gap-4 border-b border-hairline px-5 py-2.5 text-caption text-ink-tertiary @min-[880px]:grid",
              cols,
            )}
          >
            {review && <span />}
            <span>Recipient</span>
            <span>Subject</span>
            <span className="text-right">{review ? "Match" : "Date"}</span>
          </div>
          {rows.map((e) => {
            const note = e.error ?? (e.replyText ? `“${e.replyText}”` : "");
            const date = review
              ? e.score != null
                ? `${e.score}%`
                : "—"
              : e.sentAt
                ? mailDate(e.sentAt, now)
                : "Today";
            const color =
              !review || e.score == null
                ? "text-ink-subtle"
                : e.score >= 80
                  ? "text-success-ink"
                  : e.score >= 60
                    ? "text-warning-ink"
                    : "text-danger-ink";
            return (
              <div
                key={e.id}
                role="button"
                tabIndex={0}
                onClick={() => onOpen(e.id)}
                onKeyDown={(ev) =>
                  ev.target === ev.currentTarget &&
                  (ev.key === "Enter" || ev.key === " ") &&
                  (ev.preventDefault(), onOpen(e.id))
                }
                className={cx(
                  "grid cursor-pointer items-center gap-4 border-b border-hairline px-5 py-4 transition-colors duration-(--duration-base) ease-standard last:border-b-0 hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none",
                  cols,
                  openId === e.id && "bg-glow-soft",
                )}
              >
                {review && (
                  <input
                    type="checkbox"
                    aria-label={`Select email to ${e.toName}`}
                    checked={sel.includes(e.id)}
                    onClick={(ev) => ev.stopPropagation()}
                    onChange={() =>
                      setChecked((c) =>
                        c.includes(e.id) ? c.filter((i) => i !== e.id) : [...c, e.id],
                      )
                    }
                    className="size-4 cursor-pointer accent-primary"
                  />
                )}
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={e.toName} size={36} />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-small font-medium text-ink">{e.toName}</span>
                    <span className="truncate text-caption text-ink-subtle">
                      {e.toRole ? `${e.toRole} · ` : ""}
                      {e.company}
                    </span>
                    <span className="truncate pt-0.5 text-small text-ink-muted @min-[880px]:hidden">
                      {e.subject}
                    </span>
                  </div>
                </div>
                <div className="hidden min-w-0 flex-col gap-0.5 @min-[880px]:flex">
                  <span className="truncate text-small text-ink-muted">{e.subject}</span>
                  {note && <span className="truncate text-caption text-ink-subtle">{note}</span>}
                </div>
                <span
                  className={cx(
                    "hidden text-right text-caption font-semibold whitespace-nowrap @min-[880px]:block",
                    color,
                  )}
                >
                  {date}
                </span>
              </div>
            );
          })}
          {rows.length === 0 && (
            <div className="p-4">
              <EmptyState icon={icon} title={emptyTitle} body={emptyBody} />
            </div>
          )}
        </Panel>
      </div>
      {open && (
        <EmailDrawer
          key={open.id}
          e={open}
          userName={userName}
          sender={sender}
          now={now}
          library={library}
          onClose={() => onOpen(null)}
          onChange={(p) => patch(open.id, p)}
          onMarked={(p) => patch(open.id, p)}
          onApprove={() => approve([open.id])}
          onDiscard={() => {
            setMails((ms) => ms.filter((m) => m.id !== open.id));
            onOpen(null);
            start(() => discardDraft(open.id));
          }}
        />
      )}
    </>
  );
}

/* ---------- Page ---------- */

export function Mailbox({
  data,
  userName,
  userEmail,
  nowIso,
}: {
  data: MailboxData;
  userName: string;
  userEmail: string;
  nowIso: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const box: Box =
    params.get("box") === "outbox" || params.get("job") || params.get("email") ? "outbox" : "inbox";
  const openId = params.get("email");
  const jobId = params.get("job");
  const sender = data.sender ?? userEmail;
  const [notice, setNotice] = useState<string | null>(null);
  const handled = useRef<string | null>(null);

  const setParams = (next: Record<string, string | null>) => {
    const q = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v == null) q.delete(k);
      else q.set(k, v);
    }
    router.replace(`/mailbox${q.size ? `?${q}` : ""}`, { scroll: false });
  };

  // "Reach out" from a job: open its draft, creating one for the job's contact if needed.
  useEffect(() => {
    if (!jobId || handled.current === jobId) return;
    handled.current = jobId;
    draftForJob(jobId).then((id) => {
      if (id) {
        router.refresh();
        setParams({ box: "outbox", job: null, email: id });
      } else {
        setNotice(
          "We're still looking for someone to contact at this company. The draft appears here once we find them.",
        );
        setParams({ box: "outbox", job: null });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per job id
  }, [jobId]);

  return (
    <>
      <PageHeader
        title="Mailbox"
        sub={
          box === "inbox"
            ? "Replies, interview invites and recruiter mail from your connected mailbox, matched to your applications."
            : `Nothing is sent until you approve it. Emails go out from your connected mailbox between ${data.window.start} and ${data.window.end} IST, spaced a few minutes apart.`
        }
      />
      <div className="flex">
        <Segmented
          label="Mailbox"
          options={[
            { value: "Inbox", icon: "inbox" },
            { value: "Outbox", icon: "send" },
          ]}
          value={box === "inbox" ? "Inbox" : "Outbox"}
          onChange={(v) => setParams({ box: v.toLowerCase(), email: null, job: null })}
        />
      </div>
      {box === "outbox" && !data.sender && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-hairline-strong bg-surface-2 px-4 py-2.5 text-small text-ink-muted">
          <span>Connect Gmail or SMTP in Settings to send approved emails.</span>
          <Button variant="secondary" size="sm" href="#settings/mailbox">
            Connect mailbox
          </Button>
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="rounded-md border border-hairline-strong bg-surface-2 px-4 py-2.5 text-small text-ink-muted"
        >
          {notice}
        </div>
      )}
      {box === "inbox" ? (
        <InboxView data={data.inbox} now={now} sender={sender} />
      ) : (
        <OutboxView
          key={data.outbox.map((e) => e.id).join()}
          data={data.outbox}
          now={now}
          sender={sender}
          userName={userName}
          library={data.library}
          openId={openId}
          onOpen={(id) => setParams({ email: id })}
        />
      )}
    </>
  );
}
