// Server-only (node:crypto): import from "@ge/core/secret-box", never from the package root,
// which client components also load.
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * AES-256-GCM for mailbox credentials at rest (mailbox_connections.credentials).
 * The key is MAILBOX_ENCRYPTION_KEY (32 bytes, base64). Output: "v1.<iv>.<tag>.<ciphertext>", base64url.
 */
export function keyFrom(base64Key: string | undefined, devFallback?: string): Buffer {
  if (base64Key) {
    const key = Buffer.from(base64Key, "base64");
    if (key.length !== 32)
      throw new Error("MAILBOX_ENCRYPTION_KEY must be 32 bytes, base64-encoded.");
    return key;
  }
  if (devFallback) return createHash("sha256").update(`mailbox:${devFallback}`).digest();
  throw new Error("MAILBOX_ENCRYPTION_KEY is not set.");
}

export function seal(plain: string, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return ["v1", iv, cipher.getAuthTag(), body]
    .map((p) => (typeof p === "string" ? p : p.toString("base64url")))
    .join(".");
}

export function open(sealed: string, key: Buffer): string {
  const [v, iv, tag, body] = sealed.split(".");
  if (v !== "v1" || !iv || !tag || !body) throw new Error("Unrecognised credential format.");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(body, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
