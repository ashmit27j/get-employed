import { describe, expect, it } from "vitest";
import { PASSWORD_RULES, passwordOk } from "./password";

describe("passwordOk", () => {
  it("needs every rule", () => {
    expect(passwordOk("Abcdef1!")).toBe(true);
    expect(passwordOk("abcdef1!")).toBe(false);
    expect(passwordOk("ABCDEF1!")).toBe(false);
    expect(passwordOk("Abcdefg!")).toBe(false);
    expect(passwordOk("Abcdefg1")).toBe(false);
    expect(passwordOk("Ab1!")).toBe(false);
  });
  it("reports each rule separately", () => {
    expect(PASSWORD_RULES.filter((r) => r.test("abc")).map((r) => r.id)).toEqual(["lower"]);
  });
});
