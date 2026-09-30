"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button, PillTabs, TextInput, cx, initials } from "@ge/ui";
import { authClient } from "@/lib/auth-client";
import { AuthChrome, AuthTitle, GoogleMark, OrDivider } from "./AuthChrome";
import { PasswordRules } from "@/components/auth/PasswordRules";
import { PASSWORD_HINT, passwordOk } from "@ge/core";

type Mode = "signin" | "signup";

/** Where to go after signing in: a same-origin `next` path, or the job board. */
function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/jobs";
}

type Token = [kind: "k" | "s" | "p" | "a", text: string];
const TOKEN_CLASS: Record<Token[0], string> = {
  k: "text-primary",
  s: "text-primary-200",
  p: "text-ink-subtle",
  a: "text-ink-tertiary",
};

/** The code window in the side panel. It mirrors what you type, one highlighted line at a time. */
function CodeWindow({ lines, highlight }: { lines: Token[][]; highlight: number }) {
  return (
    <div className="flex-none overflow-hidden rounded-lg border border-hairline-strong bg-canvas shadow-edge">
      <div className="flex h-8 items-center gap-1.5 border-b border-hairline px-3">
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-2 rounded-full bg-surface-4" />
        ))}
      </div>
      <div className="py-3.5 font-mono text-ui leading-6">
        {lines.map((toks, i) => (
          <div key={i} className={cx("flex pr-4", i === highlight && "bg-glow-soft")}>
            <span className="w-10 flex-none pr-4 text-right text-ink-tertiary">{i + 1}</span>
            <span className="truncate whitespace-pre">
              {toks.map(([k, t], j) => (
                <span key={j} className={TOKEN_CLASS[k]}>
                  {t}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const PIPELINE = [
  { i: "R", role: "Backend Engineer I", co: "Razorpay · Tue 19:00", stage: "Interview", ok: true },
  { i: "P", role: "Frontend Engineer", co: "Postman · Thu 11:30", stage: "Interview", ok: true },
  { i: "Z", role: "SDE Intern", co: "Zepto · awaiting slot", stage: "Applied", ok: false },
];

function SidePanel({
  mode,
  user,
  pw,
  name,
  email,
}: {
  mode: Mode;
  user: string;
  pw: string;
  name: string;
  email: string;
}) {
  const signin = mode === "signin";
  const shownName = name.trim() || "Aarav Sharma";
  const lines: Token[][] = signin
    ? [
        [
          ["k", "const "],
          ["p", "session = "],
          ["k", "await "],
          ["p", "ge."],
          ["s", "signIn"],
          ["p", "({"],
        ],
        [
          ["p", "  "],
          ["a", "username"],
          ["p", ": "],
          ["s", `"${user || "aarav.s"}"`],
          ["p", ","],
        ],
        [
          ["p", "  "],
          ["a", "password"],
          ["p", ": "],
          ["s", `"${pw ? "•".repeat(Math.min(pw.length, 12)) : "••••••••"}"`],
        ],
        [["p", "});"]],
        [],
        [
          ["p", "session."],
          ["s", "tracker"],
        ],
        [
          ["p", "  ."],
          ["s", "where"],
          ["p", "("],
          ["a", "stage"],
          ["p", " === "],
          ["s", '"interview"'],
          ["p", ")"],
        ],
        [
          ["p", "  ."],
          ["s", "thisWeek"],
          ["p", "();"],
        ],
      ]
    : [
        [
          ["p", "<"],
          ["k", "Profile"],
        ],
        [
          ["p", "  "],
          ["a", "name"],
          ["p", "="],
          ["s", `"${shownName}"`],
        ],
        [
          ["p", "  "],
          ["a", "email"],
          ["p", "="],
          ["s", `"${email || "you@college.edu"}"`],
        ],
        [
          ["p", "  "],
          ["a", "plan"],
          ["p", "="],
          ["s", '"free"'],
        ],
        [["p", "/>"]],
        [],
        [["a", "// next: role, experience,"]],
        [["a", "//       location, resume"]],
      ];
  const highlight = signin ? (user || pw ? (pw ? 2 : 1) : -1) : pw ? -1 : email ? 2 : name ? 1 : -1;
  return (
    <aside
      aria-hidden="true"
      className="absolute inset-y-0 left-1/2 box-border w-1/2 overflow-hidden border-x border-hairline bg-surface-1 max-[899px]:hidden"
    >
      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,var(--color-hairline)_0_1px,transparent_1px_10px)] opacity-55" />
      <div className="absolute inset-x-0 top-[72px] border-t border-hairline" />
      <div className="absolute inset-x-0 bottom-[72px] border-t border-hairline" />
      <div className="absolute inset-y-0 left-10 border-l border-hairline" />
      <div className="absolute inset-y-0 right-10 border-l border-hairline" />
      <div className="relative box-border flex h-full flex-col px-10">
        <div className="flex h-[72px] flex-none items-center justify-between gap-3 px-5">
          <span className="text-eyebrow font-medium text-ink-subtle uppercase">
            {signin ? "Your pipeline" : "New profile"}
          </span>
          <span className="font-mono text-caption text-ink-tertiary">
            {signin ? "session.ts" : "profile.tsx"}
          </span>
        </div>
        <div className="relative flex min-h-0 flex-1 flex-col justify-center px-5 py-6">
          <CodeWindow lines={lines} highlight={highlight} />
          <div className="flex justify-end pr-10">
            <div className="relative h-9 w-px bg-hairline-tertiary">
              <span className="absolute -bottom-[3px] -left-[3px] size-[7px] rounded-full bg-primary shadow-glow-dot" />
            </div>
          </div>
          <div className="w-[min(300px,100%)] flex-none self-end rounded-2xl border border-hairline-strong bg-surface-2 p-2">
            {signin ? (
              <div className="flex flex-col gap-2.5 rounded-[14px] border border-hairline bg-canvas p-3.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-small font-medium">Interviews this week</span>
                  <span className="font-mono text-caption text-ink-subtle">2 of 3</span>
                </div>
                {PIPELINE.map((r) => (
                  <div
                    key={r.role}
                    className="flex items-center gap-2.5 border-t border-hairline pt-2.5"
                  >
                    <span className="grid size-6 flex-none place-items-center rounded-sm border border-hairline bg-surface-3 text-micro font-semibold tracking-normal text-ink-subtle">
                      {r.i}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-ui">{r.role}</span>
                      <span className="text-caption text-ink-tertiary">{r.co}</span>
                    </span>
                    <span className="inline-flex h-[22px] items-center gap-1.5 rounded-full border border-hairline-strong px-2 text-micro tracking-normal text-ink-subtle">
                      <span
                        className={cx(
                          "size-1.5 rounded-full",
                          r.ok ? "bg-success" : "bg-ink-tertiary",
                        )}
                      />
                      {r.stage}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3 rounded-[14px] border border-hairline bg-canvas p-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-9 flex-none place-items-center rounded-full border border-hairline-strong bg-surface-3 text-ui font-semibold">
                    {initials(shownName).toUpperCase()}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-small font-medium">{shownName}</span>
                    <span className="truncate font-mono text-micro tracking-normal text-ink-tertiary">
                      {email || "you@college.edu"}
                    </span>
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 border-t border-hairline pt-3">
                  {[
                    ["Role", "next"],
                    ["Experience", "—"],
                    ["Location", "—"],
                    ["Resume", "—"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-2 text-caption">
                      <span className="text-ink-subtle">{k}</span>
                      <span className="font-mono text-ink-tertiary">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex h-[72px] flex-none items-center px-5">
          <span className="text-small text-pretty text-ink-subtle">
            {signin
              ? "Your tracker picks up where you left off."
              : "One profile. Every role is ranked against it."}
          </span>
        </div>
      </div>
    </aside>
  );
}

const hatch =
  "w-8 flex-none bg-[repeating-linear-gradient(45deg,var(--color-hairline)_0_1px,transparent_1px_8px)] max-[899px]:hidden";

export function AuthScreen({ googleEnabled }: { googleEnabled: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const mode: Mode = pathname.startsWith("/signup") ? "signup" : "signin";
  const signin = mode === "signin";

  const [user, setUser] = useState("");
  const [pw, setPw] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [failed, setFailed] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const setMode = (m: string) => {
    setErr("");
    setFailed(false);
    const q = next !== "/jobs" ? `?next=${encodeURIComponent(next)}` : "";
    router.replace(`/${m}${q}`, { scroll: false });
  };

  const onSignIn = async (e: FormEvent) => {
    e.preventDefault();
    const id = user.trim();
    if (!id || !pw) return setFailed(true);
    setBusy(true);
    const res = id.includes("@")
      ? await authClient.signIn.email({ email: id, password: pw })
      : await authClient.signIn.username({ username: id, password: pw });
    setBusy(false);
    if (res.error) return setFailed(true);
    router.push(next);
    router.refresh();
  };

  const onSignUp = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !/\S+@\S+\.\S+/.test(email))
      return setErr("Add your name and a valid email.");
    if (!passwordOk(pass)) return setErr(PASSWORD_HINT);
    setErr("");
    setBusy(true);
    const res = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password: pass,
    });
    setBusy(false);
    if (res.error) {
      return setErr(
        res.error.code === "USER_ALREADY_EXISTS" ||
          res.error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"
          ? "An account with that email already exists. Sign in instead."
          : "We couldn't create your account. Try again.",
      );
    }
    router.push("/profile");
    router.refresh();
  };

  const google = (callbackURL: string) =>
    authClient.signIn.social({ provider: "google", callbackURL });
  const tabs = [
    { value: "signin", label: "Sign in" },
    { value: "signup", label: "Create account" },
  ];
  const resetHref = `/reset${user.includes("@") ? `?email=${encodeURIComponent(user.trim())}` : ""}`;

  return (
    <AuthChrome>
      <div className="flex flex-1 flex-col justify-center py-14">
        <div className="relative flex justify-center border-y border-hairline">
          <div className="relative flex w-[min(1264px,calc(100%-32px))]">
            {(
              [
                "-left-1 -top-1",
                "-right-1 -top-1",
                "-left-1 -bottom-1",
                "-right-1 -bottom-1",
              ] as const
            ).map((pos) => (
              <span
                key={pos}
                aria-hidden="true"
                className={cx(
                  "absolute box-border size-[7px] border border-hairline-tertiary bg-canvas",
                  pos,
                )}
              />
            ))}
            <div aria-hidden="true" className={cx(hatch, "border-r border-hairline")} />
            <div className="relative grid min-h-[720px] min-w-0 flex-1 grid-cols-2 max-[899px]:min-h-0 max-[899px]:grid-cols-1">
              <section
                className={cx(
                  "col-start-1 row-start-1 box-border items-center justify-center p-14 transition-opacity duration-500 ease-standard max-md:px-4 max-md:py-10",
                  signin ? "flex opacity-100" : "invisible flex opacity-0 max-[899px]:hidden",
                )}
                aria-hidden={!signin}
              >
                <form
                  onSubmit={onSignIn}
                  className="flex w-full max-w-[380px] flex-col gap-6"
                  inert={!signin}
                >
                  <div className="flex">
                    <PillTabs label="Account" options={tabs} value={mode} onChange={setMode} />
                  </div>
                  <AuthTitle
                    title="Welcome back."
                    sub="Sign in to your tracker, saved searches and outbox."
                  />
                  <div className="flex flex-col gap-4">
                    <TextInput
                      label="Username or email"
                      placeholder="aarav.s"
                      value={user}
                      onChange={(e) => setUser(e.target.value)}
                      autoComplete="username"
                    />
                    <TextInput
                      label="Password"
                      type="password"
                      placeholder="Your password"
                      value={pw}
                      onChange={(e) => setPw(e.target.value)}
                      autoComplete="current-password"
                    />
                  </div>
                  <div className="flex flex-col gap-4">
                    <Button type="submit" size="lg" fullWidth disabled={busy}>
                      Sign in
                    </Button>
                    {failed && (
                      <div className="flex flex-col gap-2">
                        <span role="alert" className="text-small text-ink-subtle">
                          That username or password didn&apos;t match.
                        </span>
                        <Link href={resetHref} className="self-start text-small text-ink">
                          Forgot password?
                        </Link>
                      </div>
                    )}
                  </div>
                  {googleEnabled && (
                    <div className="flex flex-col gap-4">
                      <OrDivider />
                      <Button
                        variant="secondary"
                        size="lg"
                        fullWidth
                        iconLeft={<GoogleMark />}
                        onClick={() => google(next)}
                      >
                        Sign in with Google
                      </Button>
                    </div>
                  )}
                </form>
              </section>

              <section
                className={cx(
                  "col-start-1 row-start-1 box-border items-center justify-center p-14 transition-opacity duration-500 ease-standard max-md:px-4 max-md:py-10",
                  !signin ? "flex opacity-100" : "invisible flex opacity-0 max-[899px]:hidden",
                )}
                aria-hidden={signin}
              >
                <form
                  onSubmit={onSignUp}
                  className="flex w-full max-w-[380px] flex-col gap-6"
                  inert={signin}
                >
                  <div className="flex">
                    <PillTabs label="Account" options={tabs} value={mode} onChange={setMode} />
                  </div>
                  <AuthTitle
                    title="Create your account."
                    sub="Free to search. Setup takes about two minutes."
                  />
                  <div className="flex flex-col gap-4">
                    <TextInput
                      label="Full name"
                      placeholder="Aarav Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                    />
                    <TextInput
                      label="Email"
                      type="email"
                      placeholder="you@college.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                    <TextInput
                      label="Password"
                      type="password"
                      placeholder="Create a strong password"
                      value={pass}
                      onChange={(e) => setPass(e.target.value)}
                      autoComplete="new-password"
                    />
                    <PasswordRules value={pass} />
                  </div>
                  <Button type="submit" size="lg" fullWidth disabled={busy}>
                    Create account
                  </Button>
                  {googleEnabled && (
                    <div className="flex flex-col gap-4">
                      <OrDivider />
                      <Button
                        variant="secondary"
                        size="lg"
                        fullWidth
                        iconLeft={<GoogleMark />}
                        onClick={() => google("/profile")}
                      >
                        Sign up with Google
                      </Button>
                    </div>
                  )}
                  {err && (
                    <span role="alert" className="text-caption text-ink-subtle">
                      {err}
                    </span>
                  )}
                </form>
              </section>

              <SidePanel mode={mode} user={user} pw={pw} name={name} email={email} />
            </div>
            <div aria-hidden="true" className={cx(hatch, "border-l border-hairline")} />
          </div>
        </div>
      </div>
    </AuthChrome>
  );
}
