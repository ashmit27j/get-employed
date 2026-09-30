"use client";
import { useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Avatar,
  Button,
  Icon,
  InlineSelect,
  Modal,
  StatusBadge,
  TextInput,
  type IconName,
} from "@ge/ui";
import { authClient } from "@/lib/auth-client";
import { revokeOtherSessions, revokeSession, updateAccount } from "@/server/actions/account";
import type { AccountData } from "@/server/account";
import { H2, Row } from "./parts";
import { PasswordRules } from "@/components/auth/PasswordRules";
import { passwordOk } from "@ge/core";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const day = (iso: string) => {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
};
function ago(iso: string, now: Date) {
  const mins = Math.round((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (mins < 10) return "active now";
  if (mins < 60 * 24)
    return `${Math.round(mins / 60) || 1} ${Math.round(mins / 60) > 1 ? "hours" : "hour"} ago`;
  const days = Math.round(mins / 1440);
  return days < 7 ? `${days} ${days === 1 ? "day" : "days"} ago` : day(iso);
}

function Tile({ children }: { children: ReactNode }) {
  return (
    <span className="flex size-8 flex-none items-center justify-center overflow-hidden rounded-md border border-hairline bg-surface-1 text-ink-subtle">
      {children}
    </span>
  );
}

function PasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  return (
    <Modal
      open
      onClose={onClose}
      title={done ? "Password changed" : "Change password"}
      sub={done ? "Other devices were signed out." : undefined}
      width={420}
      footer={
        done ? (
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        ) : (
          <>
            <Button variant="tertiary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={pending || !current || !passwordOk(next)}
              onClick={() =>
                start(async () => {
                  const r = await authClient.changePassword({
                    currentPassword: current,
                    newPassword: next,
                    revokeOtherSessions: true,
                  });
                  if (r.error)
                    setError(
                      r.error.status === 400
                        ? "Your current password didn't match."
                        : "That didn't work. Try again.",
                    );
                  else setDone(true);
                })
              }
            >
              Change password
            </Button>
          </>
        )
      }
    >
      {!done && (
        <div className="flex flex-col gap-3">
          <TextInput
            label="Current password"
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
          />
          <TextInput
            label="New password"
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
          />
          <PasswordRules value={next} />
          {error && (
            <p role="alert" className="m-0 text-small text-danger-ink">
              {error}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}

function EmailModal({ current, onClose }: { current: string; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();
  return (
    <Modal
      open
      onClose={onClose}
      title={sent ? "Check your email" : "Change email"}
      sub={
        sent
          ? `We sent a link to ${current}. Open it to approve the change, then confirm ${email}.`
          : `You sign in with ${current} today.`
      }
      width={420}
      footer={
        sent ? (
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        ) : (
          <>
            <Button variant="tertiary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={pending || !/.+@.+\..+/.test(email)}
              onClick={() =>
                start(async () => {
                  const r = await authClient.changeEmail({
                    newEmail: email.trim(),
                    callbackURL: `${location.pathname}#settings/account`,
                  });
                  if (r.error) setError(r.error.message ?? "That didn't work. Try again.");
                  else setSent(true);
                })
              }
            >
              Send link
            </Button>
          </>
        )
      }
    >
      {!sent && (
        <div className="flex flex-col gap-3">
          <TextInput
            label="New email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          {error && (
            <p role="alert" className="m-0 text-small text-danger-ink">
              {error}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}

function DeleteModal({ hasPassword, onClose }: { hasPassword: boolean; onClose: () => void }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const ready = confirm === "DELETE" && (!hasPassword || password.length > 0);
  return (
    <Modal
      open
      onClose={onClose}
      title="Delete your account?"
      sub="Removes your resumes, searches, outreach history and interview recordings. Emails already sent stay in your Gmail. This can't be undone."
      width={460}
      footer={
        <>
          <Button variant="tertiary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={!ready || pending}
            className="border-danger-line! bg-danger-soft! text-danger-text! shadow-none!"
            onClick={() =>
              start(async () => {
                const r = await authClient.deleteUser(hasPassword ? { password } : {});
                if (r.error)
                  setError(
                    r.error.status === 400
                      ? "Your password didn't match."
                      : (r.error.message ?? "That didn't work. Try again."),
                  );
                else router.replace("/signin");
              })
            }
          >
            Delete account
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {hasPassword && (
          <TextInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        )}
        <TextInput
          label="Type DELETE to confirm"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="off"
        />
        {error && (
          <p role="alert" className="m-0 text-small text-danger-ink">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}

export function Account({
  data,
  nickname: initialNick,
  workRole: initialRole,
  connectors,
  nowIso,
  onChanged,
  onLocal,
}: {
  data: AccountData;
  nickname: string;
  workRole: string;
  connectors: { github: string | null; mailbox: string | null };
  nowIso: string;
  /** Reload after a change the server owns (photo, Google link). */
  onChanged: () => void;
  /** Report edits back to the settings dialog. */
  onLocal: (p: {
    name?: string;
    image?: string | null;
    nickname?: string;
    workRole?: string;
  }) => void;
}) {
  const now = new Date(nowIso);
  const [name, setName] = useState(data.name);
  const [nick, setNick] = useState(initialNick);
  const [role, setRole] = useState(initialRole);
  const [image, setImage] = useState(data.image);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [modal, setModal] = useState<"password" | "email" | "delete" | null>(null);
  const [killed, setKilled] = useState<string[]>([]);
  const [, start] = useTransition();
  const file = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const save = (patch: Parameters<typeof updateAccount>[0]) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => start(() => updateAccount(patch)), 600);
  };
  const upload = async (f: File) => {
    setPhotoError(null);
    const body = new FormData();
    body.append("file", f);
    const res = await fetch("/api/me/photo", { method: "POST", body });
    const json = (await res.json().catch(() => ({}))) as { image?: string; error?: string };
    if (!res.ok || !json.image)
      return setPhotoError(json.error ?? "That upload didn't work. Try again.");
    setImage(json.image);
    onLocal({ image: json.image });
    onChanged();
  };
  const sessions = data.sessions.filter((s) => !killed.includes(s.token));

  return (
    <>
      <section className="flex flex-col">
        <H2 first sub="Sign-in, security and your data. Career details live on your Job Profile.">
          Profile
        </H2>
        <div className="flex flex-wrap items-center gap-4 border-b border-hairline py-4">
          <Avatar name={name} size={56} src={image ?? undefined} />
          <div className="flex min-w-[160px] flex-1 flex-col gap-0.5">
            <span className="text-small text-ink">Profile photo</span>
            <span className="text-caption text-ink-subtle">
              Shown in the app and on outreach signatures. PNG or JPG, up to 5 MB.
            </span>
            {photoError && (
              <span role="alert" className="text-caption text-danger-ink">
                {photoError}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              ref={file}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f);
                e.target.value = "";
              }}
            />
            <Button variant="secondary" size="sm" onClick={() => file.current?.click()}>
              Upload photo
            </Button>
            <Button
              variant="tertiary"
              size="sm"
              disabled={!image}
              onClick={() =>
                start(async () => {
                  await fetch("/api/me/photo", { method: "DELETE" });
                  setImage(null);
                  onLocal({ image: null });
                  onChanged();
                })
              }
            >
              Remove
            </Button>
          </div>
        </div>
        <Row title="Full name">
          <div className="w-[220px]">
            <TextInput
              aria-label="Full name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                onLocal({ name: e.target.value });
                if (e.target.value.trim()) save({ name: e.target.value });
              }}
            />
          </div>
        </Row>
        <Row title="What should we call you?">
          <div className="w-[220px]">
            <TextInput
              aria-label="What should we call you?"
              value={nick}
              onChange={(e) => {
                setNick(e.target.value);
                onLocal({ nickname: e.target.value });
                save({ nickname: e.target.value });
              }}
            />
          </div>
        </Row>
        <Row title="What best describes your work?">
          <InlineSelect
            label="What best describes your work?"
            options={["Student", "Professional", "Freelancer", "Between jobs"]}
            value={role}
            onChange={(v) => {
              setRole(v);
              onLocal({ workRole: v });
              start(() => updateAccount({ workRole: v }));
            }}
          />
        </Row>
      </section>

      <section className="flex flex-col">
        <H2
          action={
            sessions.length > 1 && (
              <Button
                variant="tertiary"
                size="sm"
                onClick={() => {
                  setKilled(sessions.filter((s) => !s.current).map((s) => s.token));
                  start(() => revokeOtherSessions());
                }}
              >
                Sign out other sessions
              </Button>
            )
          }
        >
          Active sessions
        </H2>
        {sessions.map((x) => (
          <div key={x.token} className="flex items-center gap-3 border-b border-hairline py-3.5">
            <Icon name={x.icon as IconName} size={18} className="mx-[7px] text-ink-subtle" />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-small text-ink">{x.device}</span>
              <span className="text-caption text-ink-subtle">
                {[x.ip, x.current ? "active now" : ago(x.lastActive, now)]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </div>
            {x.current ? (
              <StatusBadge tone="success">This device</StatusBadge>
            ) : (
              <Button
                variant="tertiary"
                size="sm"
                onClick={() => {
                  setKilled((k) => [...k, x.token]);
                  start(() => revokeSession(x.token));
                }}
              >
                Sign out
              </Button>
            )}
          </div>
        ))}
      </section>

      <section className="flex flex-col">
        <H2>Sign-in</H2>
        <Row title="Email" sub={`${data.email}${data.emailVerified ? " · verified" : ""}`}>
          <Button variant="secondary" size="sm" onClick={() => setModal("email")}>
            Change
          </Button>
        </Row>
        {data.hasPassword && (
          <Row
            title="Password"
            sub={data.passwordChangedAt ? `Last changed ${day(data.passwordChangedAt)}` : undefined}
          >
            <Button variant="secondary" size="sm" onClick={() => setModal("password")}>
              Change password
            </Button>
          </Row>
        )}
        {data.google && (
          <div className="flex items-center gap-3 border-b border-hairline py-3.5">
            <Tile>
              <Icon name="globe" size={16} />
            </Tile>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-small text-ink">Google</span>
              <span className="text-caption text-ink-subtle">
                {data.google.connectedAt
                  ? `Connected ${day(data.google.connectedAt)} · used to sign in`
                  : "Not connected"}
              </span>
            </div>
            {data.google.connectedAt ? (
              <Button
                variant="tertiary"
                size="sm"
                disabled={!data.hasPassword}
                onClick={() =>
                  start(async () => {
                    await authClient.unlinkAccount({ accountId: data.google!.accountId! });
                    onChanged();
                  })
                }
              >
                Disconnect
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  void authClient.linkSocial({
                    provider: "google",
                    callbackURL: `${location.pathname}#settings/account`,
                  })
                }
              >
                Connect
              </Button>
            )}
          </div>
        )}
      </section>

      <section className="flex flex-col">
        <H2>Connectors</H2>
        {(
          [
            [
              "GitHub Integration",
              "img:/github.png",
              connectors.github ? `Connected as ${connectors.github}` : "Not connected",
              "/profiles/github",
              !!connectors.github,
            ],
            [
              "Gmail",
              "mail",
              connectors.mailbox ? `Sending as ${connectors.mailbox}` : "Not connected",
              "#settings/mailbox",
              !!connectors.mailbox,
            ],
          ] as const
        ).map(([label, icon, sub, href, on]) => (
          <div key={label} className="flex items-center gap-3 border-b border-hairline py-3.5">
            <Tile>
              {icon.startsWith("img:") ? (
                // eslint-disable-next-line @next/next/no-img-element -- small brand icon, as in the sidebar
                <img
                  src={icon.slice(4)}
                  alt=""
                  width={16}
                  height={16}
                  className="block rounded-[3px]"
                />
              ) : (
                <Icon name={icon as IconName} size={16} />
              )}
            </Tile>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-small text-ink">{label}</span>
              <span className="text-caption text-ink-subtle">{sub}</span>
            </div>
            <Button variant={on ? "tertiary" : "secondary"} size="sm" href={href}>
              {on ? "Manage" : "Connect"}
            </Button>
          </div>
        ))}
      </section>

      <section className="flex flex-col">
        <H2>Your data</H2>
        <Row
          title="Export data"
          sub="Resumes, tracker, outreach history and profile as a JSON file."
        >
          <Button variant="secondary" size="sm" href="/api/me/export">
            Export
          </Button>
        </Row>
        <Row
          title="Delete account"
          sub="Removes your resumes, searches, outreach history and interview recordings. Emails already sent stay in your Gmail."
        >
          <button
            type="button"
            onClick={() => setModal("delete")}
            className="h-7 cursor-pointer rounded-md border border-danger-line px-3 text-small text-danger-text transition-colors duration-(--duration-base) hover:bg-danger-soft focus-visible:shadow-focus focus-visible:outline-none"
          >
            Delete account
          </button>
        </Row>
      </section>

      {modal === "password" && <PasswordModal onClose={() => setModal(null)} />}
      {modal === "email" && <EmailModal current={data.email} onClose={() => setModal(null)} />}
      {modal === "delete" && (
        <DeleteModal hasPassword={data.hasPassword} onClose={() => setModal(null)} />
      )}
    </>
  );
}
