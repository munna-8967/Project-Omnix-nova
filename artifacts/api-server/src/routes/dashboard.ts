import { Router, type IRouter } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { conversations, messages, memoriesTable, notesTable } from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/dashboard/stats", requireAuth(), async (req, res) => {
  const userId = getAuth(req).userId!;

  try {
    const [convCountRow] = await db
      .select({ count: count() })
      .from(conversations)
      .where(eq(conversations.userId, userId));

    const [msgCountRow] = await db
      .select({ count: count() })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(eq(conversations.userId, userId));

    const [memCountRow] = await db
      .select({ count: count() })
      .from(memoriesTable)
      .where(eq(memoriesTable.userId, userId));

    const [noteCountRow] = await db
      .select({ count: count() })
      .from(notesTable)
      .where(eq(notesTable.userId, userId));

    const [reminderCountRow] = await db
      .select({ count: count() })
      .from(notesTable)
      .where(
        and(
          eq(notesTable.userId, userId),
          eq(notesTable.type, "reminder"),
          eq(notesTable.completed, false),
        ),
      );

    res.json({
      totalConversations: Number(convCountRow?.count ?? 0),
      totalMessages: Number(msgCountRow?.count ?? 0),
      totalMemories: Number(memCountRow?.count ?? 0),
      totalNotes: Number(noteCountRow?.count ?? 0),
      activeReminders: Number(reminderCountRow?.count ?? 0),
    });
  } catch (err) {
    logger.error({ err, userId }, "Failed to load dashboard stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
