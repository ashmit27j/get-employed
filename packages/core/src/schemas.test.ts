import { describe, expect, it } from "vitest";
import { ProfileSchema, SearchFiltersSchema } from "./schemas";
import { parseServerEnv } from "./env";

describe("ProfileSchema", () => {
  it("fills defaults for a minimal profile", () => {
    const p = ProfileSchema.parse({ contact: { name: "A", email: "a@example.com" } });
    expect(p.education).toEqual([]);
    expect(p.skills).toEqual([]);
  });
});

describe("SearchFiltersSchema", () => {
  it("rejects unknown chip types", () => {
    expect(() =>
      SearchFiltersSchema.parse([{ type: "colour", icon: "x", label: "x", value: "x" }]),
    ).toThrow();
  });
});

describe("parseServerEnv", () => {
  it("parses booleans and applies defaults", () => {
    const env = parseServerEnv({
      DATABASE_URL: "postgres://u:p@localhost:5432/db",
      SELF_HOSTED: "true",
    });
    expect(env.SELF_HOSTED).toBe(true);
    expect(env.LINKEDIN_SCRAPING_ENABLED).toBe(false);
  });

  it("reports missing DATABASE_URL", () => {
    expect(() => parseServerEnv({})).toThrow(/DATABASE_URL/);
  });
});

describe("parseServerEnv blanks", () => {
  it("treats empty values as unset", () => {
    const env = parseServerEnv({
      DATABASE_URL: "postgres://u:p@localhost:5432/db",
      SCRAPER_SHARED_SECRET: "",
    });
    expect(env.SCRAPER_SHARED_SECRET).toBeUndefined();
  });
});
