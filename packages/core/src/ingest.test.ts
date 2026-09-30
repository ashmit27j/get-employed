import { describe, expect, it } from "vitest";
import {
  dedupeHash,
  dictionarySkills,
  htmlToText,
  isIndia,
  isTechRole,
  normaliseExperience,
  normaliseLocation,
  normaliseMode,
  statedSalary,
  titleFamily,
} from "./ingest";

describe("ingest normalisation", () => {
  it("normalises Indian locations", () => {
    expect(normaliseLocation("Bengaluru-VTP, India")).toBe("Bengaluru");
    expect(normaliseLocation("Gurugram, Haryana")).toBe("Delhi NCR");
    expect(normaliseLocation("bangalore")).toBe("Bengaluru");
    expect(normaliseLocation("Remote - India")).toBe("Remote");
  });

  it("keeps India and India-remote postings only", () => {
    expect(isIndia({ location: "Pune, India" })).toBe(true);
    expect(isIndia({ location: "hyderabad" })).toBe(true);
    expect(isIndia({ location: "Remote", description: "Open to candidates in India" })).toBe(true);
    expect(isIndia({ location: "San Francisco, CA" })).toBe(false);
  });

  it("reads work mode", () => {
    expect(normaliseMode({ location: "Pune", description: "", workplace: "hybrid" })).toBe(
      "hybrid",
    );
    expect(normaliseMode({ location: "Remote", description: "" })).toBe("remote");
    expect(normaliseMode({ location: "Mumbai", description: "3 days a week, hybrid" })).toBe(
      "hybrid",
    );
    expect(normaliseMode({ location: "Mumbai", description: "" })).toBe("on-site");
  });

  it("filters non-engineering titles", () => {
    expect(isTechRole("Backend Engineer I")).toBe(true);
    expect(isTechRole("SDE-1, Platform")).toBe(true);
    expect(isTechRole("accounts payable manager")).toBe(false);
    expect(isTechRole("Senior Recruiter")).toBe(false);
    expect(isTechRole("Risk Analyst | Exp - 1 To 3 Yrs")).toBe(false);
    expect(isTechRole("Graphic Designer")).toBe(false);
    expect(isTechRole("Video Editor Intern")).toBe(false);
    expect(isTechRole("Software Engineer (CPD) - Winter Intern")).toBe(true);
    expect(isTechRole("Data Analyst")).toBe(true);
  });

  it("reads experience from title and text", () => {
    expect(normaliseExperience("Software Engineer Intern", "").label).toBe("Internship");
    expect(normaliseExperience("Backend Engineer", "You have 2-4 years of experience").label).toBe(
      "2–4 yrs",
    );
    expect(normaliseExperience("Engineer", "3+ years building APIs").label).toBe("3+ yrs");
    expect(normaliseExperience("Senior Engineer", "").label).toBe("5+ yrs");
    expect(normaliseExperience("SDE-1", "").label).toBe("0–2 yrs");
    expect(normaliseExperience("Engineering Manager", "1-2 years of Go").label).toBe("5+ yrs");
  });

  it("reads stated salaries", () => {
    expect(statedSalary("CTC ₹12–18 LPA plus ESOPs")).toEqual({ min: 12, max: 18 });
    expect(statedSalary("Stipend ₹40,000/month")).toEqual({ min: 4.8, max: 4.8 });
    expect(statedSalary("Competitive pay")).toBeNull();
  });

  it("cleans escaped HTML", () => {
    expect(
      htmlToText(
        "&lt;p&gt;Build &amp;amp; ship&lt;/p&gt;&lt;ul&gt;&lt;li&gt;Go&lt;/li&gt;&lt;/ul&gt;",
      ),
    ).toBe("Build & ship\n• Go");
  });

  it("dedupes the same role across sources", () => {
    expect(dedupeHash("Razorpay Software Pvt Ltd", "Backend Engineer I", "Bengaluru")).toBe(
      dedupeHash("Razorpay", "backend engineer i", "bengaluru"),
    );
    expect(dedupeHash("Razorpay", "Backend Engineer I", "Pune")).not.toBe(
      dedupeHash("Razorpay", "Backend Engineer I", "Bengaluru"),
    );
  });

  it("finds skills without false positives", () => {
    expect(dictionarySkills("We use Golang, Kafka and PostgreSQL on AWS with Docker")).toEqual([
      "Go",
      "Kafka",
      "PostgreSQL",
      "AWS",
      "Docker",
    ]);
    expect(dictionarySkills("JavaScript and React")).toEqual(["JavaScript", "React"]);
    expect(dictionarySkills("a good team")).toEqual([]);
  });

  it("groups titles into families", () => {
    expect(titleFamily("Senior Backend Engineer")).toBe("backend");
    expect(titleFamily("Data Analyst Intern")).toBe("intern");
  });
});
