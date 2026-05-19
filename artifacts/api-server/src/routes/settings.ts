import { Router, type IRouter } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { userSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateSettingsBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/settings", requireAuth(), async (req, res) => {
  const userId = getAuth(req).userId!;
  let settings = await db.query.userSettingsTable.findFirst({
    where: eq(userSettingsTable.userId, userId),
  });
  if (!settings) {
    const [created] = await db
      .insert(userSettingsTable)
      .values({ userId })
      .returning();
    settings = created!;
  }
  res.json({
    id: settings.id,
    assistantName: settings.assistantName,
    personality: settings.personality,
    customPersonality: settings.customPersonality ?? null,
    voiceEnabled: settings.voiceEnabled,
    voiceGender: settings.voiceGender,
    theme: settings.theme,
    createdAt: settings.createdAt,
  });
});

router.patch("/settings", requireAuth(), async (req, res) => {
  const userId = getAuth(req).userId!;
  const body = UpdateSettingsBody.parse(req.body);
  let settings = await db.query.userSettingsTable.findFirst({
    where: eq(userSettingsTable.userId, userId),
  });
  if (!settings) {
    const [created] = await db
      .insert(userSettingsTable)
      .values({ userId })
      .returning();
    settings = created!;
  }
  const [updated] = await db
    .update(userSettingsTable)
    .set({
      ...(body.assistantName !== undefined && { assistantName: body.assistantName }),
      ...(body.personality !== undefined && { personality: body.personality }),
      ...(body.customPersonality !== undefined && { customPersonality: body.customPersonality }),
      ...(body.voiceEnabled !== undefined && { voiceEnabled: body.voiceEnabled }),
      ...(body.voiceGender !== undefined && { voiceGender: body.voiceGender }),
      ...(body.theme !== undefined && { theme: body.theme }),
    })
    .where(eq(userSettingsTable.userId, userId))
    .returning();
  res.json({
    id: updated!.id,
    assistantName: updated!.assistantName,
    personality: updated!.personality,
    customPersonality: updated!.customPersonality ?? null,
    voiceEnabled: updated!.voiceEnabled,
    voiceGender: updated!.voiceGender,
    theme: updated!.theme,
    createdAt: updated!.createdAt,
  });
});

export default router;
