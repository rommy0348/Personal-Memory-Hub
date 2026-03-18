import { Router } from "express";
import { db } from "@workspace/db";
import { conversations, chatMessagesTable } from "@workspace/db";
import { eq, desc, asc, lte } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const list = await db
      .select()
      .from(conversations)
      .orderBy(desc(conversations.updatedAt));
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title = "新对话" } = req.body;
    const [conv] = await db.insert(conversations).values({ title }).returning();
    res.status(201).json(conv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title } = req.body;
    const [conv] = await db
      .update(conversations)
      .set({ title, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    res.json(conv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update conversation" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(chatMessagesTable).where(eq(chatMessagesTable.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

router.get("/:id/messages", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const msgs = await db
      .select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.conversationId, id))
      .orderBy(asc(chatMessagesTable.createdAt));
    res.json(msgs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get messages" });
  }
});

// Branch: create new conversation with all messages up to (and including) given messageId
router.post("/branch", async (req, res) => {
  try {
    const { conversationId, upToMessageId, title = "分支对话" } = req.body;

    const upToMsg = await db
      .select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.id, Number(upToMessageId)))
      .limit(1);

    if (!upToMsg[0]) return res.status(404).json({ error: "Message not found" });

    const sourceMsgs = await db
      .select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.conversationId, Number(conversationId)))
      .orderBy(asc(chatMessagesTable.createdAt));

    const cutIdx = sourceMsgs.findIndex(m => m.id === Number(upToMessageId));
    const toClone = cutIdx >= 0 ? sourceMsgs.slice(0, cutIdx + 1) : sourceMsgs;

    const [newConv] = await db.insert(conversations).values({ title }).returning();

    if (toClone.length > 0) {
      await db.insert(chatMessagesTable).values(
        toClone.map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content,
          conversationId: newConv.id,
          folderId: m.folderId,
        }))
      );
    }

    res.status(201).json(newConv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to branch conversation" });
  }
});

// Toggle star on a message
router.patch("/messages/:id/star", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { isStarred } = req.body;
    const [msg] = await db
      .update(chatMessagesTable)
      .set({ isStarred })
      .where(eq(chatMessagesTable.id, id))
      .returning();
    res.json(msg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to star message" });
  }
});

export default router;
