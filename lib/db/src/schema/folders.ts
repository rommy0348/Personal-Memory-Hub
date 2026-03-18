import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const foldersTable = pgTable("folders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  parentId: integer("parent_id"),
  libraryType: text("library_type", { enum: ["memory", "plan", "material"] }).notNull().default("memory"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFolderSchema = createInsertSchema(foldersTable).omit({ id: true, createdAt: true });
export type InsertFolder = z.infer<typeof insertFolderSchema>;
export type Folder = typeof foldersTable.$inferSelect;
