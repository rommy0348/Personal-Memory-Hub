import { Router } from "express";
import { db } from "@workspace/db";
import { foldersTable, memoriesTable } from "@workspace/db";
import { eq, sql, isNull } from "drizzle-orm";

const router = Router();

async function buildFolderTree(folders: typeof foldersTable.$inferSelect[]) {
  const folderMap = new Map<number, any>();
  const roots: any[] = [];

  for (const folder of folders) {
    const count = await db
      .select({ count: sql<number>`count(*)` })
      .from(memoriesTable)
      .where(eq(memoriesTable.folderId, folder.id));

    folderMap.set(folder.id, { ...folder, children: [], memoryCount: Number(count[0].count) });
  }

  for (const [id, folder] of folderMap) {
    if (folder.parentId && folderMap.has(folder.parentId)) {
      folderMap.get(folder.parentId).children.push(folder);
    } else {
      roots.push(folder);
    }
  }

  return roots;
}

router.get("/", async (_req, res) => {
  try {
    const folders = await db.select().from(foldersTable).orderBy(foldersTable.createdAt);
    const tree = await buildFolderTree(folders);
    res.json(tree);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to list folders" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, parentId, libraryType = "memory" } = req.body;
    if (!name) return res.status(400).json({ error: "name is required" });

    const [folder] = await db
      .insert(foldersTable)
      .values({ name, parentId: parentId ?? null, libraryType })
      .returning();

    res.status(201).json({ ...folder, children: [], memoryCount: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create folder" });
  }
});

router.get("/:folderId", async (req, res) => {
  try {
    const id = Number(req.params.folderId);
    const [folder] = await db.select().from(foldersTable).where(eq(foldersTable.id, id));
    if (!folder) return res.status(404).json({ error: "Folder not found" });
    res.json({ ...folder, children: [], memoryCount: 0 });
  } catch (err) {
    res.status(500).json({ error: "Failed to get folder" });
  }
});

router.put("/:folderId", async (req, res) => {
  try {
    const id = Number(req.params.folderId);
    const { name, parentId } = req.body;
    const [folder] = await db
      .update(foldersTable)
      .set({ name, parentId: parentId ?? null })
      .where(eq(foldersTable.id, id))
      .returning();

    if (!folder) return res.status(404).json({ error: "Folder not found" });
    res.json({ ...folder, children: [], memoryCount: 0 });
  } catch (err) {
    res.status(500).json({ error: "Failed to update folder" });
  }
});

router.delete("/:folderId", async (req, res) => {
  try {
    const id = Number(req.params.folderId);
    await db.delete(foldersTable).where(eq(foldersTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete folder" });
  }
});

export default router;
