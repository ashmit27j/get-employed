import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { defaultSettingsMiddleware, wrapLanguageModel, type LanguageModel } from "ai";

/**
 * The model for one call, or null when there is no key: every caller then falls back to the
 * rule-based code in @ge/core (docs/decisions.md D19). Keys only ever come from the server.
 */
export function languageModel(opts: {
  apiKey?: string | null;
  model?: string | null;
}): LanguageModel | null {
  if (!opts.apiKey) return null;
  const google = createGoogleGenerativeAI({ apiKey: opts.apiKey });
  // Thinking tokens are billed as output and every task here is short and structured, so keep it minimal.
  return wrapLanguageModel({
    model: google(opts.model || "gemini-flash-latest"),
    middleware: defaultSettingsMiddleware({
      settings: { providerOptions: { google: { thinkingConfig: { thinkingLevel: "minimal" } } } },
    }),
  });
}

/** Shared system rule: this product writes for Indian students and early-career engineers. */
export const HOUSE_STYLE =
  "You work inside GetEmployed, a job-search copilot for students and early-career engineers in India. " +
  "Write in plain, direct English, second person where you address the user, sentence case, no emoji, no exclamation marks. " +
  "Never invent facts about the user: only use what the profile or text you are given says. Salaries are in ₹ LPA.";
