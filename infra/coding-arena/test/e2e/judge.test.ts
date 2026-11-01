/* eslint-disable @typescript-eslint/no-explicit-any -- API responses are loosely typed in this test */
// End to end against the deployed stack: correct, wrong and too-slow submissions to the seed
// problem "drone-pairs" must come back Accepted, Wrong Answer and Time Limit Exceeded, via
// polling and via the WebSocket. Needs outputs.json (pnpm deploy), the problem seeded
// (pnpm seed drone-pairs) and ARENA_TOKEN_SECRET in the environment.
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { mintArenaToken } from "@ge/core/arena-token";
import { describe, expect, it } from "vitest";
import WebSocket from "ws";
import { stackOutputs } from "../../scripts/outputs";

const secret = process.env.ARENA_TOKEN_SECRET;
const ready = (() => {
  try {
    return Boolean(secret && stackOutputs());
  } catch {
    return false;
  }
})();
const suite = ready ? describe : describe.skip;

const SLUG = "drone-pairs";
const reference = readFileSync(
  new URL(`../../content/dsa/${SLUG}/solution.cpp`, import.meta.url),
  "utf8",
);
const WRONG = `#include <bits/stdc++.h>
int main(){long long n,k;std::cin>>n>>k;std::map<int,int> seen;int ans=0;
for(int i=0;i<n;i++){int x;std::cin>>x;ans+=seen[k-x];seen[x]++;}std::cout<<ans<<"\\n";}`; // 32-bit overflow
const SLOW = `import sys
d=sys.stdin.buffer.read().split();n,k=int(d[0]),int(d[1]);a=list(map(int,d[2:2+n]))
print(sum(1 for i in range(n) for j in range(i+1,n) if a[i]+a[j]==k))`;

async function api(token: string, method: string, path: string, body?: unknown) {
  const res = await fetch(`${stackOutputs().HttpApiUrl}${path}`, {
    method,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: (await res.json().catch(() => ({}))) as Record<string, any> };
}

const tokenFor = (userId: string) => mintArenaToken({ userId, isAdmin: false }, secret!);

async function waitForVerdict(token: string, id: string, timeoutMs = 240_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { body } = await api(token, "GET", `/submissions/${id}`);
    if (body.submission?.status === "DONE" || body.submission?.status === "FAILED")
      return body.submission;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`no verdict for ${id} after ${timeoutMs} ms`);
}

suite("judge end to end", () => {
  const run = randomUUID().slice(0, 8);

  it("rejects requests without a valid token", async () => {
    const res = await fetch(`${stackOutputs().HttpApiUrl}/problems?arena=dsa`, {
      headers: { authorization: "Bearer not-a-token" },
    });
    expect([401, 403]).toContain(res.status);
  });

  it("lists the seed problem", async () => {
    const { status, body } = await api(
      await tokenFor(`e2e-${run}-list`),
      "GET",
      "/problems?arena=dsa",
    );
    expect(status).toBe(200);
    expect(body.problems.map((p: { slug: string }) => p.slug)).toContain(SLUG);
  });

  it("Accepted for the reference, pushed over the WebSocket", async () => {
    const user = `e2e-${run}-ac`;
    const ws = new WebSocket(`${stackOutputs().WebSocketUrl}?ticket=${await tokenFor(user)}`);
    const messages: any[] = [];
    ws.on("message", (m) => messages.push(JSON.parse(m.toString())));
    await new Promise<void>((resolve, reject) => {
      ws.once("open", () => resolve());
      ws.once("error", reject);
    });

    const token = await tokenFor(user);
    const { status, body } = await api(token, "POST", "/submissions", {
      slug: SLUG,
      language: "cpp",
      code: reference,
    });
    expect(status).toBe(202);
    const sub = await waitForVerdict(token, body.submissionId);
    expect(sub.verdict).toBe("Accepted");
    expect(sub.passed).toBe(sub.totalTests);
    expect(JSON.stringify(sub)).not.toMatch(/"input"|"expected"/); // no hidden test data

    await new Promise((r) => setTimeout(r, 1500));
    ws.close();
    expect(messages.some((m) => m.type === "progress")).toBe(true);
    expect(messages.find((m) => m.type === "verdict")?.submission.verdict).toBe("Accepted");

    const progress = await api(token, "GET", "/me/progress");
    expect(progress.body.solved.map((s: { slug: string }) => s.slug)).toContain(SLUG);
  });

  it("Wrong Answer for an overflowing solution", async () => {
    const token = await tokenFor(`e2e-${run}-wa`);
    const { body } = await api(token, "POST", "/submissions", {
      slug: SLUG,
      language: "cpp",
      code: WRONG,
    });
    const sub = await waitForVerdict(token, body.submissionId);
    expect(sub.verdict).toBe("Wrong Answer");
    expect(sub.failedTest).toBeGreaterThan(0);
  });

  it("Time Limit Exceeded for the O(n²) Python solution", async () => {
    const token = await tokenFor(`e2e-${run}-tle`);
    const { body } = await api(token, "POST", "/submissions", {
      slug: SLUG,
      language: "python",
      code: SLOW,
    });
    const sub = await waitForVerdict(token, body.submissionId);
    expect(sub.verdict).toBe("Time Limit Exceeded");
  });

  it("Compile Error with the compiler message", async () => {
    const token = await tokenFor(`e2e-${run}-ce`);
    const { body } = await api(token, "POST", "/submissions", {
      slug: SLUG,
      language: "cpp",
      code: "int main( {",
    });
    const sub = await waitForVerdict(token, body.submissionId);
    expect(sub.verdict).toBe("Compile Error");
    expect(sub.compileOutput).toMatch(/error/);
  });

  it("rate-limits a second submission inside 10 s", async () => {
    const token = await tokenFor(`e2e-${run}-rate`);
    const code = "int main(){}";
    const first = await api(token, "POST", "/submissions", { slug: SLUG, language: "cpp", code });
    const second = await api(token, "POST", "/submissions", { slug: SLUG, language: "cpp", code });
    expect(first.status).toBe(202);
    expect(second.status).toBe(429);
    expect(second.body.retryAfterMs).toBeGreaterThan(0);
  });

  it("doesn't show another user's submission", async () => {
    const owner = await tokenFor(`e2e-${run}-owner`);
    const { body } = await api(owner, "POST", "/submissions", {
      slug: SLUG,
      language: "cpp",
      code: "int main(){}",
    });
    const other = await api(
      await tokenFor(`e2e-${run}-other`),
      "GET",
      `/submissions/${body.submissionId}`,
    );
    expect(other.status).toBe(404);
  });
});
