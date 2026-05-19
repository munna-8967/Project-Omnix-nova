import { Router, type IRouter } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { notesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { CreateNoteBody, UpdateNoteParams, UpdateNoteBody, DeleteNoteParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/notes", requireAuth(), async (req, res) => {
  const userId = getAuth(req).userId!;
  const rows = await db
    .select()
    .from(notesTable)
    .where(eq(notesTable.userId, userId))
    .orderBy(desc(notesTable.createdAt));
  res.json(rows.map((n) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    type: n.type,
    completed: n.completed,
    reminderAt: n.reminderAt?.toISOString() ?? null,
    createdAt: n.createdAt,
  })));
});

router.post("/notes", requireAuth(), async (req, res) => {
  const userId = getAuth(req).userId!;
  const body = CreateNoteBody.parse(req.body);
  const [created] = await db
    .insert(notesTable)
    .values({
      userId,
      title: body.title,
      content: body.content,
      type: body.type,
      reminderAt: body.reminderAt ? new Date(body.reminderAt) : undefined,
    })
    .returning();
  res.status(201).json({
    id: created!.id,
    title: created!.title,
    content: created!.content,
    type: created!.type,
    completed: created!.completed,
    reminderAt: created!.reminderAt?.toISOString() ?? null,
    createdAt: created!.createdAt,
  });
});

router.patch("/notes/:id", requireAuth(), async (req, res) => {
  const userId = getAuth(req).userId!;
  const { id } = UpdateNoteParams.parse({ id: Number(req.params.id) });
  const body = UpdateNoteBody.parse(req.body);
  const [updated] = await db
    .update(notesTable)
    .set({
      ...(body.title !== undefined && { title: body.title }),
      ...(body.content !== undefined && { content: body.content }),
      ...(body.completed !== undefined && { completed: body.completed }),
      ...(body.reminderAt !== undefined && { reminderAt: body.reminderAt ? new Date(body.reminderAt) : null }),
    })
    .where(and(eq(notesTable.id, id), eq(notesTable.userId, userId)))
    .returning();
  res.json({
    id: updated!.id,
    title: updated!.title,
    content: updated!.content,
    type: updated!.type,
    completed: updated!.completed,
    reminderAt: updated!.reminderAt?.toISOString() ?? null,
    createdAt: updated!.createdAt,
  });
});

router.delete("/notes/:id", requireAuth(), async (req, res) => {
  const userId = getAuth(req).userId!;
  const { id } = DeleteNoteParams.parse({ id: Number(req.params.id) });
  await db
    .delete(notesTable)
    .where(and(eq(notesTable.id, id), eq(notesTable.userId, userId)));
  res.status(204).end();
});

export default router;
