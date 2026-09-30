import "server-only";
import { and, eq, gte, isNull } from "drizzle-orm";
import {
  STAGE_LABELS,
  atsScore,
  filtersToChips,
  matchesFilters,
  parseFilters,
  type ChatAction,
  type JobCard,
} from "@ge/core";
import { schema } from "@ge/db";
import { createTailoredResume } from "../actions/documents";
import { draftForJob } from "../actions/mailbox";
import { getDb } from "../db";
import { mainAtsKeywords } from "../documents";
import { loadJobCards } from "../jobs";
import { loadProfile } from "../profile";
import { loadLinkedin } from "../profiles";

/**
 * The assistant's tools, driven by rules until the LLM is configured (Phase 6 swaps the intent
 * matching for Gemini tool calls over these same tools; docs/architecture.md "Assistant").
 * Every tool does the real thing: nothing is sent or booked without the user.
 */

export interface Reply {
  text: string;
  actions: ChatAction[];
  jobIds: string[];
}

export interface Ctx {
  userId: string;
  cards: JobCard[];
  /** Jobs the previous assistant message listed, for "the Razorpay one" or "the first one". */
  recentJobIds: string[];
}

const lc = (s: string) => s.toLowerCase();
const ORDINALS = ["first", "second", "third"];

/** The job a message is about: a named company, "the first one", else nothing. */
function resolveJob(text: string, ctx: Ctx): JobCard | null {
  const t = lc(text);
  const named = ctx.cards.filter((c) => t.includes(lc(c.company)));
  if (named.length) {
    const titled = named.find((c) => t.includes(lc(c.title)));
    return titled ?? named[0]!;
  }
  const recent = ctx.recentJobIds
    .map((id) => ctx.cards.find((c) => c.id === id))
    .filter((c): c is JobCard => !!c);
  const ord = ORDINALS.findIndex((o) => t.includes(o));
  if (ord >= 0 && recent[ord]) return recent[ord]!;
  if (/\b(that|this|the) (one|role|job)\b/.test(t) && recent[0]) return recent[0];
  return null;
}

export async function searchJobs(text: string, ctx: Ctx): Promise<Reply> {
  const f = parseFilters(text);
  const hits = ctx.cards.filter((c) => !c.hidden && matchesFilters(c, f));
  const top = hits.slice(0, 3);
  const chips = filtersToChips(f).map((c) => c.label);
  const action: ChatAction = {
    icon: "search",
    title: "Searched jobs",
    detail: chips.length ? chips.join(" · ") : "Everything open right now",
    status: "done",
    href: "/jobs?board=Deep+Search",
    cta: "Open in Jobs",
  };
  if (!top.length)
    return {
      text: "Nothing open matches that yet. Deep Search can keep checking and tell you when a role appears.",
      actions: [action],
      jobIds: [],
    };
  return {
    text:
      hits.length > top.length
        ? `${hits.length} roles fit; these ${top.length} match your profile best.`
        : `${hits.length === 1 ? "One role fits" : `${hits.length} roles fit`}. Here ${hits.length === 1 ? "it is" : "they are"}, best match first.`,
    actions: [action],
    jobIds: top.map((c) => c.id),
  };
}

export async function tailor(job: JobCard): Promise<Reply> {
  await createTailoredResume(job.id);
  return {
    text: `I set up a tailored copy of your resume for ${job.title} at ${job.company}. Review each suggested rewrite before you use it; your main resume doesn't change.`,
    actions: [
      {
        icon: "file-check",
        title: `Tailored resume for ${job.title} · ${job.company}`,
        detail: "Suggestions to review",
        status: "done",
        href: `/documents?view=tailor&job=${job.id}`,
        cta: "Review",
      },
    ],
    jobIds: [],
  };
}

export async function outreach(job: JobCard): Promise<Reply> {
  const id = await draftForJob(job.id);
  if (!id)
    return {
      text: `I'm still looking for the right person to contact at ${job.company}. The draft will appear in your Outbox once I find them.`,
      actions: [
        {
          icon: "user-search",
          title: `Looking for a contact at ${job.company}`,
          status: "running",
        },
      ],
      jobIds: [],
    };
  const [row] = await getDb()
    .select({
      toName: schema.emails.toName,
      toEmail: schema.emails.toEmail,
      confidence: schema.contacts.confidence,
    })
    .from(schema.emails)
    .leftJoin(schema.contacts, eq(schema.contacts.id, schema.emails.contactId))
    .where(eq(schema.emails.id, id));
  return {
    text: `The email to ${row?.toName ?? "the hiring team"} is waiting in your Outbox; nothing is sent until you approve it.`,
    actions: [
      {
        icon: "send",
        title: `Drafted outreach to ${row?.toName ?? job.company}`,
        detail: [row?.toEmail, row?.confidence != null ? `${row.confidence}% confidence` : null]
          .filter(Boolean)
          .join(" · "),
        status: "done",
        href: `/mailbox?box=outbox&email=${id}`,
        cta: "Open Outbox",
      },
    ],
    jobIds: [],
  };
}

export async function tracker(userId: string): Promise<Reply> {
  const db = getDb();
  const apps = await db
    .select({ stage: schema.applications.stage })
    .from(schema.applications)
    .where(eq(schema.applications.userId, userId));
  const due = await db
    .select({ action: schema.alerts.action, dueAt: schema.alerts.dueAt })
    .from(schema.alerts)
    .where(
      and(
        eq(schema.alerts.userId, userId),
        isNull(schema.alerts.doneAt),
        gte(schema.alerts.dueAt, new Date(Date.now() - 86_400_000)),
      ),
    )
    .orderBy(schema.alerts.dueAt)
    .limit(1);
  const counts = (["saved", "applied", "interview", "offer"] as const)
    .map((s) => [STAGE_LABELS[s], apps.filter((a) => a.stage === s).length] as const)
    .filter(([, n]) => n > 0)
    .map(([l, n]) => `${n} ${l.toLowerCase()}`);
  const next = due[0] ? ` Next up: ${due[0].action.toLowerCase()}.` : "";
  return {
    text: counts.length
      ? `You have ${counts.join(", ")}.${next}`
      : "Your tracker is empty. Save a job and it shows up there.",
    actions: [
      {
        icon: "square-kanban",
        title: "Read your tracker",
        status: "done",
        href: "/tracker",
        cta: "Open tracker",
      },
    ],
    jobIds: [],
  };
}

export async function ats(userId: string): Promise<Reply> {
  const [{ doc }, { keywords, postings }] = await Promise.all([
    loadProfile(userId),
    mainAtsKeywords(userId),
  ]);
  const r = atsScore(doc, keywords);
  const missing = r.keywords.missing.slice(0, 3);
  return {
    text: `Your main resume scores ${r.score} against ${postings} matching postings. ${r.tip ?? "It's in good shape."}${
      missing.length
        ? ` The keywords those roles ask for most that your resume doesn't mention: ${missing.join(", ")}.`
        : ""
    }`,
    actions: [
      {
        icon: "gauge",
        title: `ATS score ${r.score} / 100`,
        detail: "Main resume",
        status: "done",
        href: "/documents?view=main",
        cta: "Open resume",
      },
    ],
    jobIds: [],
  };
}

export function interview(job: JobCard | null): Reply {
  return {
    text: job
      ? `A 15-minute technical mock for ${job.title} at ${job.company} is ready to start whenever you are. It focuses on what the job description asks for.`
      : "Interview prep has technical and behavioural mocks. Pick a role and a format there, and start when you're ready.",
    actions: [
      {
        icon: "graduation-cap",
        title: job ? `Mock interview for ${job.title} · ${job.company}` : "Mock interview",
        detail: "Technical · 15 min",
        status: "done",
        href: job ? `/interview?job=${job.id}` : "/interview",
        cta: "Prepare",
      },
    ],
    jobIds: [],
  };
}

export async function linkedin(userId: string): Promise<Reply> {
  const li = await loadLinkedin(userId);
  const headline = li.suggestions.find((s) => /headline/i.test(s.section));
  return {
    text: headline
      ? `Try: "${headline.new}" ${headline.reason}`
      : "Upload your LinkedIn PDF export and I'll suggest a headline and About section that match your resume.",
    actions: [
      {
        icon: "link-2",
        title: "LinkedIn suggestions",
        status: "done",
        href: "/profiles/linkedin",
        cta: "Open LinkedIn",
      },
    ],
    jobIds: [],
  };
}

const HELP: Reply = {
  text: 'I can find jobs, tailor your resume for a role, draft outreach (you approve before anything sends), sum up your tracker, explain your ATS score and set up a mock interview. Try "Find remote React roles for freshers".',
  actions: [],
  jobIds: [],
};

/** Answer one message, running every tool it asks for. */
export async function respond(
  userId: string,
  text: string,
  recentJobIds: string[],
): Promise<Reply> {
  const t = lc(text);
  const ctx: Ctx = { userId, cards: await loadJobCards(userId), recentJobIds };
  const job = resolveJob(text, ctx);
  const wants = {
    tailor: /\btailor|\bresume\b|\bcv\b/.test(t) && !/\bats\b|score/.test(t),
    outreach: /\bemail|outreach|reach out|\bdraft\b|hiring manager|recruiter/.test(t),
    interview: /interview|\bmock\b|practi[cs]e/.test(t),
    tracker: /tracker|pipeline|my applications|application status/.test(t),
    ats: /\bats\b|score/.test(t),
    linkedin: /linkedin|headline/.test(t),
  };
  const replies: Reply[] = [];
  if (wants.linkedin) replies.push(await linkedin(userId));
  if (wants.ats) replies.push(await ats(userId));
  if (wants.tracker) replies.push(await tracker(userId));

  // Tailoring and outreach need a role: the one named, else the best matches.
  const targets = job
    ? [job]
    : ctx.cards
        .filter((c) => !c.hidden && c.score != null)
        .slice(0, wants.outreach && !wants.tailor ? 2 : 1);
  if (wants.tailor) for (const j of targets) replies.push(await tailor(j));
  if (wants.outreach && !wants.linkedin) for (const j of targets) replies.push(await outreach(j));
  if (wants.interview) replies.push(interview(job ?? targets[0] ?? null));

  const searching =
    /\b(find|search|look(ing)? for|show me|any)\b/.test(t) ||
    (!replies.length && parseFilters(text).roles.length > 0);
  if (searching || (!replies.length && filtersToChips(parseFilters(text)).length > 0))
    replies.push(await searchJobs(text, ctx));
  if (!replies.length) return HELP;
  return {
    text: replies.map((r) => r.text).join(" "),
    actions: replies.flatMap((r) => r.actions),
    jobIds: replies.flatMap((r) => r.jobIds),
  };
}
