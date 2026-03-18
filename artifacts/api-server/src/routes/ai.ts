import { Router } from "express";
import { db } from "@workspace/db";
import { memoriesTable, chatMessagesTable, conversations } from "@workspace/db";
import { eq, desc, asc } from "drizzle-orm";
import OpenAI from "openai";

const router = Router();

function getOpenAIClient(req: any): OpenAI {
  const customBase = req.body?.apiBaseUrl;
  const customKey = req.body?.apiKey;
  if (customBase && customKey) {
    return new OpenAI({ baseURL: customBase, apiKey: customKey });
  }
  return new OpenAI({
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  });
}

function getModel(req: any): string {
  return req.body?.model || "gpt-5.2";
}

function computeRelevanceScore(
  memory: typeof memoriesTable.$inferSelect,
  context: string
): number {
  const ctxLower = context.toLowerCase();
  const keywords = memory.keywords as string[];
  let keywordMatch = 0;
  for (const kw of keywords) {
    if (ctxLower.includes(kw.toLowerCase())) keywordMatch += 0.15;
  }
  const contentWords = memory.content.toLowerCase().split(/\s+/);
  const ctxWords = ctxLower.split(/\s+/);
  const common = contentWords.filter(w => w.length > 1 && ctxWords.includes(w));
  const textSim = common.length / Math.max(ctxWords.length, 1);
  const daysSince = (Date.now() - new Date(memory.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
  const timeDecay = Math.max(0, 1 - daysSince / 90);
  return Math.min(1, memory.emotionWeight * 0.4 + Math.min(keywordMatch + textSim, 0.5) * 0.4 + timeDecay * 0.2);
}

// Thinking mode → system prompt modifier
function getThinkingPrompt(mode?: string, budget?: number): string {
  switch (mode) {
    case 'off':    return "\n\n[推理模式：直接输出答案，不展示推理过程。]";
    case 'light':  return "\n\n[推理模式：轻度推理，简要分析后给出答案。]";
    case 'medium': return "\n\n[推理模式：中度推理，进行清晰的分步分析。]";
    case 'heavy':  return `\n\n[推理模式：深度推理，请进行详细、全面的分析，充分展开思考过程。${budget ? `推理预算：约${budget}词。` : ''}]`;
    case 'auto':
    default:       return "";
  }
}

router.post("/chat", async (req, res) => {
  try {
    const {
      message, folderId, useMemories = true,
      conversationId, thinkingMode, thinkingBudget
    } = req.body;

    if (!message) return res.status(400).json({ error: "message is required" });

    // Ensure conversation exists
    let convId: number | null = conversationId ?? null;
    if (!convId) {
      const title = message.length > 30 ? message.slice(0, 30) + "…" : message;
      const [conv] = await db.insert(conversations).values({ title }).returning();
      convId = conv.id;
    } else {
      await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, convId));
    }

    // Save user message
    const [savedUser] = await db.insert(chatMessagesTable).values({
      role: "user",
      content: message,
      folderId: folderId ?? null,
      conversationId: convId,
    }).returning();

    // Retrieve relevant memories
    let usedMemories: typeof memoriesTable.$inferSelect[] = [];
    let memoryContext = "";

    if (useMemories) {
      const allMems = folderId
        ? await db.select().from(memoriesTable).where(eq(memoriesTable.folderId, folderId)).orderBy(desc(memoriesTable.updatedAt)).limit(50)
        : await db.select().from(memoriesTable).orderBy(desc(memoriesTable.updatedAt)).limit(100);

      usedMemories = allMems
        .map(m => ({ m, s: computeRelevanceScore(m, message) }))
        .filter(({ s }) => s > 0.1)
        .sort((a, b) => b.s - a.s)
        .slice(0, 5)
        .map(({ m }) => m);

      if (usedMemories.length > 0) {
        memoryContext = `\n\n以下是用户的相关记忆片段，请参考：\n${usedMemories.map((m, i) => `[记忆${i + 1}] ${m.title}: ${m.content}`).join("\n")}`;
      }
    }

    // Build conversation history (last 20 messages for context)
    const history = await db
      .select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.conversationId, convId))
      .orderBy(asc(chatMessagesTable.createdAt))
      .limit(21); // +1 for the just-inserted user msg

    const systemPrompt =
      `你是一个智能AI助手，具备跨对话的记忆管理能力。你能帮助用户组织和管理他们的个人记忆、计划和资料。` +
      `你的回答应该简洁有力、逻辑清晰，善用 Markdown 格式（适当使用标题、列表、代码块、加粗、表格、引用块、任务列表等）来提升可读性。请用中文回答。` +
      getThinkingPrompt(thinkingMode, thinkingBudget) +
      memoryContext;

    const openai = getOpenAIClient(req);
    const model = getModel(req);

    const historyMsgs = history
      .slice(0, -1) // exclude just-inserted user message (already included below)
      .map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...historyMsgs,
        { role: "user", content: message },
      ],
      max_completion_tokens: thinkingBudget && thinkingMode === 'heavy' ? Math.max(4096, thinkingBudget * 2) : 8192,
    } as any);

    const reply = completion.choices[0]?.message?.content ?? "抱歉，我无法处理您的请求。";

    await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, convId));

    const [savedMsg] = await db.insert(chatMessagesTable).values({
      role: "assistant",
      content: reply,
      folderId: folderId ?? null,
      conversationId: convId,
    }).returning();

    res.json({ reply, usedMemories, newMemoryCreated: false, messageId: savedMsg.id, conversationId: convId });
  } catch (err: any) {
    console.error("AI chat error:", err?.message || err);
    res.status(500).json({ error: "Failed to process chat message" });
  }
});

router.post("/memories/retrieve", async (req, res) => {
  try {
    const { context, topK = 5, folderId } = req.body;
    if (!context) return res.status(400).json({ error: "context is required" });
    const allMems = folderId
      ? await db.select().from(memoriesTable).where(eq(memoriesTable.folderId, folderId))
      : await db.select().from(memoriesTable);
    const scored = allMems
      .map(m => ({ memory: m, score: computeRelevanceScore(m, context) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
    res.json({ memories: scored.map(({ memory, score }) => ({ memoryId: memory.id, content: memory.content, title: memory.title, relevanceScore: score, emotionWeight: memory.emotionWeight })) });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve memories" });
  }
});

export default router;
