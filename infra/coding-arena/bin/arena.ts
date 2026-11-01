#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import { CodingArenaStack } from "../lib/arena-stack";

const app = new App();
const ctx = (key: string): string | undefined => {
  const v: unknown = app.node.tryGetContext(key);
  return v === undefined || v === null || v === "" ? undefined : String(v);
};

new CodingArenaStack(app, "CodingArena", {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: ctx("region") ?? "ap-south-1" },
  description: "GetEmployed Coding Arena: online judge (sandbox, pipeline, APIs)",
  allowedOrigins: (ctx("allowedOrigins") ?? "http://localhost:4000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  alertEmail: ctx("alertEmail"),
  sandboxReservedConcurrency: Number(ctx("sandboxReservedConcurrency") ?? "5"),
  tokenSecretParam: ctx("tokenSecretParam") ?? "/coding-arena/token-secret",
});
