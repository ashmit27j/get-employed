import { describe, expect, it } from "vitest";
import { domainGuesses, emailsInPost, nextWindow } from "./outreach";

describe("contact.find helpers", () => {
  it("takes application addresses from the post, not boilerplate ones", () => {
    expect(
      emailsInPost(
        "Send your resume to Hiring@Acme.in. Questions: privacy@acme.in, noreply@acme.in",
      ),
    ).toEqual(["hiring@acme.in"]);
  });
  it("guesses domains from the company name", () => {
    expect(domainGuesses("Razorpay Software Pvt Ltd")[0]).toBe("razorpay.com");
    expect(domainGuesses("")).toEqual([]);
  });
});

describe("sending window", () => {
  // 2026-09-30 04:30 UTC is 10:00 in Kolkata.
  const at = (utc: string) => new Date(`2026-09-30T${utc}:00Z`);
  it("sends inside the window", () => {
    expect(nextWindow(at("04:30"), "Asia/Kolkata", "09:00", "18:00")).toBeNull();
  });
  it("waits for the next opening outside it", () => {
    // 20:00 IST → 09:00 IST next day is 13 hours away.
    const next = nextWindow(at("14:30"), "Asia/Kolkata", "09:00", "18:00")!;
    expect((next.getTime() - at("14:30").getTime()) / 3_600_000).toBe(13);
  });
  it("handles windows that cross midnight", () => {
    expect(nextWindow(at("17:30"), "Asia/Kolkata", "22:00", "06:00")).toBeNull();
  });
});
