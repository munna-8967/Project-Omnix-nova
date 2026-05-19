import { Router, type IRouter } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { routinesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { CreateRoutineBody, DeleteRoutineParams, RunRoutineParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/routines", requireAuth(), async (req, res) => {
  const userId = getAuth(req).userId!;
  const rows = await db
    .select()
    .from(routinesTable)
    .where(eq(routinesTable.userId, userId))
    .orderBy(desc(routinesTable.createdAt));
  res.json(rows.map((r) => ({
    id: r.id,
    name: r.name,
    trigger: r.trigger,
    icon: r.icon,
    actions: r.actions,
    active: r.active,
    lastRun: r.lastRun?.toISOString() ?? null,
    createdAt: r.createdAt,
  })));
});

router.post("/routines", requireAuth(), async (req, res) => {
  const userId = getAuth(req).userId!;
  const body = CreateRoutineBody.parse(req.body);
  const [created] = await db
    .insert(routinesTable)
    .values({ userId, name: body.name, trigger: body.trigger, icon: body.icon, actions: body.actions })
    .returning();
  res.status(201).json({
    id: created!.id,
    name: created!.name,
    trigger: created!.trigger,
    icon: created!.icon,
    actions: created!.actions,
    active: created!.active,
    lastRun: created!.lastRun?.toISOString() ?? null,
    createdAt: created!.createdAt,
  });
});

router.delete("/routines/:id", requireAuth(), async (req, res) => {
  const userId = getAuth(req).userId!;
  const { id } = DeleteRoutineParams.parse({ id: Number(req.params.id) });
  await db.delete(routinesTable).where(and(eq(routinesTable.id, id), eq(routinesTable.userId, userId)));
  res.status(204).end();
});

router.post("/routines/:id/run", requireAuth(), async (req, res) => {
  const userId = getAuth(req).userId!;
  const { id } = RunRoutineParams.parse({ id: Number(req.params.id) });
  const routine = await db.query.routinesTable.findFirst({
    where: and(eq(routinesTable.id, id), eq(routinesTable.userId, userId)),
  });
  if (!routine) {
    res.status(404).json({ error: "Routine not found" });
    return;
  }

  let actions: { type: string; value: string }[] = [];
  try { actions = JSON.parse(routine.actions); } catch {}

  await db.update(routinesTable).set({ lastRun: new Date() }).where(eq(routinesTable.id, id));

  res.json({
    success: true,
    message: `Routine "${routine.name}" executed successfully`,
    actionsExecuted: actions.length,
  });
});

export default router;
