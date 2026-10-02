import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { linkedinReview } from "@ge/ai";
import {
  ProfileSchema,
  README_CHECKS,
  linkedinReviewRules,
  mentions,
  parseLinkedinPdf,
  profileSkills,
  type GhRepo,
  type GithubSnapshot,
  type LinkedinText,
} from "@ge/core";
import { schema } from "@ge/db";
import { withFallback, type Ctx } from "./ctx";
import { fileText } from "./resume";

const { linkedProfiles, profiles, users } = schema;

async function gh(ctx: Ctx, path: string, accept = "application/vnd.github+json") {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: accept,
      "User-Agent": "GetEmployed",
      ...(ctx.env.GITHUB_TOKEN ? { Authorization: `Bearer ${ctx.env.GITHUB_TOKEN}` } : {}),
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub ${res.status} for ${path}`);
  return accept.includes("raw") ? res.text() : res.json();
}

/** How complete a README is against README_CHECKS (0–100). */
function readmeScore(readme: string, repoDescription: string): number {
  const t = readme.toLowerCase();
  const checks = [
    !!repoDescription.trim() || /^#.+\n+[^#\n]{20,}/m.test(readme),
    /##\s*(about|overview|why|what|motivation|features)|\bthis (project|app|tool)\b/i.test(readme),
    /##\s*(tech|stack|built with)|\b(go|python|react|node|typescript|java|swift|kafka|postgres)\b/i.test(
      t,
    ),
    /##\s*(setup|install|getting started|usage|run)|```/i.test(readme),
    /!\[|\.gif|\.png|demo|screenshot/i.test(readme),
    /##\s*(results?|metrics|benchmarks?|performance)|\d+\s*(%|ms|users|requests|x\b)/i.test(readme),
  ];
  return Math.round((100 * checks.filter(Boolean).length) / README_CHECKS.length);
}

/** Pinned repositories: GraphQL with a token, else the public profile page. */
async function pinnedRepos(ctx: Ctx, login: string): Promise<string[]> {
  if (ctx.env.GITHUB_TOKEN) {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ctx.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        "User-Agent": "GetEmployed",
      },
      body: JSON.stringify({
        query: `query($l:String!){user(login:$l){pinnedItems(first:6,types:REPOSITORY){nodes{... on Repository{name}}}}}`,
        variables: { l: login },
      }),
    });
    const json = (await res.json()) as {
      data?: { user?: { pinnedItems?: { nodes?: { name: string }[] } } };
    };
    const nodes = json.data?.user?.pinnedItems?.nodes;
    if (nodes) return nodes.map((n) => n.name);
  }
  const html = await fetch(`https://github.com/${login}`, {
    headers: { "User-Agent": "GetEmployed" },
    signal: AbortSignal.timeout(20_000),
  })
    .then((r) => (r.ok ? r.text() : ""))
    .catch(() => "");
  const section = html
    .split(/js-pinned-items-reorder-container|pinned-item-list-item/)
    .slice(1)
    .join(" ");
  const names = [...section.matchAll(new RegExp(`href="/${login}/([\\w.-]+)"`, "gi"))].map(
    (m) => m[1]!,
  );
  return [...new Set(names)].slice(0, 6);
}

const RepoApi = z.array(
  z.object({
    name: z.string(),
    id: z.number(),
    fork: z.boolean(),
    archived: z.boolean().optional(),
    description: z.string().nullable(),
    language: z.string().nullable(),
    stargazers_count: z.number(),
    topics: z.array(z.string()).optional(),
    pushed_at: z.string().nullable(),
    size: z.number(),
  }),
);

/** profile.import-github: public repositories, README quality, pins and what's worth pinning. */
export async function importGithub(ctx: Ctx, data: unknown) {
  const { userId, login } = z.object({ userId: z.string(), login: z.string() }).parse(data);
  try {
    const list = RepoApi.parse(await gh(ctx, `/users/${login}/repos?per_page=100&sort=pushed`));
    const [p] = await ctx.db
      .select({ doc: profiles.doc })
      .from(profiles)
      .where(eq(profiles.userId, userId));
    const [u] = await ctx.db
      .select({ role: users.targetRole })
      .from(users)
      .where(eq(users.id, userId));
    const skills = p ? profileSkills(ProfileSchema.parse(p.doc)) : [];
    const pinned = new Set(await pinnedRepos(ctx, login));
    const own = list.filter((r) => !r.fork && !r.archived).slice(0, 30);

    const repos: GhRepo[] = [];
    for (const r of own) {
      const readme =
        ((await gh(ctx, `/repos/${login}/${r.name}/readme`, "application/vnd.github.raw").catch(
          () => null,
        )) as string | null) ?? "";
      const score = readmeScore(readme, r.description ?? "");
      const ageDays = r.pushed_at
        ? (Date.now() - new Date(r.pushed_at).getTime()) / 86_400_000
        : 9999;
      const relevant = skills.some(
        (s) =>
          (r.language && mentions(r.language, s)) || (r.topics ?? []).some((t) => mentions(t, s)),
      );
      const practice =
        /\b(leetcode|dsa|practice|assignment|coursework|lab|test|hello|demo|tutorial)\b/i.test(
          `${r.name} ${r.description ?? ""}`,
        );
      const suggest =
        !practice && relevant && (score >= 50 || r.stargazers_count >= 2) && ageDays < 550;
      repos.push({
        id: String(r.id),
        name: r.name,
        lang: r.language ?? "",
        stars: r.stargazers_count,
        desc: r.description ?? "",
        topics: r.topics ?? [],
        readmeScore: score,
        suggest,
        why: practice
          ? "Practice solutions read as coursework. Keep it public, but don't pin it."
          : !relevant
            ? `Doesn't show skills from your resume${u?.role ? ` for ${u.role.toLowerCase()} roles` : ""}.`
            : score < 50
              ? "Relevant, but its README is thin. Improve it before pinning."
              : "Shows skills from your resume with a clear README.",
        pinned: pinned.has(r.name),
      });
    }
    const bytes = new Map<string, number>();
    for (const r of own)
      if (r.language) bytes.set(r.language, (bytes.get(r.language) ?? 0) + Math.max(1, r.size));
    const total = [...bytes.values()].reduce((a, b) => a + b, 0) || 1;
    const languages = [...bytes.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, n]) => ({ name, pct: Math.round((100 * n) / total) }));
    const last = own[0]?.pushed_at
      ? (Date.now() - new Date(own[0].pushed_at).getTime()) / 86_400_000
      : null;
    const snapshot: GithubSnapshot = {
      login,
      repos,
      languages,
      activity:
        last == null
          ? "no public activity"
          : last < 7
            ? "active this week"
            : last < 31
              ? "active this month"
              : `last active ${Math.round(last / 30)} months ago`,
    };
    await ctx.db
      .update(linkedProfiles)
      .set({ snapshot, importedAt: new Date(), error: null })
      .where(and(eq(linkedProfiles.userId, userId), eq(linkedProfiles.kind, "github")));
    ctx.log(`import-github ${login}: ${repos.length} repos, ${pinned.size} pinned`);
  } catch (err) {
    await ctx.db
      .update(linkedProfiles)
      .set({
        error:
          err instanceof Error && err.message.includes("404")
            ? "That GitHub user wasn't found."
            : "We couldn't read GitHub just now. Try Refresh in a few minutes.",
      })
      .where(and(eq(linkedProfiles.userId, userId), eq(linkedProfiles.kind, "github")));
    throw err;
  }
}

/** profile.import-linkedin: the PDF export or the public profile page → sections and rewrites. */
export async function importLinkedin(ctx: Ctx, data: unknown) {
  const job = z
    .object({ userId: z.string(), key: z.string().optional(), url: z.string().url().optional() })
    .parse(data);
  const fail = async (error: string): Promise<void> => {
    await ctx.db
      .update(linkedProfiles)
      .set({ error })
      .where(and(eq(linkedProfiles.userId, job.userId), eq(linkedProfiles.kind, "linkedin")));
  };

  let li: LinkedinText;
  let text: string;
  if (job.key) {
    if (!job.key.startsWith(`users/${job.userId}/`))
      throw new Error("import-linkedin: key outside the user's folder");
    const file = await ctx.storage.get(job.key);
    if (!file) return fail("We couldn't find the uploaded PDF. Upload it again.");
    text = await fileText(file.body, "pdf");
    li = parseLinkedinPdf(text);
  } else if (job.url) {
    if (!ctx.env.LINKEDIN_SCRAPING_ENABLED)
      return fail("Importing from a link is off on this server. Upload your LinkedIn PDF instead.");
    const handle = /linkedin\.com\/in\/([\w%-]+)/i.exec(job.url)?.[1];
    if (!handle) return fail("That doesn't look like a LinkedIn profile link.");
    const res = await fetch(`${ctx.env.SCRAPER_URL}/linkedin/profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(ctx.env.SCRAPER_SHARED_SECRET
          ? { "X-Scraper-Secret": ctx.env.SCRAPER_SHARED_SECRET }
          : {}),
      },
      body: JSON.stringify({ handle }),
      signal: AbortSignal.timeout(60_000),
    }).catch(() => null);
    if (!res?.ok)
      return fail(
        res?.status === 502
          ? "LinkedIn only shows this profile to signed-in members. Upload your LinkedIn PDF instead."
          : res?.status === 404
            ? "We couldn't find that profile. Check the link."
            : "We couldn't reach LinkedIn just now. Try again, or upload your PDF.",
      );
    const page = (await res.json()) as LinkedinText;
    li = page;
    text = [
      page.name,
      page.headline,
      "About",
      page.about,
      "Experience",
      ...page.experience,
      "Education",
      ...page.education,
      "Skills",
      ...page.skills,
    ].join("\n");
  } else return;

  const [p] = await ctx.db
    .select({ doc: profiles.doc })
    .from(profiles)
    .where(eq(profiles.userId, job.userId));
  const profile = ProfileSchema.parse(p?.doc ?? { contact: { name: li.name, email: "" } });
  const review = await withFallback(
    ctx,
    "linkedinReview",
    await ctx.llm(job.userId),
    (m) => linkedinReview(m, { text, profile }),
    () => linkedinReviewRules(li, profile),
  );
  await ctx.db
    .update(linkedProfiles)
    .set({
      snapshot: { sections: review.sections, strength: review.strength },
      suggestions: review.suggestions,
      importedAt: new Date(),
      error: null,
    })
    .where(and(eq(linkedProfiles.userId, job.userId), eq(linkedProfiles.kind, "linkedin")));
  ctx.log(
    `import-linkedin ${job.userId}: ${review.sections.length} sections, ${review.suggestions.length} suggestions`,
  );
}
