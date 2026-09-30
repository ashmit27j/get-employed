import { describe, expect, it } from "vitest";
import { latexToText, parseResumeText } from "./resume-text";

const TEXT = `Riya Kapoor
riya@example.com | +91 98765 43210 | Pune, India | github.com/riyak | linkedin.com/in/riyak

SUMMARY
Final-year CS student who builds backend services.

EDUCATION
MIT World Peace University | B.Tech in Computer Engineering | CGPA 8.9/10 | 2022 – 2026

EXPERIENCE
Backend Intern | Acme Payments | Jun 2025 – Aug 2025
• Built a refund service in Go handling 2k requests a minute.
• Cut p95 latency by 30% with Redis caching.

PROJECTS
QueueCat | Go, Kafka, PostgreSQL
• Event pipeline for a college fest app.

TECHNICAL SKILLS
Languages: Go, Python, SQL
Tools: Docker, Git

ACHIEVEMENTS
• Finalist, Smart India Hackathon 2024.
`;

describe("parseResumeText", () => {
  const p = parseResumeText(TEXT, { name: "x", email: "x@x.com" });
  it("reads contact details", () => {
    expect(p.contact).toMatchObject({
      name: "Riya Kapoor",
      email: "riya@example.com",
      loc: "Pune, India",
    });
    expect(p.contact.phone).toContain("98765");
    expect(p.contact.links).toEqual(["github.com/riyak", "linkedin.com/in/riyak"]);
  });
  it("reads sections", () => {
    expect(p.summary).toBe("Final-year CS student who builds backend services.");
    expect(p.education[0]).toMatchObject({
      school: "MIT World Peace University",
      degree: "B.Tech in Computer Engineering",
      score: "CGPA 8.9/10",
      dates: "2022 – 2026",
    });
    expect(p.experience[0]).toMatchObject({
      role: "Backend Intern",
      co: "Acme Payments",
      dates: "Jun 2025 – Aug 2025",
    });
    expect(p.experience[0]!.bullets).toHaveLength(2);
    expect(p.projects[0]).toMatchObject({ name: "QueueCat", stack: "Go, Kafka, PostgreSQL" });
    expect(p.skills).toEqual([
      { name: "Languages", items: ["Go", "Python", "SQL"] },
      { name: "Tools", items: ["Docker", "Git"] },
    ]);
    expect(p.achievements).toEqual(["Finalist, Smart India Hackathon 2024."]);
  });
});

describe("latexToText", () => {
  it("keeps sections, bullets and text", () => {
    const t = latexToText(
      "\\section{Experience}\n\\textbf{Intern}, Acme \\hfill 2025\n\\begin{itemize}\n\\item Built \\textit{things} -- fast\n\\end{itemize}",
    );
    expect(t).toContain("Experience");
    expect(t).toContain("Intern, Acme | 2025");
    expect(t).toContain("• Built things – fast");
  });
});
