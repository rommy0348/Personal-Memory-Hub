import { Router } from "express";
import { db } from "@workspace/db";
import { memoriesTable } from "@workspace/db";
import { eq, and, ilike, or, sql } from "drizzle-orm";

const router = Router();

function computeEmotionLabel(weight: number): "calm" | "excited" | "positive" | "negative" | "neutral" {
  if (weight >= 0.8) return "excited";
  if (weight >= 0.6) return "positive";
  if (weight >= 0.4) return "calm";
  if (weight >= 0.2) return "neutral";
  return "negative";
}

function computeEmotionWeight(content: string): number {
  const positiveWords = ["好", "棒", "优秀", "成功", "开心", "喜欢", "爱", "感谢", "完成", "happy", "great", "excellent", "success", "love", "thank"];
  const negativeWords = ["坏", "差", "失败", "难", "问题", "错误", "bad", "fail", "error", "problem", "issue", "wrong", "difficult"];
  
  let score = 0.5;
  const lower = content.toLowerCase();
  
  for (const word of positiveWords) {
    if (lower.includes(word)) score += 0.08;
  }
  for (const word of negativeWords) {
    if (lower.includes(word)) score -= 0.08;
  }
  
  return Math.max(0.1, Math.min(0.95, score));
}

function extractKeywords(content: string): string[] {
  const words = content
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 1 && w.length < 20);
  
  const freq = new Map<string, number>();
  for (const w of words) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

router.get("/", async (req, res) => {
  try {
    const { folderId, search, libraryType } = req.query;

    const conditions = [];

    if (folderId) {
      conditions.push(eq(memoriesTable.folderId, Number(folderId)));
    }
    if (libraryType) {
      conditions.push(eq(memoriesTable.libraryType, libraryType as any));
    }
    if (search && typeof search === "string") {
      conditions.push(
        or(
          ilike(memoriesTable.content, `%${search}%`),
          ilike(memoriesTable.title, `%${search}%`)
        )!
      );
    }

    const memories = conditions.length > 0
      ? await db.select().from(memoriesTable).where(and(...conditions)).orderBy(sql`${memoriesTable.updatedAt} desc`)
      : await db.select().from(memoriesTable).orderBy(sql`${memoriesTable.updatedAt} desc`);

    res.json(memories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list memories" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { content, title, folderId, libraryType = "memory", keywords, emotionWeight, isImportant = false, priority, dueDate, fileType } = req.body;

    if (!content || !title) {
      return res.status(400).json({ error: "content and title are required" });
    }

    const weight = emotionWeight ?? computeEmotionWeight(content);
    const label = computeEmotionLabel(weight);
    const kws = keywords?.length ? keywords : extractKeywords(content);

    const [memory] = await db
      .insert(memoriesTable)
      .values({
        content,
        title,
        folderId: folderId ?? null,
        libraryType,
        keywords: kws,
        emotionWeight: weight,
        emotionLabel: label,
        isImportant,
        operatorType: "user",
        priority: priority ?? null,
        dueDate: dueDate ? new Date(dueDate) : null,
        fileType: fileType ?? null,
      })
      .returning();

    res.status(201).json(memory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create memory" });
  }
});

router.get("/:memoryId", async (req, res) => {
  try {
    const id = Number(req.params.memoryId);
    const [memory] = await db.select().from(memoriesTable).where(eq(memoriesTable.id, id));
    if (!memory) return res.status(404).json({ error: "Memory not found" });
    res.json(memory);
  } catch (err) {
    res.status(500).json({ error: "Failed to get memory" });
  }
});

router.put("/:memoryId", async (req, res) => {
  try {
    const id = Number(req.params.memoryId);
    const { content, title, folderId, keywords, emotionWeight, isImportant, priority, dueDate, isCompleted } = req.body;

    const existing = await db.select().from(memoriesTable).where(eq(memoriesTable.id, id));
    if (!existing.length) return res.status(404).json({ error: "Memory not found" });

    const newContent = content ?? existing[0].content;
    const weight = emotionWeight ?? computeEmotionWeight(newContent);
    const label = computeEmotionLabel(weight);
    const kws = keywords ?? extractKeywords(newContent);

    const [memory] = await db
      .update(memoriesTable)
      .set({
        content: newContent,
        title: title ?? existing[0].title,
        folderId: folderId !== undefined ? folderId : existing[0].folderId,
        keywords: kws,
        emotionWeight: weight,
        emotionLabel: label,
        isImportant: isImportant ?? existing[0].isImportant,
        priority: priority ?? existing[0].priority,
        dueDate: dueDate ? new Date(dueDate) : existing[0].dueDate,
        isCompleted: isCompleted ?? existing[0].isCompleted,
        updatedAt: new Date(),
      })
      .where(eq(memoriesTable.id, id))
      .returning();

    res.json(memory);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update memory" });
  }
});

router.delete("/:memoryId", async (req, res) => {
  try {
    const id = Number(req.params.memoryId);
    await db.delete(memoriesTable).where(eq(memoriesTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete memory" });
  }
});

export default router;
