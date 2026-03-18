import { pgTable, serial, text, integer, timestamp, real, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const memoriesTable = pgTable("memories", {
  id: serial("id").primaryKey(),
  folderId: integer("folder_id"),
  title: text("title").notNull(),
  content: text("content").notNull(),
  emotionWeight: real("emotion_weight").notNull().default(0.5),
  emotionLabel: text("emotion_label", { enum: ["calm", "excited", "positive", "negative", "neutral"] }).notNull().default("neutral"),
  keywords: json("keywords").$type<string[]>().notNull().default([]),
  libraryType: text("library_type", { enum: ["memory", "plan", "material"] }).notNull().default("memory"),
  operatorType: text("operator_type", { enum: ["user", "ai"] }).notNull().default("user"),
  isImportant: boolean("is_important").notNull().default(false),
  priority: integer("priority"),
  dueDate: timestamp("due_date"),
  isCompleted: boolean("is_completed"),
  fileType: text("file_type"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMemorySchema = createInsertSchema(memoriesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMemory = z.infer<typeof insertMemorySchema>;
export type Memory = typeof memoriesTable.$inferSelect;
