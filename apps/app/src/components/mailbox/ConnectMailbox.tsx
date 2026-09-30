"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Icon, StatusBadge, type IconName } from "@ge/ui";
import { authClient } from "@/lib/auth-client";
import { updateSettings } from "@/server/actions/settings";
import { SmtpForm } from "@/components/settings/Settings";

const PERKS: [IconName, string, string][] = [
  ["send", "Sent from your own address", "Recruiters reply to you, not to a no-reply address."],
  [
    "shield-check",
    "Nothing sends without you",
    "Every email waits in the outbox until you approve it.",
  ],
  [
    "eye-off",
    "We never read your inbox",
    "Gmail access is send-only. Replies stay in your mail app.",
  ],
];

/** First visit to the Mailbox with nothing connected: pick Gmail or SMTP, or skip for now. */
export function ConnectMailbox({
  googleEnabled,
  error,
}: {
  googleEnabled: boolean;
  error?: string;
}) {
  const router = useRouter();
  const [smtp, setSmtp] = useState(false);
  const [pending, start] = useTransition();

  const gmail = () =>
    void authClient.linkSocial({
      provider: "google",
      scopes: ["https://www.googleapis.com/auth/gmail.send"],
      callbackURL: "/mailbox?connected=gmail",
    });
  const skip = () =>
    start(async () => {
      await updateSettings("mailbox", { setupDone: true });
      router.refresh();
    });

  return (
    <section
      aria-labelledby="connect-title"
      className="mx-auto flex w-full max-w-[760px] flex-col gap-8 py-4"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl border border-primary-line bg-primary-soft text-primary">
          <Icon name="mail" size={22} />
        </span>
        <h1 id="connect-title" className="m-0 text-headline font-semibold">
          Connect your mailbox
        </h1>
        <p className="m-0 max-w-[520px] text-body text-pretty text-ink-subtle">
          Outreach you approve goes out from your own email, and replies land where you already read
          mail.
        </p>
      </div>

      <ul className="m-0 grid list-none grid-cols-3 gap-3 p-0 max-md:grid-cols-1">
        {PERKS.map(([icon, title, body]) => (
          <li
            key={title}
            className="flex flex-col gap-1.5 rounded-lg border border-hairline bg-surface-1 p-4"
          >
            <Icon name={icon} size={18} className="text-primary" />
            <span className="text-small font-medium text-ink">{title}</span>
            <span className="text-caption text-pretty text-ink-subtle">{body}</span>
          </li>
        ))}
      </ul>

      {error && (
        <p role="alert" className="m-0 text-center text-small text-danger-ink">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
        <div className="flex flex-col gap-3 rounded-lg border border-primary-line bg-surface-1 p-5 shadow-edge">
          <div className="flex items-center justify-between gap-2">
            <span className="text-body font-semibold">Gmail</span>
            <StatusBadge tone="accent">Recommended</StatusBadge>
          </div>
          <p className="m-0 flex-1 text-small text-pretty text-ink-subtle">
            {googleEnabled
              ? "Sign in with Google and allow send-only access. Takes about ten seconds."
              : "Google sign-in isn't set up on this server. Use SMTP with a Gmail app password instead."}
          </p>
          <Button fullWidth disabled={!googleEnabled} onClick={gmail}>
            Connect Gmail
          </Button>
        </div>
        <div className="flex flex-col gap-3 rounded-lg border border-hairline bg-surface-1 p-5 shadow-edge">
          <span className="text-body font-semibold">Other email (SMTP)</span>
          <p className="m-0 flex-1 text-small text-pretty text-ink-subtle">
            Outlook, Zoho, your college mail or a Gmail app password. We check the login, then store
            it encrypted.
          </p>
          <Button variant="secondary" fullWidth onClick={() => setSmtp((v) => !v)}>
            {smtp ? "Hide SMTP form" : "Use SMTP"}
          </Button>
        </div>
      </div>

      {smtp && (
        <div className="rounded-lg border border-hairline bg-surface-1 p-5">
          <SmtpForm
            onDone={() =>
              start(async () => {
                await updateSettings("mailbox", { setupDone: true });
                router.refresh();
              })
            }
          />
        </div>
      )}

      <div className="flex flex-col items-center gap-1 text-center">
        <Button variant="tertiary" disabled={pending} onClick={skip}>
          Skip for now
        </Button>
        <span className="text-caption text-ink-subtle">
          You can connect later in Settings → Mailbox. Drafts wait in the outbox until then.
        </span>
      </div>
    </section>
  );
}
