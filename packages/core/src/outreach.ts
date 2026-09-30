import type { InboxKind } from "./domain";

/**
 * Rule-based outreach text. Gemini writes the real drafts (email.draft in the worker); these are
 * the fallback when no LLM is configured and the starting point the worker rewrites.
 */

const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name;

export function outreachDraft(input: {
  toName: string;
  jobTitle: string;
  company: string;
  senderName: string;
  /** One line about the candidate that fits the role, e.g. from the match reason. */
  highlight?: string | null;
}): { subject: string; body: string } {
  const highlight = input.highlight?.trim();
  return {
    subject: `${input.jobTitle}: application from ${input.senderName}`,
    body: [
      `Hi ${firstName(input.toName)},`,
      "",
      `I saw the ${input.jobTitle} opening at ${input.company} and wanted to reach out directly.${highlight ? ` ${highlight}` : ""}`,
      "",
      "I've attached a resume tailored to the role. Would you be open to a 15-minute chat, or could you point me to the right person?",
      "",
      "Thanks,",
      firstName(input.senderName),
    ].join("\n"),
  };
}

/** "Draft reply" in the Inbox (prototype/Outbox.dc.html). */
export function replyDraft(input: {
  fromName: string;
  kind: InboxKind;
  senderName: string;
}): string {
  const hi = `Hi ${firstName(input.fromName)},`;
  const sign = `Best,\n${firstName(input.senderName)}`;
  if (input.kind === "interview")
    return `${hi}\n\nThank you. Tuesday at 15:00 IST works for me, and Wednesday after 14:00 is a good backup. Looking forward to it.\n\n${sign}`;
  return `${hi}\n\nThanks for getting back to me. I've attached my resume and I'm happy to share anything else that helps.\n\n${sign}`;
}

export const wordCount = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

/** "Re: " once, for replies. */
export const replySubject = (subject: string) =>
  /^re:/i.test(subject.trim()) ? subject.trim() : `Re: ${subject.trim()}`;
