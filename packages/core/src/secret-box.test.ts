import { describe, expect, it } from "vitest";
import { keyFrom, open, seal } from "./secret-box";

describe("secret-box", () => {
  it("round-trips and rejects tampering", () => {
    const key = keyFrom(Buffer.alloc(32, 7).toString("base64"));
    const sealed = seal("app-password", key);
    expect(sealed.startsWith("v1.")).toBe(true);
    expect(open(sealed, key)).toBe("app-password");
    const bad = sealed.slice(0, -2) + (sealed.endsWith("A") ? "B" : "A") + sealed.slice(-1);
    expect(() => open(bad, key)).toThrow();
    expect(() => keyFrom("c2hvcnQ=")).toThrow(/32 bytes/);
  });
});
