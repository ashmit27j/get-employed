import { describe, expect, it } from "vitest";
import { parseSearchQuery } from "./query-parser";

const labels = (q: string) => parseSearchQuery(q).map((c) => `${c.type}:${c.label}`);

describe("parseSearchQuery", () => {
  it("parses the hero examples", () => {
    expect(labels("React internships in Bengaluru, remote-friendly")).toEqual([
      "type:Internship",
      "skill:React",
      "location:Bengaluru",
      "location:Remote OK",
    ]);
    expect(labels("Backend roles in Pune, 12 LPA+, 2 years of Go")).toEqual([
      "role:Backend",
      "skill:Go",
      "location:Pune",
      "salary:≥ ₹12 LPA",
      "experience:2+ yrs",
    ]);
    expect(labels("Data analyst, fresher, Hyderabad or remote")).toEqual([
      "role:Data analyst",
      "location:Hyderabad",
      "location:Remote OK",
      "experience:0–1 yrs",
    ]);
  });

  it("keeps machine-readable values next to labels", () => {
    const salary = parseSearchQuery("12.5 LPA").find((c) => c.type === "salary");
    expect(salary).toMatchObject({ value: "12.5", icon: "wallet" });
  });

  it("returns nothing for unrelated text", () => {
    expect(parseSearchQuery("hello there")).toEqual([]);
  });
});
