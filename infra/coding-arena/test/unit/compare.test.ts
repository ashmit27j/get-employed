import { describe, expect, it } from "vitest";
import { outputsMatch } from "../../shared/compare";

describe("outputsMatch (tokens)", () => {
  it("ignores trailing whitespace, CRLF and blank lines", () => {
    expect(outputsMatch("1 2 3\n", "1 2 3")).toBe(true);
    expect(outputsMatch("1 2 3\n", "1 2 3   \r\n\r\n")).toBe(true);
    expect(outputsMatch("1\n2\n", "  1 2  ")).toBe(true);
  });
  it("is exact per token", () => {
    expect(outputsMatch("YES", "yes")).toBe(false);
    expect(outputsMatch("10", "010")).toBe(false);
    expect(outputsMatch("1.0", "1")).toBe(false);
  });
  it("fails on missing or extra tokens", () => {
    expect(outputsMatch("1 2 3", "1 2")).toBe(false);
    expect(outputsMatch("1 2", "1 2 3")).toBe(false);
  });
  it("treats empty and whitespace-only output as equal", () => {
    expect(outputsMatch("", "  \n ")).toBe(true);
    expect(outputsMatch("", "0")).toBe(false);
  });
});

describe("outputsMatch (float-1e-6)", () => {
  it("accepts small absolute and relative differences", () => {
    expect(outputsMatch("0.333333", "0.3333334", "float-1e-6")).toBe(true);
    expect(outputsMatch("1000000000", "1000000000.5", "float-1e-6")).toBe(true);
  });
  it("rejects larger differences and non-numbers", () => {
    expect(outputsMatch("0.5", "0.51", "float-1e-6")).toBe(false);
    expect(outputsMatch("abc", "abd", "float-1e-6")).toBe(false);
    expect(outputsMatch("1", "1e", "float-1e-6")).toBe(false);
  });
});
