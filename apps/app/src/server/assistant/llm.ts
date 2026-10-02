import "server-only";
import { generateText, isStepCount, tool, type LanguageModel, type ModelMessage } from "ai";
import { z } from "zod";
import { HOUSE_STYLE, parseResume } from "@ge/ai";
import { ProfileSchema, type JobCard } from "@ge/core";
import { loadJobCards } from "../jobs";
import { loadProfile, saveProfile } from "../profile";
import {
  ats,
  interview,
  linkedin,
  outreach,
  searchJobs,
  tailor,
  tracker,
  type Ctx,
  type Reply,
} from "./router";

const SYSTEM = `${HOUSE_STYLE}
You are the GetEmployed assistant. Use the tools to act; don't describe what a tool would do without calling it.
Rules: nothing is ever emailed or applied to without the user's approval, so say drafts wait in the Outbox. Jobs you mention must come from the tools or the list below; refer to them by title and company. Keep replies to two or three short sentences; the tool results appear as cards under your reply.`;

/**
 * One assistant turn with Gemini tool calling (docs/architecture.md "Assistant"). The tools are the
 * same ones the rule-based router runs; their cards and jobs are collected for the reply.
 */
export async function respondWithAI(
  model: LanguageModel,
  input: {
    userId: string;
    userName: string;
    text: string;
    history: ModelMessage[];
    recentJobIds: string[];
  },
): Promise<Reply & { profileUpdated: boolean }> {
  const cards = await loadJobCards(input.userId);
  const ctx: Ctx = { userId: input.userId, cards, recentJobIds: input.recentJobIds };
  const collected: Reply[] = [];
  let profileUpdated = false;
  const byId = (id: string): JobCard | null => cards.find((c) => c.id === id) ?? null;
  const record = (r: Reply) => {
    collected.push(r);
    return {
      summary: r.text,
      jobs: r.jobIds
        .map((id) => byId(id))
        .filter(Boolean)
        .map((c) => `${c!.id}: ${c!.title} at ${c!.company} (${c!.score ?? "unscored"})`),
    };
  };
  const jobId = z.string().describe("A job id from the job list or an earlier tool result");

  const tools = {
    search_jobs: tool({
      description:
        "Search open jobs with a plain-English query (role, skills, city, salary, internship).",
      inputSchema: z.object({ query: z.string() }),
      execute: async ({ query }) => record(await searchJobs(query, ctx)),
    }),
    tailor_resume: tool({
      description:
        "Create a tailored copy of the user's resume for one job, with rewrites to review.",
      inputSchema: z.object({ jobId }),
      execute: async ({ jobId: id }) => {
        const job = byId(id);
        return job ? record(await tailor(job)) : { error: "Unknown job id" };
      },
    }),
    draft_outreach: tool({
      description:
        "Draft an outreach email to the hiring team for one job. It waits in the Outbox for approval; never sends.",
      inputSchema: z.object({ jobId }),
      execute: async ({ jobId: id }) => {
        const job = byId(id);
        return job ? record(await outreach(job)) : { error: "Unknown job id" };
      },
    }),
    read_tracker: tool({
      description: "Summarise the user's applications by stage and the next alert.",
      inputSchema: z.object({}),
      execute: async () => record(await tracker(input.userId)),
    }),
    ats_score: tool({
      description:
        "Score the main resume against postings for the user's target role and list missing keywords.",
      inputSchema: z.object({}),
      execute: async () => record(await ats(input.userId)),
    }),
    mock_interview: tool({
      description: "Set up a mock interview, optionally for one job.",
      inputSchema: z.object({ jobId: jobId.optional() }),
      execute: async ({ jobId: id }) => record(interview(id ? byId(id) : null)),
    }),
    linkedin_tips: tool({
      description: "Suggestions for the user's LinkedIn headline and About section.",
      inputSchema: z.object({}),
      execute: async () => record(await linkedin(input.userId)),
    }),
    fill_profile: tool({
      description:
        "Fill the user's Job Profile and main resume from resume or LinkedIn text they pasted into the chat. Only when they ask you to.",
      inputSchema: z.object({
        text: z.string().min(80).describe("The resume or profile text, verbatim"),
      }),
      execute: async ({ text }) => {
        const { doc: current } = await loadProfile(input.userId);
        const parsed = await parseResume(model, text, {
          name: current.contact.name || input.userName,
          email: current.contact.email,
        });
        // Keep contact details the user already set; take everything else from the pasted text.
        const doc = ProfileSchema.parse({
          ...parsed,
          contact: {
            ...parsed.contact,
            name: current.contact.name || parsed.contact.name,
            email: current.contact.email || parsed.contact.email,
            phone: current.contact.phone || parsed.contact.phone,
            loc: current.contact.loc || parsed.contact.loc,
          },
        });
        await saveProfile(input.userId, doc);
        profileUpdated = true;
        return record({
          text: `Filled in ${doc.experience.length} roles, ${doc.projects.length} projects and ${doc.skills.flatMap((g) => g.items).length} skills.`,
          actions: [
            {
              icon: "user-round",
              title: "Job Profile filled in",
              detail: "Review each section, then save",
              status: "done",
              href: "/profile",
              cta: "Review profile",
            },
          ],
          jobIds: [],
        });
      },
    }),
  };

  const jobList = cards
    .filter((c) => !c.hidden)
    .slice(0, 15)
    .map((c) => `${c.id}: ${c.title} at ${c.company}, ${c.location}, match ${c.score ?? "?"}`)
    .join("\n");
  const recent = input.recentJobIds
    .map((id) => byId(id))
    .filter(Boolean)
    .map((c) => `${c!.id}: ${c!.title} at ${c!.company}`);

  const result = await generateText({
    model,
    system: `${SYSTEM}\n\nThe user is ${input.userName}.\nTop jobs for them:\n${jobList || "(none yet)"}${recent.length ? `\nJobs in your last reply, in order:\n${recent.join("\n")}` : ""}`,
    messages: [...input.history.slice(-10), { role: "user", content: input.text }],
    tools,
    stopWhen: isStepCount(3),
    maxRetries: 1,
  });

  return {
    text: result.text.trim() || collected.map((r) => r.text).join(" ") || "Done.",
    actions: collected.flatMap((r) => r.actions),
    jobIds: [...new Set(collected.flatMap((r) => r.jobIds))],
    profileUpdated,
  };
}
