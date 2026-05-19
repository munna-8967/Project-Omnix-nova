import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userSettingsTable = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  assistantName: text("assistant_name").notNull().default("JARVIS"),
  personality: text("personality").notNull().default("jarvis"),
  customPersonality: text("custom_personality"),
  voiceEnabled: boolean("voice_enabled").notNull().default(true),
  voiceGender: text("voice_gender").notNull().default("male"),
  theme: text("theme").notNull().default("blue"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSettingsSchema = createInsertSchema(userSettingsTable).omit({ id: true, createdAt: true });
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettingsTable.$inferSelect;
