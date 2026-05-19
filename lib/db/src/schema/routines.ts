import { pgTable, serial, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const routinesTable = pgTable("routines", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  trigger: text("trigger").notNull().default(""),
  icon: text("icon").notNull().default("zap"),
  actions: text("actions").notNull().default("[]"),
  active: boolean("active").notNull().default(true),
  lastRun: timestamp("last_run"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRoutineSchema = createInsertSchema(routinesTable).omit({ id: true, createdAt: true });
export type InsertRoutine = z.infer<typeof insertRoutineSchema>;
export type Routine = typeof routinesTable.$inferSelect;
