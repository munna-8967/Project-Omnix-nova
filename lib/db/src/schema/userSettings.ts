import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userSettingsTable = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  assistantName: text("assistant_name").notNull().default("OmniNova"),
  personality: text("personality").notNull().default("omni"),
  customPersonality: text("custom_personality"),
  voiceEnabled: boolean("voice_enabled").notNull().default(true),
  voiceGender: text("voice_gender").notNull().default("alloy"),
  theme: text("theme").notNull().default("violet"),
  wakeWord: text("wake_word").notNull().default("Hey Omni"),
  wakeWordEnabled: boolean("wake_word_enabled").notNull().default(true),
  greetingStyle: text("greeting_style").notNull().default("friendly"),
  userName: text("user_name").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSettingsSchema = createInsertSchema(userSettingsTable).omit({ id: true, createdAt: true });
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettingsTable.$inferSelect;
