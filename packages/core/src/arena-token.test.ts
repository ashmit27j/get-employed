import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import {
  ARENA_TOKEN_AUDIENCE,
  ARENA_TOKEN_ISSUER,
  mintArenaToken,
  parseAdminIds,
  verifyArenaToken,
} from "./arena-token";

const SECRET = "test-secret-test-secret-test-secret-123";
const OTHER = "other-secret-other-secret-other-secret-1";

describe("arena token", () => {
  it("round-trips the user id and admin flag", async () => {
    const token = await mintArenaToken({ userId: "u_1", isAdmin: true }, SECRET);
    expect(await verifyArenaToken(token, SECRET)).toEqual({ userId: "u_1", isAdmin: true });
  });

  it("treats a missing adm claim as not admin", async () => {
    const token = await mintArenaToken({ userId: "u_2", isAdmin: false }, SECRET);
    expect(await verifyArenaToken(token, SECRET)).toEqual({ userId: "u_2", isAdmin: false });
  });

  it("rejects a token signed with another secret", async () => {
    const token = await mintArenaToken({ userId: "u_1", isAdmin: true }, OTHER);
    expect(await verifyArenaToken(token, SECRET)).toBeNull();
  });

  it("rejects an expired token", async () => {
    const issued = Math.floor(Date.now() / 1000) - 3600;
    const token = await mintArenaToken({ userId: "u_1", isAdmin: false }, SECRET, issued);
    expect(await verifyArenaToken(token, SECRET)).toBeNull();
  });

  it("rejects a tampered payload", async () => {
    const token = await mintArenaToken({ userId: "u_1", isAdmin: false }, SECRET);
    const [h, , s] = token.split(".");
    const forged = Buffer.from(
      JSON.stringify({ sub: "u_1", adm: true, iss: ARENA_TOKEN_ISSUER, aud: ARENA_TOKEN_AUDIENCE }),
    ).toString("base64url");
    expect(await verifyArenaToken(`${h}.${forged}.${s}`, SECRET)).toBeNull();
  });

  it("rejects alg none and a wrong audience", async () => {
    const none = `${Buffer.from('{"alg":"none"}').toString("base64url")}.${Buffer.from(
      JSON.stringify({ sub: "u_1", adm: true }),
    ).toString("base64url")}.`;
    expect(await verifyArenaToken(none, SECRET)).toBeNull();

    const now = Math.floor(Date.now() / 1000);
    const wrongAud = await new SignJWT({ adm: true })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("u_1")
      .setIssuer(ARENA_TOKEN_ISSUER)
      .setAudience("something-else")
      .setIssuedAt(now)
      .setExpirationTime(now + 60)
      .sign(new TextEncoder().encode(SECRET));
    expect(await verifyArenaToken(wrongAud, SECRET)).toBeNull();
  });

  it("rejects garbage and empty input", async () => {
    expect(await verifyArenaToken("", SECRET)).toBeNull();
    expect(await verifyArenaToken("not.a.jwt", SECRET)).toBeNull();
  });

  it("refuses a short secret", async () => {
    await expect(mintArenaToken({ userId: "u", isAdmin: false }, "short")).rejects.toThrow();
  });

  it("parses the admin allowlist", () => {
    expect([...parseAdminIds(" a, b ,,c ")]).toEqual(["a", "b", "c"]);
    expect(parseAdminIds(undefined).size).toBe(0);
  });
});
