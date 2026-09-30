import "server-only";
import type { LanguageModel } from "ai";
import { languageModel } from "@ge/ai";
import { env } from "./env";
import { llmKeyFor } from "./settings";

/** The LLM for this user's request: their own key when saved, else the deployment's; null without either. */
export async function appModel(
  userId: string,
  which: "default" | "interview" = "default",
): Promise<LanguageModel | null> {
  const e = env();
  return languageModel({
    apiKey: await llmKeyFor(userId),
    model: which === "interview" ? e.INTERVIEW_MODEL : e.LLM_MODEL,
  });
}
