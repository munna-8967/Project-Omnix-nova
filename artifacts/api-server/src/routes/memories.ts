import { Router, type IRouter } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { memoriesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { CreateMemoryBody, DeleteMemoryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/memories", requireAuth(), async (req, res) => {
  const userId = getAuth(req).userId!;
  const rows = await db
    .select()
    .from(memoriesTable)
    .where(eq(memoriesTable.userId, userId))
    .orderBy(desc(memoriesTable.createdAt));
  res.json(rows.map((m) => ({ id: m.id, content: m.content, category: m.category, createdAt: m.createdAt })));
});

router.post("/memories", requireAuth(), async (req, res) => {
  const userId = getAuth(req).userId!;
  const body = CreateMemoryBody.parse(req.body);
  const [created] = await db
    .insert(memoriesTable)
    .values({ userId, content: body.content, category: body.category })
    .returning();
  res.status(201).json({ id: created!.id, content: created!.content, category: created!.category, createdAt: created!.createdAt });
});

router.delete("/memories/:id", requireAuth(), async (req, res) => {
  const userId = getAuth(req).userId!;
  const { id } = DeleteMemoryParams.parse({ id: Number(req.params.id) });
  await db
    .delete(memoriesTable)
    .where(and(eq(memoriesTable.id, id), eq(memoriesTable.userId, userId)));
  res.status(204).end();
});

export default router;
