import { Router, type IRouter } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { conversations, messages, memoriesTable, notesTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/stats", requireAuth(), async (req, res) => {
  const userId = getAuth(req).userId!;

  const [convCount] = await db
    .select({ count: count() })
    .from(conversations)
    .where(eq(conversations.userId, userId));

  const userConvs = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(eq(conversations.userId, userId));

  let msgCount = 0;
  if (userConvs.length > 0) {
    const ids = userConvs.map((c) => c.id);
    for (const id of ids) {
      const [mc] = await db
        .select({ count: count() })
        .from(messages)
        .where(eq(messages.conversationId, id));
      msgCount += Number(mc?.count ?? 0);
    }
  }

  const [memCount] = await db
    .select({ count: count() })
    .from(memoriesTable)
    .where(eq(memoriesTable.userId, userId));

  const [noteCount] = await db
    .select({ count: count() })
    .from(notesTable)
    .where(eq(notesTable.userId, userId));

  const [reminderCount] = await db
    .select({ count: count() })
    .from(notesTable)
    .where(and(
      eq(notesTable.userId, userId),
      eq(notesTable.type, "reminder"),
      eq(notesTable.completed, false),
    ));

  res.json({
    totalConversations: Number(convCount?.count ?? 0),
    totalMessages: msgCount,
    totalMemories: Number(memCount?.count ?? 0),
    totalNotes: Number(noteCount?.count ?? 0),
    activeReminders: Number(reminderCount?.count ?? 0),
  });
});

export default router;
