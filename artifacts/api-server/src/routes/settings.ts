import { Router, type IRouter } from "express";
import { requireAuth, getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { userSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateSettingsBody } from "@workspace/api-zod";

const router: IRouter = Router();

function settingsResponse(s: typeof userSettingsTable.$inferSelect) {
  return {
    id: s.id,
    assistantName: s.assistantName,
    personality: s.personality,
    customPersonality: s.customPersonality ?? null,
    voiceEnabled: s.voiceEnabled,
    voiceGender: s.voiceGender,
    theme: s.theme,
    wakeWord: s.wakeWord,
    wakeWordEnabled: s.wakeWordEnabled,
    greetingStyle: s.greetingStyle,
    userName: s.userName,
    createdAt: s.createdAt,
  };
}

router.get("/settings", requireAuth(), async (req, res) => {
  const userId = getAuth(req).userId!;
  let settings = await db.query.userSettingsTable.findFirst({
    where: eq(userSettingsTable.userId, userId),
  });
  if (!settings) {
    const [created] = await db.insert(userSettingsTable).values({ userId }).returning();
    settings = created!;
  }
  res.json(settingsResponse(settings));
});

router.patch("/settings", requireAuth(), async (req, res) => {
  const userId = getAuth(req).userId!;
  const body = UpdateSettingsBody.parse(req.body);
  let settings = await db.query.userSettingsTable.findFirst({
    where: eq(userSettingsTable.userId, userId),
  });
  if (!settings) {
    const [created] = await db.insert(userSettingsTable).values({ userId }).returning();
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
      ...(body.wakeWord !== undefined && { wakeWord: body.wakeWord }),
      ...(body.wakeWordEnabled !== undefined && { wakeWordEnabled: body.wakeWordEnabled }),
      ...(body.greetingStyle !== undefined && { greetingStyle: body.greetingStyle }),
      ...(body.userName !== undefined && { userName: body.userName }),
    })
    .where(eq(userSettingsTable.userId, userId))
    .returning();
  res.json(settingsResponse(updated!));
});

export default router;
