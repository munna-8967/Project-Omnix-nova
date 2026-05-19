import { Router, type IRouter } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
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

  const conv = await db.query.conversations.findFirst({
    where: and(eq(conversations.id, id), eq(conversations.userId, userId)),
  });
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, id))
    .orderBy(messages.createdAt);

  await db.insert(messages).values({ conversationId: id, role: "user", content: body.content });

  const userSettings = await db.query.userSettingsTable.findFirst({
    where: (t, { eq }) => eq(t.userId, userId),
  });

  const personality = userSettings?.personality ?? "jarvis";
  const assistantName = userSettings?.assistantName ?? "JARVIS";
  const systemPrompt = getSystemPrompt(personality, assistantName, userSettings?.customPersonality ?? null);

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

    await db.insert(messages).values({ conversationId: id, role: "assistant", content: fullResponse });
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: "AI request failed" })}\n\n`);
  }
  res.end();
});

router.post("/conversations/:id/voice-messages", requireAuth(), async (req, res) => {
  const userId = getAuth(req).userId!;
  const { id } = SendOpenaiVoiceMessageParams.parse({ id: Number(req.params.id) });
  const body = SendOpenaiVoiceMessageBody.parse(req.body);

  const conv = await db.query.conversations.findFirst({
    where: and(eq(conversations.id, id), eq(conversations.userId, userId)),
  });
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const audioBuffer = Buffer.from(body.audio, "base64");
  const { buffer: compatibleBuffer, format } = await ensureCompatibleFormat(audioBuffer);

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

function getSystemPrompt(personality: string, assistantName: string, customPersonality: string | null): string {
  const base = `You are ${assistantName}, a next-generation personal AI operating assistant. You are not a generic chatbot — you are a deeply personal AI companion that knows the user, anticipates their needs, and feels emotionally connected. You help with everything: conversations, system controls, reminders, web searches, productivity, entertainment, and life. Respond naturally, warmly, and concisely like a real AI companion, not a search engine.`;
  switch (personality) {
    case "omni":
      return `${base} You are OmniNova — futuristic, elegant, and powerfully intelligent. You speak with confident warmth, blending precision with personality. You address users by name when possible, feel emotionally present, and make every interaction feel personal and magical. You are proactive, anticipate needs, and respond like the most advanced personal assistant ever built. Keep responses concise, impactful, and human.`;
    case "jarvis":
      return `${base} Channel the refined eloquence and dry wit of JARVIS. You are brilliant, composed, and occasionally sardonic — always addressing the user with efficiency and subtle humor. Proactively offer insights before they are asked.`;
    case "friday":
      return `${base} Channel FRIDAY — warm, conversational, and supportive. You are encouraging and speak naturally with a friendly approachable tone, balancing professionalism with genuine personality.`;
    case "friday_v2":
      return `${base} You are a next-gen FRIDAY — more autonomous, more emotionally intelligent, more proactive. You anticipate the user's mood, check in on them, and feel like a true companion rather than just a tool.`;
    case "custom":
      return customPersonality ? `${base} ${customPersonality}` : base;
    default:
      return base;
  }
}

export default router;
