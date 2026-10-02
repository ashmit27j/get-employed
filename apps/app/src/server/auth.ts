import "server-only";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { emailOTP, username } from "better-auth/plugins";
import { dash } from "@better-auth/infra";
import { PASSWORD_HINT, passwordOk } from "@ge/core";
import { schema } from "@ge/db";
import { getDb } from "./db";
import { env, googleEnabled } from "./env";
import { sendMail } from "./mail";
import { deletePrefix } from "./storage";

/** Endpoints that set a new password, and the body field holding it. */
const NEW_PASSWORD: Record<string, "password" | "newPassword"> = {
  "/sign-up/email": "password",
  "/change-password": "newPassword",
  "/reset-password": "newPassword",
  "/email-otp/reset-password": "password",
};

const OTP_SUBJECT: Record<string, string> = {
  "forget-password": "Your GetEmployed password reset code",
  "email-verification": "Verify your email for GetEmployed",
  "sign-in": "Your GetEmployed sign-in code",
  "change-email": "Confirm your new email for GetEmployed",
};

function createAuth() {
  const e = env();
  return betterAuth({
    appName: "GetEmployed",
    baseURL: e.BETTER_AUTH_URL ?? e.NEXT_PUBLIC_SITE_URL,
    // Development falls back to a fixed secret so a fresh clone runs; production requires one (env.ts).
    secret: e.BETTER_AUTH_SECRET ?? "dev-only-secret-change-me-dev-only-secret",
    trustedOrigins: [e.NEXT_PUBLIC_SITE_URL],
    database: drizzleAdapter(getDb(), { provider: "pg", usePlural: true, schema }),
    emailAndPassword: { enabled: true, minPasswordLength: 8, autoSignIn: true },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        const field = NEW_PASSWORD[ctx.path];
        const value = field
          ? (ctx.body as Record<string, unknown> | undefined)?.[field]
          : undefined;
        if (field && (typeof value !== "string" || !passwordOk(value))) {
          throw new APIError("BAD_REQUEST", { code: "WEAK_PASSWORD", message: PASSWORD_HINT });
        }
      }),
    },
    // Used by Account → change email: the new address confirms with a link.
    emailVerification: {
      async sendVerificationEmail({ user, url }) {
        await sendMail({
          to: user.email,
          subject: "Confirm your email for GetEmployed",
          text: `Open this link to confirm ${user.email}:\n\n${url}\n\nIf you didn't ask for this, you can ignore this email.`,
        });
      },
    },
    socialProviders: googleEnabled()
      ? {
          google: {
            clientId: e.GOOGLE_CLIENT_ID!,
            clientSecret: e.GOOGLE_CLIENT_SECRET!,
            // Sign-in only: openid, email, profile. gmail.send is requested later, on its own (docs/email-and-google.md).
            scope: ["openid", "email", "profile"],
          },
        }
      : undefined,
    user: {
      changeEmail: {
        enabled: true,
        // The current address approves the change first, then the new one is verified.
        async sendChangeEmailConfirmation({ user, newEmail, url }) {
          await sendMail({
            to: user.email,
            subject: "Approve your GetEmployed email change",
            text: `Someone asked to change your GetEmployed email to ${newEmail}. If it was you, open this link:\n\n${url}\n\nIf it wasn't, ignore this email and your address stays the same.`,
          });
        },
      },
      deleteUser: {
        enabled: true,
        // Database rows cascade from users; stored files don't, so remove them here.
        async afterDelete(user) {
          await deletePrefix(`users/${user.id}/`).catch((err: unknown) =>
            console.error("[auth] could not delete files", err),
          );
        },
      },
      additionalFields: {
        onboardingStep: { type: "number", required: false, input: false },
        targetRole: { type: "string", required: false, input: false },
        experienceLevel: { type: "string", required: false, input: false },
        preferredLocations: { type: "string[]", required: false, input: false },
      },
    },
    databaseHooks: {
      user: {
        create: {
          // Every new account starts locked until its Job Profile is filled in (session.ts).
          before: async (user) => ({ data: { ...user, onboardingStep: 1 } }),
        },
      },
    },
    plugins: [
      username(),
      emailOTP({
        otpLength: 6,
        expiresIn: 10 * 60,
        storeOTP: "hashed",
        async sendVerificationOTP({ email, otp, type }) {
          await sendMail({
            to: email,
            subject: OTP_SUBJECT[type] ?? "Your GetEmployed code",
            text: `Your code is ${otp}. It expires in 10 minutes.\n\nIf you didn't ask for this, you can ignore this email.`,
          });
        },
      }),
      dash(),
      nextCookies(),
    ],
  });
}

let instance: ReturnType<typeof createAuth> | undefined;
/** Lazily created so builds don't need a database. */
export function auth() {
  instance ??= createAuth();
  return instance;
}
export type Auth = ReturnType<typeof createAuth>;
export type SessionUser = Auth["$Infer"]["Session"]["user"];
