import type { Metadata } from "next";
import { ConnectMailbox } from "@/components/mailbox/ConnectMailbox";
import { Mailbox } from "@/components/mailbox/Mailbox";
import { PageBody, Topbar } from "@/components/shell/AppShell";
import { finishGmailConnect } from "@/server/actions/settings";
import { googleEnabled } from "@/server/env";
import { loadMailbox } from "@/server/mailbox";
import { requireOnboardedUser } from "@/server/session";
import { loadSettings } from "@/server/settings";

export const metadata: Metadata = { title: "Mailbox" };

export default async function MailboxPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string }>;
}) {
  const { connected } = await searchParams;
  const user = await requireOnboardedUser();
  // Back from Google's consent screen: record the Gmail connection.
  const gmail = connected === "gmail" ? await finishGmailConnect() : null;
  const [data, settings] = await Promise.all([loadMailbox(user), loadSettings(user.id)]);
  const setup = !data.sender && !settings.mailbox.setupDone;
  return (
    <>
      <Topbar crumbs={[{ label: "Mailbox" }]} />
      <PageBody>
        {setup ? (
          <ConnectMailbox
            googleEnabled={googleEnabled()}
            error={
              gmail && !gmail.ok
                ? "Google didn't grant send access. Try again and tick the Gmail permission."
                : undefined
            }
          />
        ) : (
          <Mailbox
            data={data}
            userName={user.name}
            userEmail={user.email}
            nowIso={new Date().toISOString()}
          />
        )}
      </PageBody>
    </>
  );
}
