"use client";
// The browser's side of Coding Arena (D30): a 5-minute token from /api/arena/token, then direct
// calls to the judge's HTTP API (Bearer) and its WebSocket (?ticket=) for live verdicts.
import { useEffect, useRef } from "react";
import type { ArenaPush } from "@ge/core";

interface ArenaSession {
  token: string;
  apiUrl: string;
  wsUrl: string;
  expiresAt: number;
}

let session: ArenaSession | null = null;
let pending: Promise<ArenaSession> | null = null;
const EARLY_REFRESH_MS = 30_000;

export class ArenaRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly retryAfterMs?: number,
    /** Field errors from a 400, e.g. [{ path: "meta.slug", message: "…" }]. */
    readonly issues: { path: string; message: string }[] = [],
  ) {
    super(message);
  }
}

async function freshSession(): Promise<ArenaSession> {
  const res = await fetch("/api/arena/token", { method: "POST", cache: "no-store" });
  const body = (await res.json().catch(() => ({}))) as Partial<{
    token: string;
    apiUrl: string;
    wsUrl: string;
    expiresIn: number;
    error: string;
  }>;
  if (!res.ok || !body.token || !body.apiUrl || !body.wsUrl) {
    throw new ArenaRequestError(
      res.status,
      body.error ?? "Coding Arena isn't available right now.",
    );
  }
  return {
    token: body.token,
    apiUrl: body.apiUrl.replace(/\/+$/, ""),
    wsUrl: body.wsUrl,
    expiresAt: Date.now() + (body.expiresIn ?? 300) * 1000,
  };
}

export async function arenaSession(force = false): Promise<ArenaSession> {
  if (!force && session && session.expiresAt - EARLY_REFRESH_MS > Date.now()) return session;
  pending ??= freshSession().finally(() => (pending = null));
  session = await pending;
  return session;
}

/** Calls the Arena HTTP API as the signed-in user. Retries once with a new token on 401. */
export async function arenaRequest<T>(
  path: string,
  init: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const s = await arenaSession(attempt > 0);
    const res = await fetch(`${s.apiUrl}${path}`, {
      method: init.method ?? "GET",
      signal: init.signal,
      headers: {
        authorization: `Bearer ${s.token}`,
        ...(init.body !== undefined ? { "content-type": "application/json" } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
    if (res.status === 401 && attempt === 0) continue;
    const body = (await res.json().catch(() => ({}))) as T & {
      error?: string;
      retryAfterMs?: number;
      issues?: { path: string; message: string }[];
    };
    if (!res.ok) {
      throw new ArenaRequestError(
        res.status,
        body.error ?? "Coding Arena didn't respond. Try again.",
        body.retryAfterMs,
        body.issues,
      );
    }
    return body;
  }
}

export function errorMessage(err: unknown): string {
  if (err instanceof ArenaRequestError) return err.message;
  if (err instanceof Error && err.name === "AbortError") return "";
  return "Couldn't reach Coding Arena. Check your connection and try again.";
}

const PING_MS = 4 * 60_000; // API Gateway closes sockets after 10 idle minutes
const MAX_BACKOFF_MS = 30_000;

/**
 * Keeps one socket open while the component is mounted and hands every message to `onMessage`.
 * Reconnects with backoff and a fresh ticket. Verdicts also arrive by polling, so a dropped
 * socket only makes progress updates slower.
 */
export function useArenaSocket(onMessage: (m: ArenaPush) => void, enabled = true) {
  const handler = useRef(onMessage);
  useEffect(() => {
    handler.current = onMessage;
  });
  useEffect(() => {
    if (!enabled) return;
    let ws: WebSocket | null = null;
    let closed = false;
    let retry = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let ping: ReturnType<typeof setInterval> | undefined;

    const connect = async () => {
      try {
        const s = await arenaSession();
        if (closed) return;
        const url = new URL(s.wsUrl);
        url.searchParams.set("ticket", s.token);
        ws = new WebSocket(url);
        ws.onopen = () => {
          retry = 0;
          ping = setInterval(() => ws?.readyState === WebSocket.OPEN && ws.send("ping"), PING_MS);
        };
        ws.onmessage = (e) => {
          try {
            handler.current(JSON.parse(String(e.data)) as ArenaPush);
          } catch {
            // Not JSON: ignore.
          }
        };
        ws.onclose = () => {
          clearInterval(ping);
          if (!closed) schedule();
        };
      } catch {
        schedule();
      }
    };
    const schedule = () => {
      retry++;
      timer = setTimeout(connect, Math.min(MAX_BACKOFF_MS, 1000 * 2 ** retry));
    };
    void connect();
    return () => {
      closed = true;
      clearTimeout(timer);
      clearInterval(ping);
      ws?.close();
    };
  }, [enabled]);
}
