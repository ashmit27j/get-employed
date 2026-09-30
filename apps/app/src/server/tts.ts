import "server-only";
import { createHash, createSign } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { eq, sql } from "drizzle-orm";
import { schema } from "@ge/db";
import { getDb } from "./db";
import { env } from "./env";
import { getObject, putObject } from "./storage";

/*
 * Interviewer voice (docs/interviews.md): Google Cloud Text-to-Speech with tier fallback.
 * WaveNet while this month's WaveNet total is under limit × ratio, then Standard, then the
 * browser's own voice. Characters are reserved in a transaction before the request, and
 * repeated lines come from interview_audio_cache at no cost.
 */

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

function credentials(): ServiceAccount | null {
  const raw = env().GOOGLE_TTS_CREDENTIALS?.trim();
  if (!raw) return null;
  try {
    const json = raw.startsWith("{") ? raw : existsSync(raw) ? readFileSync(raw, "utf8") : null;
    return json ? (JSON.parse(json) as ServiceAccount) : null;
  } catch {
    return null;
  }
}

let token: { value: string; expires: number } | null = null;

/** An OAuth access token from the service account (JWT bearer grant), cached until near expiry. */
async function accessToken(sa: ServiceAccount): Promise<string> {
  if (token && token.expires > Date.now() + 60_000) return token.value;
  const now = Math.floor(Date.now() / 1000);
  const enc = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${enc({ alg: "RS256", typ: "JWT" })}.${enc({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const signature = createSign("RSA-SHA256")
    .update(unsigned)
    .sign(sa.private_key)
    .toString("base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("TTS: could not get an access token");
  token = { value: json.access_token, expires: Date.now() + (json.expires_in ?? 3600) * 1000 };
  return token.value;
}

const month = () => new Date().toISOString().slice(0, 7);

/**
 * Reserve characters on the first tier with room. Null when both tiers are at their safety
 * limit; the browser voice takes over.
 */
async function reserve(
  chars: number,
): Promise<{ tier: "wavenet" | "standard"; voice: string } | null> {
  const e = env();
  const tiers = [
    {
      tier: "wavenet" as const,
      voice: e.TTS_WAVENET_VOICE,
      cap: e.TTS_WAVENET_MONTHLY_LIMIT * e.TTS_SAFETY_RATIO,
    },
    {
      tier: "standard" as const,
      voice: e.TTS_STANDARD_VOICE,
      cap: e.TTS_STANDARD_MONTHLY_LIMIT * e.TTS_SAFETY_RATIO,
    },
  ];
  const { ttsUsage } = schema;
  return getDb().transaction(async (tx) => {
    for (const t of tiers) {
      const where = sql`${ttsUsage.month} = ${month()} and ${ttsUsage.tier} = ${t.tier}`;
      await tx
        .insert(ttsUsage)
        .values({ month: month(), tier: t.tier, characters: 0 })
        .onConflictDoNothing();
      // Lock the row so parallel sessions can't both take the last characters.
      const [row] = await tx
        .select({ n: ttsUsage.characters })
        .from(ttsUsage)
        .where(where)
        .for("update");
      if ((row?.n ?? 0) + chars <= t.cap) {
        await tx
          .update(ttsUsage)
          .set({ characters: sql`${ttsUsage.characters} + ${chars}` })
          .where(where);
        return { tier: t.tier, voice: t.voice };
      }
    }
    return null;
  });
}

const cacheKey = (voice: string, text: string) =>
  createHash("sha256").update(`${voice}\n${text}`).digest("hex");

/** MP3 for one interviewer line, or null when the browser should speak it. */
export async function speech(text: string): Promise<Uint8Array | null> {
  const sa = credentials();
  if (!sa) return null;
  const e = env();
  const { interviewAudioCache } = schema;
  // Cached lines cost nothing; try the WaveNet voice's cache, then Standard's.
  for (const voice of [e.TTS_WAVENET_VOICE, e.TTS_STANDARD_VOICE]) {
    const [hit] = await getDb()
      .select()
      .from(interviewAudioCache)
      .where(eq(interviewAudioCache.hash, cacheKey(voice, text)));
    const file = hit ? await getObject(hit.storageKey) : null;
    if (file) return file.body;
  }
  const slot = await reserve(text.length);
  if (!slot) return null;
  const res = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await accessToken(sa)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: slot.voice.split("-").slice(0, 2).join("-"), name: slot.voice },
      audioConfig: { audioEncoding: "MP3", speakingRate: 1.02 },
    }),
  });
  const json = (await res.json()) as { audioContent?: string };
  if (!res.ok || !json.audioContent) return null;
  const audio = new Uint8Array(Buffer.from(json.audioContent, "base64"));
  // Short lines repeat (greetings, closings): worth caching.
  if (text.length <= 200) {
    const hash = cacheKey(slot.voice, text);
    const key = `tts/${hash}.mp3`;
    await putObject(key, audio, "audio/mpeg");
    await getDb()
      .insert(interviewAudioCache)
      .values({ hash, voice: slot.voice, storageKey: key, characters: text.length })
      .onConflictDoNothing();
  }
  return audio;
}
