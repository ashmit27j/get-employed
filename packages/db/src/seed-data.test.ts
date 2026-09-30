import { describe, expect, it } from "vitest";
import {
  dedupeHash,
  loadPrototypeData,
  parseAgo,
  parseDay,
  parseExperience,
  parseMode,
  parseProfile,
  SEED_NOW,
  toChips,
} from "./seed-data";

describe("loadPrototypeData", () => {
  const data = loadPrototypeData();

  it("reads every collection the seed uses", () => {
    expect(data.JOBS.length).toBeGreaterThan(0);
    expect(data.APPS.length).toBeGreaterThan(0);
    expect(data.EMAILS.length).toBeGreaterThan(0);
    expect(data.SESSIONS.length).toBeGreaterThan(0);
    expect(data.DIFFS.length).toBeGreaterThan(0);
  });

  it("produces a profile that passes ProfileSchema", () => {
    expect(parseProfile(data).contact.email).toBe(data.USER.email);
  });

  it("maps every search chip to a known chip type", () => {
    for (const q of data.SEARCHES) {
      for (const chip of toChips(q.chips)) expect(chip.type).toBeTruthy();
    }
  });

  it("gives every job a unique dedupe hash", () => {
    const hashes = data.JOBS.map((j) => dedupeHash(j.co, j.title, j.loc));
    expect(new Set(hashes).size).toBe(hashes.length);
  });
});

describe("parsers", () => {
  it("parses relative times", () => {
    expect(SEED_NOW.getTime() - parseAgo("2h").getTime()).toBe(2 * 3_600_000);
    expect(SEED_NOW.getTime() - parseAgo("1d").getTime()).toBe(86_400_000);
  });

  it("parses day labels", () => {
    expect(parseDay("Sep 21").toISOString().slice(0, 10)).toBe("2026-09-21");
  });

  it("parses work mode and experience", () => {
    expect(parseMode("On-site")).toBe("on-site");
    expect(parseMode("Remote")).toBe("remote");
    expect(parseExperience("0–2 yrs")).toEqual([0, 2]);
    expect(parseExperience("Fresher")).toEqual([0, 0]);
    expect(parseExperience("Internship")).toEqual([null, null]);
  });
});
