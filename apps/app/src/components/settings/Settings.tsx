"use client";
import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Button,
  CoLogo,
  Icon,
  InlineSelect,
  Modal,
  Segmented,
  StatusBadge,
  TextArea,
  TextInput,
  TimePicker,
  TimeRangePicker,
  Toggle,
  type IconName,
} from "@ge/ui";
import { MIN_MATCH_OPTIONS, type UserSettings } from "@ge/core";
import {
  connectSmtp,
  disconnectMailbox,
  removeLlmKey,
  saveLlmKey,
  sendFeedback,
  updateSettings,
} from "@/server/actions/settings";
import type { SettingsData } from "@/server/actions/settings";
import { useTheme, type ThemeChoice } from "@/lib/theme";
import { Account } from "./Account";
import { H2, Row } from "./parts";

export type SettingsTab = "general" | "account" | "mailbox" | "ai" | "billing" | "dev";
export type NavItem = {
  id: SettingsTab | "feedback";
  label: string;
  icon: IconName;
  keywords: string;
};
/** The dialog's sections, in the order people look for them. */
export const SETTINGS_NAV: [string, NavItem[]][] = [
  [
    "Settings",
    [
      {
        id: "general",
        label: "General",
        icon: "settings",
        keywords:
          "appearance theme dark light time zone currency match notifications digest quiet hours",
      },
      {
        id: "account",
        label: "Account",
        icon: "circle-user-round",
        keywords:
          "name photo email password security sessions google github connectors export delete",
      },
      {
        id: "mailbox",
        label: "Mailbox",
        icon: "mail",
        keywords: "gmail smtp sending window daily limit follow-ups",
      },
      {
        id: "ai",
        label: "AI & privacy",
        icon: "shield",
        keywords: "assistant tone chat history recordings",
      },
      { id: "billing", label: "Plan & usage", icon: "credit-card", keywords: "plan billing usage" },
      {
        id: "dev",
        label: "Developer",
        icon: "code",
        keywords: "self-hosting api key llm gemini docker github",
      },
    ],
  ],
  [
    "Help",
    [
      {
        id: "feedback",
        label: "Send feedback",
        icon: "message-square-text",
        keywords: "bug idea question help",
      },
    ],
  ],
];
export const SETTINGS_LABEL: Record<SettingsTab, string> = {
  general: "General",
  account: "Account",
  mailbox: "Mailbox",
  ai: "AI & privacy",
  billing: "Plan & usage",
  dev: "Developer",
};

export function FeedbackDialog({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const [kind, setKind] = useState<"Idea" | "Bug" | "Question">("Idea");
  const [msg, setMsg] = useState("");
  const [includePage, setIncludePage] = useState(true);
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();
  if (sent)
    return (
      <Modal
        open
        onClose={onClose}
        title="Feedback sent"
        footer={
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        }
      >
        <div className="flex items-start gap-3">
          <span className="inline-flex size-8 flex-none items-center justify-center rounded-full border border-primary-line bg-glow-soft text-primary">
            <Icon name="check" size={16} />
          </span>
          <span className="text-small text-pretty text-ink-muted">
            Thanks. We read every message, and we reply by email when there&apos;s something to
            follow up on.
          </span>
        </div>
      </Modal>
    );
  return (
    <Modal
      open
      onClose={onClose}
      title="Send feedback"
      sub="Tell us what's broken, confusing or missing."
      footer={
        <>
          <Button variant="tertiary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!msg.trim() || pending}
            onClick={() =>
              start(async () => {
                await sendFeedback({
                  kind: kind.toLowerCase(),
                  message: msg,
                  page: includePage ? pathname : null,
                });
                setSent(true);
              })
            }
          >
            Send feedback
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Segmented
          label="Feedback type"
          options={[
            { value: "Idea", icon: "lightbulb" },
            { value: "Bug", icon: "bug" },
            { value: "Question", icon: "circle-help" },
          ]}
          value={kind}
          onChange={(v) => setKind(v as typeof kind)}
        />
        <TextArea
          label={
            kind === "Bug" ? "What happened?" : kind === "Question" ? "Your question" : "Your idea"
          }
          rows={5}
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder={
            kind === "Bug"
              ? "What you did, what you expected, what you saw instead"
              : "Write as much or as little as you like"
          }
        />
        <label className="flex cursor-pointer items-center gap-2.5 text-small text-ink-muted">
          <Toggle on={includePage} onChange={setIncludePage} label="Include this page" />
          Include the page you&apos;re on
        </label>
      </div>
    </Modal>
  );
}

export function SmtpForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ host: "", port: "587", user: "", password: "", address: "" });
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((x) => ({ ...x, [k]: e.target.value }));
  return (
    <form
      className="flex flex-col gap-3 rounded-lg border border-hairline bg-surface-1 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await connectSmtp(f);
          if (r.ok) onDone();
          else setError(r.error);
        });
      }}
    >
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
        <TextInput
          label="SMTP server"
          placeholder="smtp.gmail.com"
          value={f.host}
          onChange={set("host")}
        />
        <TextInput label="Port" inputMode="numeric" value={f.port} onChange={set("port")} />
        <TextInput label="Username" value={f.user} onChange={set("user")} autoComplete="off" />
        <TextInput
          label="Password or app password"
          type="password"
          value={f.password}
          onChange={set("password")}
          autoComplete="new-password"
        />
        <TextInput
          label="Send from"
          type="email"
          placeholder="you@example.com"
          value={f.address}
          onChange={set("address")}
        />
      </div>
      {error && (
        <p role="alert" className="m-0 text-small text-danger-ink">
          {error}
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <span className="text-caption text-ink-subtle">
          We check the login, then store it encrypted.
        </span>
        <Button
          type="submit"
          size="sm"
          disabled={pending || !f.host || !f.user || !f.password || !f.address}
        >
          {pending ? "Checking…" : "Connect"}
        </Button>
      </div>
    </form>
  );
}

/** The content of one settings section; SettingsDialog draws the frame and navigation. */
export function SettingsPane({
  tab,
  data,
  update,
  onChanged,
}: {
  tab: SettingsTab;
  data: SettingsData;
  /** Keep the dialog's copy in step with edits, so switching sections never shows stale values. */
  update: (fn: (d: SettingsData) => SettingsData) => void;
  /** Reload the dialog's data after something changed on the server. */
  onChanged: () => void;
}) {
  const router = useRouter();
  const { connection, usage, email, settings: s, ownKey } = data;
  const [theme, setTheme] = useTheme();
  const [smtpOpen, setSmtpOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [keyState, setKeyState] = useState<{ saved?: boolean; error?: string }>({});
  const [, start] = useTransition();

  const patch = <K extends keyof UserSettings>(section: K, value: Partial<UserSettings[K]>) => {
    update((d) => ({
      ...d,
      settings: { ...d.settings, [section]: { ...d.settings[section], ...value } },
    }));
    start(() => updateSettings(section, value));
  };
  const refresh = () => {
    onChanged();
    router.refresh();
  };
  const g = s.general;
  const m = s.mailbox;
  const ai = s.ai;
  const minLabel = MIN_MATCH_OPTIONS.find(([, v]) => v === g.minMatch)?.[0] ?? "Show all";

  return (
    <>
      {tab === "general" && (
        <section className="flex flex-col">
          <H2 first>Appearance</H2>
          <Row title="Theme" sub="Saved on this device.">
            <Segmented
              label="Theme"
              options={[
                { value: "dark", label: "Dark", icon: "moon" },
                { value: "light", label: "Light", icon: "sun" },
                { value: "system", label: "System", icon: "monitor" },
              ]}
              value={theme}
              onChange={(v) => setTheme(v as ThemeChoice)}
            />
          </Row>
          <H2>Preferences</H2>
          <Row title="Time zone" sub="Deadlines, reminders and your digest use this.">
            <InlineSelect
              label="Time zone"
              options={[
                "Asia/Kolkata (IST)",
                "Asia/Dubai (GST)",
                "Asia/Singapore (SGT)",
                "Europe/London (GMT)",
                "America/New_York (ET)",
                "UTC",
              ]}
              value={g.timeZone}
              onChange={(v) => patch("general", { timeZone: v })}
            />
          </Row>
          <Row title="Salary currency" sub="How salary bands are shown on jobs.">
            <InlineSelect
              label="Currency"
              options={["₹ INR · LPA", "$ USD · per year", "€ EUR · per year"]}
              value={g.currency}
              onChange={(v) => patch("general", { currency: v })}
            />
          </Row>
          <Row
            title="Minimum match score"
            sub="Roles below this are hidden from your feed and digest."
          >
            <InlineSelect
              label="Minimum match"
              options={MIN_MATCH_OPTIONS.map(([l]) => l)}
              value={minLabel}
              onChange={(v) =>
                patch("general", { minMatch: MIN_MATCH_OPTIONS.find(([l]) => l === v)![1] })
              }
            />
          </Row>

          <H2>Notifications</H2>
          <p className="m-0 mb-1 text-caption text-ink-subtle">Sent to {email}.</p>
          {(
            [
              ["matches", "New matches", "Daily digest of jobs above your minimum match score"],
              ["replies", "Replies", "When a recruiter or manager answers your outreach"],
              ["followUps", "Follow-up reminders", "7 days after an application with no response"],
              [
                "interviews",
                "Interview reminders",
                "1 hour before a scheduled mock or real interview",
              ],
              ["weekly", "Weekly summary", "Applications, replies and score changes every Monday"],
            ] as const
          ).map(([k, title, sub]) => (
            <Row key={k} title={title} sub={sub}>
              <Toggle
                on={g.notify[k]}
                onChange={(v) => patch("general", { notify: { ...g.notify, [k]: v } })}
                label={title}
              />
            </Row>
          ))}
          <Row title="Digest time" sub="When the daily matches email arrives.">
            <TimePicker
              label="Digest time"
              value={g.digestTime}
              onChange={(v) => patch("general", { digestTime: v })}
            />
          </Row>
          <Row
            title="Quiet hours"
            sub="Nothing is sent in this window. Reminders wait until it ends."
          >
            <TimeRangePicker
              label="Quiet hours"
              allowOff
              start={g.quietHours?.start ?? "22:00"}
              end={g.quietHours?.end ?? "08:00"}
              off={g.quietHours == null}
              onChange={(r) =>
                patch("general", { quietHours: r.off ? null : { start: r.start, end: r.end } })
              }
            />
          </Row>
        </section>
      )}

      {tab === "account" && (
        <Account
          data={data.account}
          nickname={s.general.nickname}
          workRole={s.general.workRole}
          connectors={data.connectors}
          nowIso={data.nowIso}
          onChanged={refresh}
          onLocal={({ nickname, workRole, ...acct }) =>
            update((d) => ({
              ...d,
              account: { ...d.account, ...acct },
              settings: {
                ...d.settings,
                general: {
                  ...d.settings.general,
                  ...(nickname != null && { nickname }),
                  ...(workRole != null && { workRole }),
                },
              },
            }))
          }
        />
      )}

      {tab === "mailbox" && (
        <section className="flex flex-col">
          <H2 first sub="Outreach is sent from your own address so replies land in your inbox.">
            Connected mailbox
          </H2>
          {connection ? (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-hairline bg-surface-1 px-4 py-3.5">
              <CoLogo name={connection.kind === "gmail" ? "Gmail" : "SMTP"} size={36} />
              <div className="flex min-w-[160px] flex-1 flex-col">
                <span className="text-small text-ink">{connection.address}</span>
                <span className="text-caption text-ink-subtle">
                  {connection.kind === "gmail" ? "Gmail · send-only access" : "SMTP"} · connected{" "}
                  {new Date(connection.connectedAt).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <StatusBadge tone={connection.status === "connected" ? "success" : "neutral"}>
                {connection.status === "connected" ? "Connected" : "Reconnect"}
              </StatusBadge>
              <Button
                variant="tertiary"
                size="sm"
                onClick={() =>
                  start(async () => {
                    await disconnectMailbox();
                    refresh();
                  })
                }
              >
                Disconnect
              </Button>
            </div>
          ) : smtpOpen ? (
            <SmtpForm
              onDone={() => {
                setSmtpOpen(false);
                refresh();
              }}
            />
          ) : (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-hairline-strong px-4 py-3.5">
              <Icon name="mail" size={18} className="text-ink-subtle" />
              <span className="min-w-[200px] flex-1 text-small text-ink-muted">
                No mailbox connected. Approved emails wait in the outbox until you connect one.
              </span>
              <Button variant="secondary" size="sm" onClick={() => setSmtpOpen(true)}>
                Connect with SMTP
              </Button>
            </div>
          )}
          <H2>Sending</H2>
          <Row title="Sending window" sub="Approved emails queue until this window opens.">
            <TimeRangePicker
              label="Sending window"
              start={m.windowStart}
              end={m.windowEnd}
              onChange={(r) => patch("mailbox", { windowStart: r.start, windowEnd: r.end })}
            />
          </Row>
          <Row title="Daily limit" sub="Keeps you under Gmail's spam thresholds.">
            <InlineSelect
              label="Daily limit"
              options={["10 emails", "20 emails", "30 emails"]}
              value={`${m.dailyLimit} emails`}
              onChange={(v) => patch("mailbox", { dailyLimit: Number.parseInt(v, 10) })}
            />
          </Row>
          <Row
            title="Automatic follow-ups"
            sub="Draft a follow-up after 7 days with no reply. You approve before it sends."
          >
            <Toggle
              on={m.followUps}
              onChange={(v) => patch("mailbox", { followUps: v })}
              label="Automatic follow-ups"
            />
          </Row>
        </section>
      )}

      {tab === "ai" && (
        <section className="flex flex-col">
          <H2 first>Assistant</H2>
          {(
            [
              [
                "autoFilters",
                "Auto-create search filters",
                "Turn plain-English searches into filters without asking",
              ],
              [
                "autoDraft",
                "Auto-draft outreach",
                "Draft emails for matches above 85. Nothing sends without your approval.",
              ],
              ["suggestEdits", "Suggest resume edits", "Show AI rewrites inline while you edit"],
            ] as const
          ).map(([k, title, sub]) => (
            <Row key={k} title={title} sub={sub}>
              <Toggle on={ai[k]} onChange={(v) => patch("ai", { [k]: v })} label={title} />
            </Row>
          ))}
          <Row title="Outreach tone" sub="Default voice for drafted emails.">
            <InlineSelect
              label="Outreach tone"
              options={["Friendly and direct", "Formal", "Brief"]}
              value={ai.tone}
              onChange={(v) => patch("ai", { tone: v })}
            />
          </Row>
          <H2>Privacy</H2>
          {(
            [
              [
                "saveRecordings",
                "Save interview recordings",
                "Keep video in the cloud so you can replay sessions on any device",
              ],
              [
                "improve",
                "Help improve GetEmployed",
                "Share anonymised usage to improve matching. Never your resume text.",
              ],
            ] as const
          ).map(([k, title, sub]) => (
            <Row key={k} title={title} sub={sub}>
              <Toggle on={ai[k]} onChange={(v) => patch("ai", { [k]: v })} label={title} />
            </Row>
          ))}
          <Row
            title="Delete chat history after"
            sub="Assistant conversations are removed automatically."
          >
            <InlineSelect
              label="Delete chat history"
              options={["Never", "30 days", "90 days"]}
              value={ai.chatRetentionDays ? `${ai.chatRetentionDays} days` : "Never"}
              onChange={(v) =>
                patch("ai", { chatRetentionDays: v === "Never" ? 0 : Number.parseInt(v, 10) })
              }
            />
          </Row>
        </section>
      )}

      {tab === "billing" && (
        <section className="flex flex-col">
          <H2 first sub="Paid plans aren't available yet, so nothing is limited by plan.">
            Plan
          </H2>
          <Row title="Current plan">
            <StatusBadge>Free</StatusBadge>
          </Row>
          <H2 sub={`This month's activity. Resets ${usage.resets}.`}>Usage</H2>
          {usage.rows.map(([label, n]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4 border-b border-hairline py-3"
            >
              <span className="text-small text-ink">{label}</span>
              <span className="font-mono text-small text-ink">{n}</span>
            </div>
          ))}
        </section>
      )}

      {tab === "dev" && (
        <section className="flex flex-col gap-3">
          <H2
            first
            sub="GetEmployed is open source. Run it on your own machine with your own keys."
          >
            Self-hosting
          </H2>
          <pre className="m-0 overflow-x-auto rounded-md border border-hairline bg-surface-1 px-4 py-3 font-mono text-small leading-[1.7] text-ink-muted">
            {
              "git clone https://github.com/ashmit27j/get-employed\ncd get-employed && cp .env.example .env\ndocker compose up"
            }
          </pre>
          <Button
            variant="tertiary"
            size="sm"
            href="https://github.com/ashmit27j/get-employed"
            target="_blank"
            className="self-start"
          >
            View on GitHub →
          </Button>
          <H2
            sub={`Your AI features use your own key instead of the project's. It's stored encrypted.${ownKey ? " Your key is set." : ""}`}
          >
            LLM API key
          </H2>
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              start(async () => {
                const r = await saveLlmKey(apiKey);
                setKeyState(r.ok ? { saved: true } : { error: r.error });
                if (r.ok) {
                  setApiKey("");
                  update((d) => ({ ...d, ownKey: true }));
                }
              });
            }}
          >
            <div className="min-w-[220px] flex-1">
              <TextInput
                aria-label="LLM API key"
                type="password"
                placeholder="sk-…"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setKeyState({});
                }}
                autoComplete="off"
              />
            </div>
            <Button type="submit" disabled={!apiKey.trim()}>
              {keyState.saved ? "Saved" : "Save key"}
            </Button>
            {ownKey && (
              <Button
                type="button"
                variant="tertiary"
                onClick={() =>
                  start(async () => {
                    await removeLlmKey();
                    setKeyState({});
                    update((d) => ({ ...d, ownKey: false }));
                  })
                }
              >
                Remove key
              </Button>
            )}
          </form>
          {keyState.error && (
            <p role="alert" className="m-0 text-small text-danger-ink">
              {keyState.error}
            </p>
          )}
        </section>
      )}
    </>
  );
}
