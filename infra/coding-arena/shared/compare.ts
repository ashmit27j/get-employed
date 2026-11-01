// Output comparison runs in the executor Lambda, outside the sandbox, so user code never
// sees expected outputs.
import type { Checker } from "./types";

function tokens(s: string): string[] {
  const t = s.trim();
  return t === "" ? [] : t.split(/\s+/);
}

/**
 * "tokens": whitespace-insensitive, token-by-token exact match (trailing spaces, CRLF and
 * blank lines don't matter; "1 2" and "1\n2" are equal).
 * "float-1e-6": numeric tokens may differ by 1e-6 absolute or relative; others must match.
 */
export function outputsMatch(
  expected: string,
  actual: string,
  checker: Checker = "tokens",
): boolean {
  const e = tokens(expected);
  const a = tokens(actual);
  if (e.length !== a.length) return false;
  for (let i = 0; i < e.length; i++) {
    const x = e[i]!;
    const y = a[i]!;
    if (x === y) continue;
    if (checker === "float-1e-6" && floatsClose(x, y)) continue;
    return false;
  }
  return true;
}

const NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;

function floatsClose(x: string, y: string): boolean {
  if (!NUMBER.test(x) || !NUMBER.test(y)) return false;
  const a = Number(x);
  const b = Number(y);
  const diff = Math.abs(a - b);
  return diff <= 1e-6 || diff <= 1e-6 * Math.max(Math.abs(a), Math.abs(b));
}
