"use client";
import { createAuthClient } from "better-auth/react";
import { emailOTPClient, inferAdditionalFields, usernameClient } from "better-auth/client/plugins";
import type { Auth } from "@/server/auth";

export const authClient = createAuthClient({
  plugins: [usernameClient(), emailOTPClient(), inferAdditionalFields<Auth>()],
});
