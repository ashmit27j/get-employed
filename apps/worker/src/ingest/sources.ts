import { z } from "zod";
import { htmlToText, type JobFilters, type RawJob } from "@ge/core";
import type { WorkerEnv } from "../env";

/*
 * Job sources (docs/job-ingestion.md). Company boards (Greenhouse, Lever, Ashby) need no key and
 * return every opening of one company; keyword sources (Adzuna, LinkedIn) search by query.
 */

/** Company careers boards with public APIs, checked to exist. Add more here. */
export const BOARDS: {
  source: "greenhouse" | "lever" | "ashby";
  token: string;
  company: string;
}[] = [
  { source: "greenhouse", token: "razorpaysoftwareprivatelimited", company: "Razorpay" },
  { source: "greenhouse", token: "groww", company: "Groww" },
  { source: "greenhouse", token: "slice", company: "slice" },
  { source: "greenhouse", token: "inmobi", company: "InMobi" },
  { source: "greenhouse", token: "rubrik", company: "Rubrik" },
  { source: "greenhouse", token: "druva", company: "Druva" },
  { source: "lever", token: "cred", company: "CRED" },
  { source: "lever", token: "meesho", company: "Meesho" },
  { source: "lever", token: "freshworks", company: "Freshworks" },
  { source: "lever", token: "paytm", company: "Paytm" },
  { source: "lever", token: "zeta", company: "Zeta" },
  { source: "lever", token: "mindtickle", company: "Mindtickle" },
];

const TIMEOUT_MS = 20_000;

async function getJson(url: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "User-Agent": "GetEmployed job ingestion (+https://github.com/ashmit27j/get-employed)",
      ...init?.headers,
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} from ${new URL(url).host}`);
  return res.json();
}

const Greenhouse = z.object({
  jobs: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      absolute_url: z.string(),
      location: z.object({ name: z.string() }).nullish(),
      content: z.string().nullish(),
      first_published: z.string().nullish(),
      updated_at: z.string().nullish(),
      company_name: z.string().nullish(),
    }),
  ),
});

export async function greenhouse(token: string, company: string): Promise<RawJob[]> {
  const data = Greenhouse.parse(
    await getJson(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`),
  );
  return data.jobs.map((j) => ({
    sourceKey: "greenhouse",
    sourceLabel: "Careers page",
    externalId: `${token}:${j.id}`,
    title: j.title.trim(),
    company,
    location: j.location?.name ?? "",
    url: j.absolute_url,
    description: htmlToText(j.content ?? ""),
    postedAt: j.first_published ?? j.updated_at ?? null,
  }));
}

const Lever = z.array(
  z.object({
    id: z.string(),
    text: z.string(),
    hostedUrl: z.string(),
    createdAt: z.number().nullish(),
    descriptionPlain: z.string().nullish(),
    additionalPlain: z.string().nullish(),
    lists: z
      .array(z.object({ text: z.string().nullish(), content: z.string().nullish() }))
      .nullish(),
    categories: z
      .object({ location: z.string().nullish(), allLocations: z.array(z.string()).nullish() })
      .nullish(),
    workplaceType: z.string().nullish(),
    salaryRange: z
      .object({ min: z.number(), max: z.number(), currency: z.string(), interval: z.string() })
      .nullish(),
  }),
);

export async function lever(token: string, company: string): Promise<RawJob[]> {
  const data = Lever.parse(await getJson(`https://api.lever.co/v0/postings/${token}?mode=json`));
  return data.map((j) => {
    const lists = (j.lists ?? [])
      .map((l) => `${l.text ?? ""}\n${htmlToText(l.content ?? "")}`)
      .join("\n\n");
    const inr = j.salaryRange?.currency === "INR";
    const yearly = j.salaryRange?.interval?.includes("year") ?? true;
    return {
      sourceKey: "lever",
      sourceLabel: "Careers page",
      externalId: `${token}:${j.id}`,
      title: j.text.replace(/\b\w/g, (c) => c.toUpperCase()).trim(),
      company,
      location: j.categories?.location ?? j.categories?.allLocations?.[0] ?? "",
      url: j.hostedUrl,
      description: [j.descriptionPlain, lists, j.additionalPlain]
        .filter(Boolean)
        .join("\n\n")
        .trim(),
      postedAt: j.createdAt ? new Date(j.createdAt).toISOString() : null,
      workplace: j.workplaceType ?? null,
      salaryMin: inr && yearly ? j.salaryRange!.min : null,
      salaryMax: inr && yearly ? j.salaryRange!.max : null,
    };
  });
}

const Ashby = z.object({
  jobs: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      location: z.string().nullish(),
      isRemote: z.boolean().nullish(),
      workplaceType: z.string().nullish(),
      jobUrl: z.string(),
      publishedAt: z.string().nullish(),
      descriptionPlain: z.string().nullish(),
    }),
  ),
});

export async function ashby(token: string, company: string): Promise<RawJob[]> {
  const data = Ashby.parse(await getJson(`https://api.ashbyhq.com/posting-api/job-board/${token}`));
  return data.jobs.map((j) => ({
    sourceKey: "ashby",
    sourceLabel: "Careers page",
    externalId: `${token}:${j.id}`,
    title: j.title.trim(),
    company,
    location: j.location ?? "",
    url: j.jobUrl,
    description: j.descriptionPlain ?? "",
    postedAt: j.publishedAt ?? null,
    remote: j.isRemote ?? undefined,
    workplace: j.workplaceType ?? null,
  }));
}

const Adzuna = z.object({
  results: z.array(
    z.object({
      id: z.union([z.string(), z.number()]),
      title: z.string(),
      company: z.object({ display_name: z.string().nullish() }).nullish(),
      location: z.object({ display_name: z.string().nullish() }).nullish(),
      redirect_url: z.string(),
      created: z.string().nullish(),
      description: z.string().nullish(),
      salary_min: z.number().nullish(),
      salary_max: z.number().nullish(),
      salary_is_predicted: z.union([z.string(), z.number()]).nullish(),
    }),
  ),
});

/** Keywords for keyword sources: roles and skills from the filters, else a broad default. */
export function keywordsFor(f: JobFilters): string {
  const words = [...f.roles, ...f.skills.slice(0, 2)];
  if (f.type === "internship") words.push("intern");
  return words.length ? words.join(" ") : "software engineer";
}

export async function adzuna(env: WorkerEnv, f: JobFilters): Promise<RawJob[]> {
  if (!env.ADZUNA_APP_ID || !env.ADZUNA_APP_KEY) return [];
  const where = f.locations.find((l) => !/anywhere|remote/i.test(l)) ?? "";
  const q = new URLSearchParams({
    app_id: env.ADZUNA_APP_ID,
    app_key: env.ADZUNA_APP_KEY,
    what: keywordsFor(f),
    where: where === "Delhi NCR" ? "Delhi" : where,
    results_per_page: "50",
    max_days_old: "30",
    "content-type": "application/json",
  });
  const data = Adzuna.parse(await getJson(`https://api.adzuna.com/v1/api/jobs/in/search/1?${q}`));
  return data.results.map((j) => {
    const predicted = String(j.salary_is_predicted ?? "0") === "1";
    return {
      sourceKey: "adzuna",
      sourceLabel: "Adzuna",
      externalId: String(j.id),
      title: j.title.replace(/<[^>]+>/g, "").trim(),
      company: j.company?.display_name?.trim() || "Unknown company",
      location: j.location?.display_name ?? "India",
      url: j.redirect_url,
      description: (j.description ?? "").replace(/<[^>]+>/g, ""),
      postedAt: j.created ?? null,
      salaryMin: predicted ? null : (j.salary_min ?? null),
      salaryMax: predicted ? null : (j.salary_max ?? null),
    };
  });
}

const LinkedinSummary = z.array(
  z.object({
    external_id: z.string(),
    title: z.string(),
    company: z.string(),
    location: z.string(),
    url: z.string(),
    posted_at: z.string().nullish(),
    description: z.string().nullish(),
  }),
);

/** LinkedIn's public job search through apps/scraper; off unless LINKEDIN_SCRAPING_ENABLED. */
export async function linkedin(env: WorkerEnv, f: JobFilters): Promise<RawJob[]> {
  if (!env.LINKEDIN_SCRAPING_ENABLED) return [];
  const data = LinkedinSummary.parse(
    await getJson(`${env.SCRAPER_URL}/linkedin/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(env.SCRAPER_SHARED_SECRET ? { "X-Scraper-Secret": env.SCRAPER_SHARED_SECRET } : {}),
      },
      body: JSON.stringify({
        keywords: keywordsFor(f),
        location: f.locations.find((l) => !/anywhere|remote/i.test(l)) ?? "India",
        remote: f.modes.includes("Remote") || undefined,
        experience: f.type === "internship" ? ["internship"] : [],
      }),
    }),
  );
  return data.map((j) => ({
    sourceKey: "linkedin",
    sourceLabel: "LinkedIn",
    externalId: j.external_id,
    title: j.title,
    company: j.company,
    location: j.location,
    url: j.url,
    description: j.description ?? "",
    postedAt: j.posted_at ?? null,
  }));
}
