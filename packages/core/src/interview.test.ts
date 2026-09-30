import { describe, expect, it } from "vitest";
import { MCQ_BANK, acknowledge, gradeAnswer, gradeSession, interviewQuestions } from "./interview";

describe("interviewQuestions", () => {
  it("builds six questions from the job's skills, opener first", () => {
    const qs = interviewQuestions({ skills: ["Go", "Kafka", "PostgreSQL"], type: "Mixed" });
    expect(qs).toHaveLength(6);
    expect(qs[0]!.q).toBe("Walk me through a project you're proud of.");
    expect(qs.some((q) => q.q.includes("Kafka"))).toBe(true);
    expect(qs.at(-1)!.kind).toBe("behavioural");
    expect(new Set(qs.map((q) => q.q)).size).toBe(6);
  });

  it("falls back to general questions for unknown skills", () => {
    const qs = interviewQuestions({ skills: ["COBOL"], type: "Technical" });
    expect(qs.some((q) => q.q.includes("idempotent"))).toBe(true);
  });
});

describe("grading", () => {
  const q = interviewQuestions({ skills: ["Kafka"], type: "Technical" })[1]!;

  it("rewards specific, structured answers over short hedged ones", () => {
    const strong = gradeAnswer(
      q,
      "First, the consumer only commits the offset after the write succeeds, so it is at-least-once. Then on restart it re-reads the batch from the last committed offset, so every write has to be idempotent, for example an upsert keyed on the ticket id. The result is no lost scans and harmless duplicates, which is the trade-off I chose because losing a scan was worse.",
    );
    const weak = gradeAnswer(q, "Um, maybe it retries? I think it basically works.");
    expect(strong.technical).toBeGreaterThan(weak.technical);
    expect(strong.structure).toBeGreaterThan(weak.structure);
    expect(strong.confidence).toBeGreaterThan(weak.confidence);
  });

  it("scores a whole session and reports pace and fillers", () => {
    const qs = interviewQuestions({ skills: ["Kafka"], type: "Mixed", count: 2 });
    const r = gradeSession({
      questions: qs,
      answers: ["I built a ticketing backend. Um, the result was 900 scans a minute.", "(Skipped)"],
      speakingSeconds: 60,
    });
    expect(r.score).toBeGreaterThan(0);
    expect(r.report.answers[1]).toMatchObject({ score: 0, note: "Not answered." });
    expect(r.report.metrics.fillers).toBe(1);
    expect(r.report.metrics.wpm).toBe(13);
  });

  it("acknowledges answers and skips", () => {
    expect(acknowledge("(Skipped)", 0)).toBe("No problem, let's move on.");
    expect(acknowledge("Short answer.", 0)).toMatch(/add a detail/);
  });

  it("has a valid multiple-choice bank", () => {
    for (const m of MCQ_BANK) expect(m.opts[m.a]).toBeTruthy();
  });
});
