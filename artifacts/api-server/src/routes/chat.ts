import { Router } from "express";
import { db } from "@workspace/db";
import { chatMessagesTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

const router = Router();

router.get("/messages", async (req, res) => {
  try {
    const { folderId, conversationId } = req.query;
    let msgs;
    if (conversationId) {
      msgs = await db.select().from(chatMessagesTable).where(eq(chatMessagesTable.conversationId, Number(conversationId))).orderBy(asc(chatMessagesTable.createdAt));
    } else if (folderId) {
      msgs = await db.select().from(chatMessagesTable).where(eq(chatMessagesTable.folderId, Number(folderId))).orderBy(asc(chatMessagesTable.createdAt));
    } else {
      msgs = await db.select().from(chatMessagesTable).orderBy(asc(chatMessagesTable.createdAt));
    }
    res.json(msgs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get messages" });
  }
});

export default router;
