"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, TextInput } from "@ge/ui";
import { authClient } from "@/lib/auth-client";
import { AuthChrome, AuthTitle } from "./AuthChrome";
import { PasswordRules } from "@/components/auth/PasswordRules";
import { PASSWORD_HINT, passwordOk } from "@ge/core";

type Step = "email" | "code" | "password" | "done";

/** "ash****@gmail.com" */
const mask = (email: string) => email.trim().replace(/^(.{1,3}).*@/, "$1****@");

/** Forgot password: email → 6-digit code → new password → done (prototype/Auth.dc.html). */
export function ResetFlow({ initialEmail }: { initialEmail?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [step, setStep] = useState<Step>(initialEmail ? "code" : "email");
  const [code, setCode] = useState("");
  const [np, setNp] = useState("");
  const [np2, setNp2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const sentFor = useRef<string | null>(null);

  const sendCode = async (to: string) => {
    sentFor.current = to;
    // Always move on: whether the address has an account isn't revealed.
    await authClient.emailOtp.requestPasswordReset({ email: to });
  };

  // Arriving from "Forgot password?" with an email: send the code straight away.
  useEffect(() => {
    if (initialEmail && sentFor.current !== initialEmail) void sendCode(initialEmail);
  }, [initialEmail]);

  const submitEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(email)) return setErr("Enter the email on your account.");
    setErr("");
    setBusy(true);
    await sendCode(email.trim());
    setBusy(false);
    setStep("code");
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await authClient.emailOtp.checkVerificationOtp({
      email: email.trim(),
      type: "forget-password",
      otp: code.trim(),
    });
    setBusy(false);
    if (res.error) return setErr("That code is incorrect. Check your email and try again.");
    setErr("");
    setStep("password");
  };

  const reset = async (e: FormEvent) => {
    e.preventDefault();
    if (!passwordOk(np)) return setErr(PASSWORD_HINT);
    if (np !== np2) return setErr("The passwords do not match.");
    setBusy(true);
    const res = await authClient.emailOtp.resetPassword({
      email: email.trim(),
      otp: code.trim(),
      password: np,
    });
    setBusy(false);
    if (res.error) return setErr("That code has expired. Request a new one and try again.");
    setErr("");
    setStep("done");
  };

  const error = err && (
    <span role="alert" className="text-small text-ink">
      {err}
    </span>
  );

  return (
    <AuthChrome back={{ label: "Back to sign in", href: "/signin" }}>
      <div className="flex flex-1 items-center justify-center px-6 py-14">
        <div className="flex w-full max-w-[380px] flex-col gap-6">
          {step === "email" && (
            <form onSubmit={submitEmail} className="flex flex-col gap-6">
              <AuthTitle
                title="Reset password."
                sub="Enter the email on your account and we'll send you a code."
              />
              <TextInput
                label="Email"
                type="email"
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
              {error}
              <Button type="submit" size="lg" fullWidth disabled={busy}>
                Send code
              </Button>
            </form>
          )}
          {step === "code" && (
            <form onSubmit={verify} className="flex flex-col gap-6">
              <AuthTitle
                title="Check your inbox."
                sub={`A mail has been sent to ${mask(email)}. Enter the code it contains.`}
              />
              <TextInput
                label="Code"
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="one-time-code"
                inputMode="numeric"
              />
              {error}
              <Button type="submit" size="lg" fullWidth disabled={busy || code.trim().length < 6}>
                Verify code
              </Button>
              <button
                type="button"
                className="cursor-pointer self-start text-small text-ink-subtle hover:text-ink"
                onClick={() => void sendCode(email.trim())}
              >
                Send a new code
              </button>
            </form>
          )}
          {step === "password" && (
            <form onSubmit={reset} className="flex flex-col gap-6">
              <AuthTitle title="Reset password." sub="Choose a new password for your account." />
              <div className="flex flex-col gap-4">
                <TextInput
                  label="New password"
                  type="password"
                  placeholder="Create a strong password"
                  value={np}
                  onChange={(e) => setNp(e.target.value)}
                  autoComplete="new-password"
                />
                <PasswordRules value={np} />
                <TextInput
                  label="Confirm password"
                  type="password"
                  placeholder="Repeat password"
                  value={np2}
                  onChange={(e) => setNp2(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              {error}
              <Button type="submit" size="lg" fullWidth disabled={busy}>
                Reset password
              </Button>
            </form>
          )}
          {step === "done" && (
            <div className="flex flex-col gap-6">
              <AuthTitle title="Password updated." sub="Sign in with your new password." />
              <Button size="lg" fullWidth onClick={() => router.push("/signin")}>
                Back to sign in
              </Button>
            </div>
          )}
        </div>
      </div>
    </AuthChrome>
  );
}
