---
name: SSE streaming always-done
description: How to correctly structure the SSE chat handler so done:true is unconditionally sent and client clears state without flashing.
---

## Rule
`done:true` must be written to the SSE response **outside** the outer try/catch block so it is sent regardless of whether the AI stream or the DB insert fails.

The DB insert for the assistant message must be in its **own inner try/catch** (log the error but do not rethrow) so it never prevents `done:true` from being sent.

```typescript
// CORRECT
try {
  const stream = await openai.chat.completions.create({ stream: true, ... });
  for await (const chunk of stream) {
    if (chunk.choices[0]?.delta?.content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
  }
  try {
    await db.insert(messages).values({ role: "assistant", content: fullResponse });
  } catch (dbErr) {
    logger.error({ err: dbErr }, "Failed to save assistant message");
  }
} catch (err) {
  logger.error({ err }, "AI streaming error");
  res.write(`data: ${JSON.stringify({ error: "AI request failed" })}\n\n`);
}
res.write(`data: ${JSON.stringify({ done: true })}\n\n`);  // ← always last
res.end();
```

## Client side
In chat-detail.tsx `sendMessage`, when `data.done` is received:
1. Set `streaming: false` on the last assistant message
2. `await queryClient.refetchQueries(...)` — wait for server data before clearing
3. `setStreamedMessages([])` — clear only after refetch so there is no blank-flash
4. `break outer` — exit the while loop immediately

In `finally`, only clear if a message is still in `streaming: true` state (error/network-drop case):
```typescript
} finally {
  setIsSending(false);
  setStreamedMessages(prev => prev.some(m => m.streaming) ? prev.slice(0, -2) : prev);
}
```

**Why:** If the DB insert for the assistant message fails (e.g. prod tables missing) and done:true is never sent, the client's typing indicator stays visible until the TCP connection times out — the "infinite thinking" bug. The client clearing streamedMessages[] in finally without awaiting the refetch caused a visible blank flash between stream end and server data arriving.
