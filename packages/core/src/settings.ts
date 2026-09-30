import { z } from "zod";

/** user_settings.general (Settings → General, plus Account's nickname and role). */
export const GeneralSettingsSchema = z.object({
  timeZone: z.string().default("Asia/Kolkata (IST)"),
  currency: z.string().default("₹ INR · LPA"),
  /** Roles below this score are hidden from the feed and digest (0 = show all). */
  minMatch: z.number().int().min(0).max(100).default(60),
  notify: z
    .object({
      matches: z.boolean().default(true),
      replies: z.boolean().default(true),
      followUps: z.boolean().default(true),
      interviews: z.boolean().default(true),
      weekly: z.boolean().default(false),
    })
    .default({ matches: true, replies: true, followUps: true, interviews: true, weekly: false }),
  digestTime: z.string().default("08:00"),
  /** null when quiet hours are off. */
  quietHours: z
    .object({ start: z.string(), end: z.string() })
    .nullable()
    .default({ start: "22:00", end: "08:00" }),
  nickname: z.string().default(""),
  workRole: z.string().default("Student"),
});

/** user_settings.mailbox (Settings → Mailbox). */
export const MailboxSettingsSchema = z.object({
  windowStart: z.string().default("09:00"),
  windowEnd: z.string().default("18:00"),
  dailyLimit: z.number().int().min(1).max(100).default(20),
  followUps: z.boolean().default(true),
  /** The Mailbox's first-visit "connect your mailbox" step was finished or skipped. */
  setupDone: z.boolean().default(false),
});

/** user_settings.ai (Settings → AI & privacy). */
export const AiSettingsSchema = z.object({
  autoFilters: z.boolean().default(true),
  /** Draft outreach for matches above 85. Nothing sends without approval. */
  autoDraft: z.boolean().default(true),
  suggestEdits: z.boolean().default(true),
  tone: z.string().default("Friendly and direct"),
  saveRecordings: z.boolean().default(false),
  improve: z.boolean().default(false),
  /** Days to keep assistant chats; 0 = never delete. */
  chatRetentionDays: z.number().int().min(0).default(0),
});

export type GeneralSettings = z.infer<typeof GeneralSettingsSchema>;
export type MailboxSettings = z.infer<typeof MailboxSettingsSchema>;
export type AiSettings = z.infer<typeof AiSettingsSchema>;
export interface UserSettings {
  general: GeneralSettings;
  mailbox: MailboxSettings;
  ai: AiSettings;
}

/** Stored settings with defaults filled in. Unknown or invalid values fall back to the default. */
export function parseSettings(
  row: { general?: unknown; mailbox?: unknown; ai?: unknown } | undefined,
): UserSettings {
  const safe = <T>(schema: z.ZodType<T>, v: unknown): T => {
    const r = schema.safeParse(v ?? {});
    return r.success ? r.data : schema.parse({});
  };
  return {
    general: safe(GeneralSettingsSchema, row?.general),
    mailbox: safe(MailboxSettingsSchema, row?.mailbox),
    ai: safe(AiSettingsSchema, row?.ai),
  };
}

export const MIN_MATCH_OPTIONS: [string, number][] = [
  ["Show all", 0],
  ["50 and above", 50],
  ["60 and above", 60],
  ["70 and above", 70],
  ["80 and above", 80],
];
