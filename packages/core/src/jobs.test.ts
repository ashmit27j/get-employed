import { describe, expect, it } from "vitest";
import {
  EMPTY_FILTERS,
  chipsToFilters,
  countFilters,
  filtersToChips,
  matchesFilters,
  parseFilters,
  timeAgo,
  type JobCard,
} from "./jobs";

const job = (over: Partial<JobCard> = {}): JobCard => ({
  id: "j",
  title: "Backend Engineer I",
  company: "Razorpay",
  location: "Bengaluru",
  mode: "hybrid",
  experience: "0–2 yrs",
  skills: ["Go", "Kafka", "PostgreSQL"],
  missing: [],
  score: 92,
  reason: null,
  salary: { type: "stated", min: 18, max: 26 },
  postedAt: "2026-09-26T08:00:00Z",
  sourceLabel: "Careers page",
  url: null,
  contact: { status: "none", name: null, role: null },
  saved: false,
  hidden: false,
  ...over,
});

describe("matchesFilters", () => {
  it("matches everything with empty filters", () => {
    expect(matchesFilters(job(), EMPTY_FILTERS)).toBe(true);
  });

  it("filters by role, location, remote and skills", () => {
    const f = {
      ...EMPTY_FILTERS,
      roles: ["Backend"],
      locations: ["Pune", "Bengaluru"],
      skills: ["go"],
    };
    expect(matchesFilters(job(), f)).toBe(true);
    expect(matchesFilters(job({ title: "iOS Engineer" }), f)).toBe(false);
    expect(
      matchesFilters(job({ location: "Pune", mode: "remote" }), {
        ...EMPTY_FILTERS,
        locations: ["Remote"],
      }),
    ).toBe(true);
    expect(matchesFilters(job(), { ...EMPTY_FILTERS, locations: ["Remote"] })).toBe(false);
  });

  it("overlaps experience ranges and handles internships", () => {
    expect(matchesFilters(job(), { ...EMPTY_FILTERS, experience: ["1–3 yrs"] })).toBe(true);
    expect(
      matchesFilters(job({ experience: "3–5 yrs" }), { ...EMPTY_FILTERS, experience: ["0–1 yrs"] }),
    ).toBe(false);
    const intern = job({ title: "Security Engineer Intern", experience: "Internship" });
    expect(matchesFilters(intern, { ...EMPTY_FILTERS, type: "internship" })).toBe(true);
    expect(matchesFilters(job(), { ...EMPTY_FILTERS, type: "internship" })).toBe(false);
  });

  it("filters by salary band", () => {
    expect(matchesFilters(job(), { ...EMPTY_FILTERS, salaryMin: 20 })).toBe(true);
    expect(matchesFilters(job(), { ...EMPTY_FILTERS, salaryMin: 27 })).toBe(false);
    expect(matchesFilters(job({ salary: null }), { ...EMPTY_FILTERS, salaryMin: 10 })).toBe(false);
  });
});

describe("parseFilters", () => {
  it("parses the prototype's default Deep Search query", () => {
    const f = parseFilters(
      "Backend internships in Pune or Bengaluru, Go or Java, remote okay, at least 6 LPA",
    );
    expect(f).toMatchObject({
      type: "internship",
      roles: ["Backend"],
      locations: ["Bengaluru", "Pune"],
      modes: ["Remote"],
      experience: ["Internship"],
      salaryMin: 6,
      skills: ["Go", "Java"],
    });
    expect(countFilters(f)).toBe(9);
  });
});

describe("chips", () => {
  it("round-trips filters through saved-search chips", () => {
    const f = parseFilters("Backend roles in Bengaluru, hybrid, 12 LPA, Go or Node.js");
    expect(chipsToFilters(filtersToChips(f))).toEqual(f);
  });

  it("reads the seed's chip shapes", () => {
    const f = chipsToFilters([
      { type: "location", icon: "map-pin", label: "Bengaluru", value: "Bengaluru" },
      { type: "salary", icon: "wallet", label: "≥ ₹12 LPA", value: "≥ ₹12 LPA" },
      { type: "type", icon: "globe", label: "Remote", value: "Remote" },
      { type: "experience", icon: "graduation-cap", label: "Internship", value: "Internship" },
    ]);
    expect(f).toMatchObject({
      locations: ["Bengaluru", "Remote"],
      salaryMin: 12,
      experience: ["Internship"],
    });
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-09-26T10:00:00Z");
  it("formats short relative times", () => {
    expect(timeAgo("2026-09-26T08:00:00Z", now)).toBe("2h");
    expect(timeAgo("2026-09-24T10:00:00Z", now)).toBe("2d");
    expect(timeAgo("2026-09-26T09:30:00Z", now)).toBe("30m");
  });
});
