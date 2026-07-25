import OpenAI from "openai";

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY must be set.");
}

/**
 * OpenAI-compatible client pointed at OpenRouter.
 * Replaces the Replit AI integration for all chat completions.
 */
export const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://omnix.app",
    "X-Title": "OMNIX",
  },
});

// openrouter/free routes randomly to content-safety classifiers and code models.
// tencent/hy3:free is a reliable free general-purpose chat model on OpenRouter:
// clean prose, no markdown artifacts, correct language mirroring, low latency.
export const CHAT_MODEL = "tencent/hy3:free";
