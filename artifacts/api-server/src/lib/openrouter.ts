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

export const CHAT_MODEL = "openai/gpt-4o-mini";
