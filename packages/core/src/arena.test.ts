import { describe, expect, it } from "vitest";
import { isArenaId, isFinished, roleTagForTitle, tagLabel, verdictTone } from "./arena";

describe("roleTagForTitle", () => {
  it.each([
    ["SDE Intern", "sde"],
    ["Software Engineer I", "sde"],
    ["Backend Developer (Node.js)", "backend"],
    ["Frontend Engineer, React", "frontend"],
    ["Data Scientist", "data"],
    ["Business Analyst", "analyst"],
    ["ML Engineer", "ml"],
    ["Site Reliability Engineer", "devops"],
    ["Full Stack Developer", "sde"],
  ])("%s → %s", (title, tag) => {
    expect(roleTagForTitle(title)).toBe(tag);
  });

  it("returns undefined for titles with no technical role", () => {
    expect(roleTagForTitle("Marketing Associate")).toBeUndefined();
  });
});

describe("tagLabel", () => {
  it("sentence-cases tags and keeps acronyms", () => {
    expect(tagLabel("binary-search")).toBe("Binary search");
    expect(tagLabel("sde")).toBe("SDE");
    expect(tagLabel("bfs")).toBe("BFS");
    expect(tagLabel("time-and-work")).toBe("Time and work");
  });
});

describe("verdicts", () => {
  it("maps verdicts to tones", () => {
    expect(verdictTone("Accepted")).toBe("success");
    expect(verdictTone("Wrong Answer")).toBe("danger");
    expect(verdictTone("Compile Error")).toBe("warning");
    expect(verdictTone(undefined)).toBe("neutral");
  });

  it("knows when a submission is finished", () => {
    expect(isFinished({ status: "QUEUED" })).toBe(false);
    expect(isFinished({ status: "RUNNING" })).toBe(false);
    expect(isFinished({ status: "DONE" })).toBe(true);
    expect(isFinished({ status: "FAILED" })).toBe(true);
  });

  it("validates arena ids", () => {
    expect(isArenaId("dsa")).toBe(true);
    expect(isArenaId("chess")).toBe(false);
  });
});
