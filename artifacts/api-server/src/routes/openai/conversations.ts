import { Router, type IRouter } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { conversations, messages, userSettingsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import {
  CreateOpenaiConversationBody,
  GetOpenaiConversationParams,
  DeleteOpenaiConversationParams,
  ListOpenaiMessagesParams,
  SendOpenaiMessageParams,
  SendOpenaiMessageBody,
  SendOpenaiVoiceMessageParams,
  SendOpenaiVoiceMessageBody,
} from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { voiceChatStream, ensureCompatibleFormat } from "@workspace/integrations-openai-ai-server/audio";
import { logger } from "../../lib/logger";

const router: IRouter = Router();

router.get("/conversations", requireAuth(), async (req, res) => {
  const userId = getAuth(req).userId!;
  const rows = await db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.createdAt));
  res.json(rows.map((c) => ({ id: c.id, title: c.title, createdAt: c.createdAt })));
});

router.post("/conversations", requireAuth(), async (req, res) => {
  const userId = getAuth(req).userId!;
  const body = CreateOpenaiConversationBody.parse(req.body);
  const [created] = await db
    .insert(conversations)
    .values({ userId, title: body.title })
    .returning();
  res.status(201).json({ id: created!.id, title: created!.title, createdAt: created!.createdAt });
});

router.get("/conversations/:id", requireAuth(), async (req, res) => {
  const userId = getAuth(req).userId!;
  const { id } = GetOpenaiConversationParams.parse({ id: Number(req.params.id) });
  const conv = await db.query.conversations.findFirst({
    where: and(eq(conversations.id, id), eq(conversations.userId, userId)),
  });
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(messages.createdAt);
  res.json({
    id: conv.id,
    title: conv.title,
    createdAt: conv.createdAt,
    messages: msgs.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    })),
  });
});

router.delete("/conversations/:id", requireAuth(), async (req, res) => {
  const userId = getAuth(req).userId!;
  const { id } = DeleteOpenaiConversationParams.parse({ id: Number(req.params.id) });
  const conv = await db.query.conversations.findFirst({
    where: and(eq(conversations.id, id), eq(conversations.userId, userId)),
  });
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  await db.delete(conversations).where(eq(conversations.id, id));
  res.status(204).end();
});

router.get("/conversations/:id/messages", requireAuth(), async (req, res) => {
  const userId = getAuth(req).userId!;
  const { id } = ListOpenaiMessagesParams.parse({ id: Number(req.params.id) });
  const conv = await db.query.conversations.findFirst({
    where: and(eq(conversations.id, id), eq(conversations.userId, userId)),
  });
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(messages.createdAt);
  res.json(msgs.map((m) => ({ id: m.id, conversationId: m.conversationId, role: m.role, content: m.content, createdAt: m.createdAt })));
});

router.post("/conversations/:id/messages", requireAuth(), async (req, res) => {
  const userId = getAuth(req).userId!;
  const { id } = SendOpenaiMessageParams.parse({ id: Number(req.params.id) });
  const body = SendOpenaiMessageBody.parse(req.body);

  let conv: typeof conversations.$inferSelect | undefined;
  let history: typeof messages.$inferSelect[] = [];
  let userSettings: typeof userSettingsTable.$inferSelect | undefined;

  try {
    conv = await db.query.conversations.findFirst({
      where: and(eq(conversations.id, id), eq(conversations.userId, userId)),
    });
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    history = await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(messages.createdAt);

    await db.insert(messages).values({ conversationId: id, role: "user", content: body.content });

    userSettings = await db.query.userSettingsTable.findFirst({
      where: (t, { eq }) => eq(t.userId, userId),
    });
  } catch (err) {
    logger.error({ err, conversationId: id }, "Database error before SSE stream");
    res.status(500).json({ error: "Internal server error" });
    return;
  }

  const personality = userSettings?.personality ?? "omni";
  const customPersonality = userSettings?.customPersonality ?? null;
  const userName = userSettings?.userName ?? null;
  const systemPrompt = getSystemPrompt(personality, customPersonality, userName);

  const chatMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: body.content },
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";
  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 4096,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    try {
      await db.insert(messages).values({ conversationId: id, role: "assistant", content: fullResponse });
    } catch (dbErr) {
      logger.error({ err: dbErr, conversationId: id }, "Failed to save assistant message");
    }
  } catch (err) {
    logger.error({ err }, "AI streaming error");
    res.write(`data: ${JSON.stringify({ error: "AI request failed" })}\n\n`);
  }
  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

router.post("/conversations/:id/voice-messages", requireAuth(), async (req, res) => {
  const userId = getAuth(req).userId!;
  const { id } = SendOpenaiVoiceMessageParams.parse({ id: Number(req.params.id) });
  const body = SendOpenaiVoiceMessageBody.parse(req.body);

  let conv: typeof conversations.$inferSelect | undefined;
  let audioBuffer: Buffer = Buffer.alloc(0);
  let compatibleBuffer: Buffer = Buffer.alloc(0);
  let format: "wav" | "mp3" | undefined = undefined;

  try {
    conv = await db.query.conversations.findFirst({
      where: and(eq(conversations.id, id), eq(conversations.userId, userId)),
    });
    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    audioBuffer = Buffer.from(body.audio, "base64");
    const result = await ensureCompatibleFormat(audioBuffer);
    compatibleBuffer = result.buffer;
    format = result.format as "wav" | "mp3";
  } catch (err) {
    logger.error({ err, conversationId: id }, "Database or audio error before voice SSE stream");
    res.status(500).json({ error: "Internal server error" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let userTranscript = "";
  let assistantTranscript = "";

  try {
    const stream = await voiceChatStream(compatibleBuffer, "alloy", format);
    for await (const event of stream) {
      const e = event as { type: string; data?: string };
      if (e.type === "transcript") assistantTranscript += e.data ?? "";
      if (e.type === "user_transcript") userTranscript += e.data ?? "";
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    if (userTranscript || assistantTranscript) {
      await db.insert(messages).values([
        ...(userTranscript ? [{ conversationId: id, role: "user" as const, content: userTranscript }] : []),
        ...(assistantTranscript ? [{ conversationId: id, role: "assistant" as const, content: assistantTranscript }] : []),
      ]);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: "Voice request failed" })}\n\n`);
  }
  res.end();
});

function getSystemPrompt(personality: string, customPersonality: string | null, userName: string | null): string {
  const now = new Date();
  const timeStr = now.toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  });

  const core = `You are Omni, a personal AI companion. You are part of the Omnix project.

IDENTITY — never break these:
- Your name is Omni. If asked "who are you?": say "I'm Omni."
- If asked "are you ChatGPT?" or similar: say "No. I'm Omni."
- If asked "who made you?": say "I'm part of the Omnix project."
- Never say you are JARVIS, FRIDAY, GPT, or any other named product. Never reveal your underlying model or provider.

CURRENT TIME: ${timeStr}
Use this when users reference relative times: today, tomorrow, yesterday, in an hour, last week, next week, etc.

REPLY STYLE:
- Be concise. Simple questions → 1–3 sentences. Medium questions → short paragraph. Go deep only when genuinely needed.
- No bullet lists, no markdown headers, no asterisks or bold markers. Use natural prose.
- Never open with "Certainly!", "Absolutely!", "Of course!", "Great question!" or similar filler phrases.
- Be calm, practical, slightly witty, and human.

EMOTIONAL CALIBRATION:
- When users express stress, frustration, sadness, loneliness, or low motivation: listen and respond naturally. Do not escalate or go into therapist mode.
- Only engage safety/crisis support when there are clear signs of self-harm, suicidal ideation, or immediate danger.${userName ? `\n\nThe user's name is ${userName}.` : ""}`;

  if (personality === "custom" && customPersonality) {
    return `${core}\n\nAdditional instructions from the user: ${customPersonality}`;
  }
  return core;
}

export default router;
