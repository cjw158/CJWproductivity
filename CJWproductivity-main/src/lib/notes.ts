import { getDatabase } from "./database";
import { logger } from "./logger";
import { extractH1Title } from "@/utils";

// ============ Types ============

export interface Note {
  id: number;
  title: string;      // 笔记标题
  content: string;    // HTML 内容
  folder_id: string;  // 归属文件夹 ID ('inbox', 'trash', or custom id)
  is_pinned: boolean;
  tags: string[];     // 标签数组
  created_at: string;
  updated_at: string;
  deleted_at?: string | null; // 软删除时间，null 表示未删除
}

export interface Folder {
  id: string;
  name: string;
  icon?: string;
  type: "system" | "user"; // 系统文件夹(如全部、回收站)或用户文件夹
}

export interface CreateNoteInput {
  content: string;
  folder_id?: string;
  is_pinned?: boolean;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  folder_id?: string;
  is_pinned?: boolean;
  tags?: string[];
}

// ============ Default Folders (fallback) ============

const defaultFolders: Folder[] = [
  { id: "all", name: "全部笔记", type: "system", icon: "Archive" },
  { id: "trash", name: "最近删除", type: "system", icon: "Trash2" },
];

const mockNotes: Note[] = [
  {
    id: 1,
    title: "欢迎使用 CJW 笔记",
    content: "<h1>欢迎使用 CJW 笔记</h1><p>这是一个全新的三栏式笔记体验。</p><ul><li>左侧管理文件夹</li><li>中间浏览笔记列表</li><li>右侧专注写作</li></ul>",
    folder_id: "all",
    is_pinned: true,
    tags: ["指南", "入门"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];
let mockNoteIdCounter = 2;

// ============ Helpers ============

/**
 * 提取笔记标题 - 使用统一的 extractH1Title 函数
 * @deprecated 请直接使用 extractH1Title from "@/utils"
 */
export function extractTitle(html: string): string {
  return extractH1Title(html, "无标题笔记");
}

// Mock Database
const mockDb = {
  select: async <T>(sql: string, args?: unknown[]): Promise<T> => {
    const normalizedSql = sql.toUpperCase();
    
    if (normalizedSql.includes("SELECT * FROM NOTES")) {
      let results = [...mockNotes];
      
      // 简单的 WHERE 模拟
      if (args && args.length > 0) {
        // 这里简化处理，实际逻辑需更复杂
      }
      
      // 排序
      results.sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });

      const rows = results.map(n => ({
        ...n,
        is_pinned: n.is_pinned ? 1 : 0,
        tags: JSON.stringify(n.tags),
      }));
      
      return rows as unknown as T;
    }
    return [] as unknown as T;
  },
  
  execute: async (sql: string, args?: unknown[]): Promise<{ lastInsertId: number }> => {
    const normalizedSql = sql.trim().toUpperCase();
    
    if (normalizedSql.startsWith("INSERT INTO NOTES")) {
      const content = (args?.[1] as string) || "";
      const title = extractTitle(content);
      const newNote: Note = {
        id: mockNoteIdCounter++,
        title,
        content,
        folder_id: (args?.[2] as string) || "all",
        is_pinned: args?.[3] === 1,
        tags: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockNotes.push(newNote);
      return { lastInsertId: newNote.id };
    }
    
    if (normalizedSql.startsWith("UPDATE NOTES")) {
      const id = args?.[args.length - 1] as number;
      const index = mockNotes.findIndex(n => n.id === id);
      if (index !== -1) {
        if (args && args[0]) {
          mockNotes[index].content = args[0] as string;
          mockNotes[index].title = extractTitle(args[0] as string);
        }
        mockNotes[index].updated_at = new Date().toISOString();
      }
      return { lastInsertId: 0 };
    }

    if (normalizedSql.startsWith("DELETE FROM NOTES")) {
      const id = args?.[0];
      const index = mockNotes.findIndex(n => n.id === id);
      if (index !== -1) {
        // 真正的删除，或者移到回收站
        mockNotes.splice(index, 1);
      }
      return { lastInsertId: 0 };
    }
    
    return { lastInsertId: 0 };
  }
};

async function getDbOrMock() {
  try {
    return await getDatabase();
  } catch (e) {
    return mockDb;
  }
}

// ============ Operations ============

export async function getFolders(): Promise<Folder[]> {
  try {
    const db = await getDatabase();
    const rows = await db.select<any[]>("SELECT * FROM folders ORDER BY type ASC, created_at ASC");
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      icon: row.icon,
      type: row.type as "system" | "user",
    }));
  } catch (error) {
    logger.error("[notes] Failed to get folders from DB, using defaults:", error);
    return defaultFolders;
  }
}

export async function getNotes(folderId: string = "all"): Promise<Note[]> {
  const db = await getDbOrMock();
  
  if (db === mockDb) {
    if (folderId === "trash") {
      return mockNotes.filter(n => n.deleted_at != null);
    }
    if (folderId === "all") {
      return mockNotes.filter(n => n.deleted_at == null);
    }
    return mockNotes.filter(n => n.folder_id === folderId && n.deleted_at == null);
  }

  // Real DB implementation
  try {
    let sql = "SELECT * FROM notes";
    const args: unknown[] = [];
    
    if (folderId === "trash") {
      // 回收站：显示已删除的笔记
      sql += " WHERE deleted_at IS NOT NULL";
      sql += " ORDER BY deleted_at DESC";
    } else if (folderId === "all") {
      // 全部：只显示未删除的
      sql += " WHERE deleted_at IS NULL";
      sql += " ORDER BY is_pinned DESC, updated_at DESC";
    } else {
      // 特定文件夹：只显示未删除的
      sql += " WHERE folder_id = ? AND deleted_at IS NULL";
      args.push(folderId);
      sql += " ORDER BY is_pinned DESC, updated_at DESC";
    }
    
    const rows = await db.select<any[]>(sql, args);
    return rows.map(row => ({
      ...row,
      is_pinned: row.is_pinned === 1,
      tags: JSON.parse(row.tags || "[]"),
      deleted_at: row.deleted_at || null,
    }));
  } catch (error) {
    logger.error("[notes] Failed to get notes:", error);
    return [];
  }
}

export async function createNote(input: CreateNoteInput): Promise<Note> {
  const db = await getDbOrMock();
  const title = extractTitle(input.content);
  
  const result = await db.execute(
    `INSERT INTO notes (title, content, folder_id, is_pinned, tags, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'), datetime('now', 'localtime'))`,
    [title, input.content, input.folder_id || "all", input.is_pinned ? 1 : 0, "[]"]
  );

  if (db === mockDb) {
    return mockNotes.find(n => n.id === result.lastInsertId)!;
  }
  
  // Fetch the created note from real database
  const rows = await db.select<any[]>(
    "SELECT * FROM notes WHERE id = ?",
    [result.lastInsertId]
  );
  
  if (rows.length > 0) {
    return {
      ...rows[0],
      is_pinned: rows[0].is_pinned === 1,
      tags: JSON.parse(rows[0].tags || "[]"),
    };
  }
  
  throw new Error("Failed to create note");
}

export async function updateNote(id: number, input: UpdateNoteInput): Promise<Note> {
  const db = await getDbOrMock();
  
  const updates: string[] = [];
  const values: unknown[] = [];
  
  if (input.content) {
    updates.push("content = ?");
    values.push(input.content);
    updates.push("title = ?");
    values.push(extractTitle(input.content));
  }
  
  if (input.folder_id !== undefined) {
    updates.push("folder_id = ?");
    values.push(input.folder_id);
    // 同时更新 mock 数据
    if (db === mockDb) {
      const note = mockNotes.find(n => n.id === id);
      if (note) note.folder_id = input.folder_id;
    }
  }
  
  if (input.is_pinned !== undefined) {
    updates.push("is_pinned = ?");
    values.push(input.is_pinned ? 1 : 0);
    // 同时更新 mock 数据
    if (db === mockDb) {
      const note = mockNotes.find(n => n.id === id);
      if (note) note.is_pinned = input.is_pinned;
    }
  }
  
  if (updates.length === 0) {
    // No updates to make, just return the current note
    const rows = await db.select<any[]>("SELECT * FROM notes WHERE id = ?", [id]);
    if (rows.length > 0) {
      return { ...rows[0], is_pinned: rows[0].is_pinned === 1, tags: JSON.parse(rows[0].tags || "[]") };
    }
    throw new Error("Note not found");
  }
  
  values.push(id);
  
  await db.execute(
    `UPDATE notes SET ${updates.join(", ")}, updated_at = datetime('now', 'localtime') WHERE id = ?`,
    values
  );

  if (db === mockDb) {
    return mockNotes.find(n => n.id === id)!;
  }

  // Fetch the updated note from real database
  const rows = await db.select<any[]>("SELECT * FROM notes WHERE id = ?", [id]);
  if (rows.length > 0) {
    return { ...rows[0], is_pinned: rows[0].is_pinned === 1, tags: JSON.parse(rows[0].tags || "[]") };
  }
  
  throw new Error("Note not found after update");
}

/**
 * 软删除笔记（移到回收站）
 */
export async function deleteNote(id: number): Promise<void> {
  const db = await getDbOrMock();
  
  if (db === mockDb) {
    const note = mockNotes.find(n => n.id === id);
    if (note) {
      note.deleted_at = new Date().toISOString();
    }
    return;
  }
  
  await db.execute(
    "UPDATE notes SET deleted_at = datetime('now', 'localtime') WHERE id = ?",
    [id]
  );
  logger.debug("[notes] Soft deleted note:", id);
}

/**
 * 恢复已删除的笔记
 */
export async function restoreNote(id: number): Promise<void> {
  const db = await getDbOrMock();
  
  if (db === mockDb) {
    const note = mockNotes.find(n => n.id === id);
    if (note) {
      note.deleted_at = null;
    }
    return;
  }
  
  await db.execute(
    "UPDATE notes SET deleted_at = NULL WHERE id = ?",
    [id]
  );
  logger.debug("[notes] Restored note:", id);
}

/**
 * 永久删除笔记
 */
export async function permanentDeleteNote(id: number): Promise<void> {
  const db = await getDbOrMock();
  
  if (db === mockDb) {
    const index = mockNotes.findIndex(n => n.id === id);
    if (index !== -1) {
      mockNotes.splice(index, 1);
    }
    return;
  }
  
  await db.execute("DELETE FROM notes WHERE id = ?", [id]);
  logger.debug("[notes] Permanently deleted note:", id);
}

/**
 * 清空回收站（永久删除所有已删除的笔记）
 */
export async function emptyTrash(): Promise<number> {
  const db = await getDbOrMock();
  
  if (db === mockDb) {
    const count = mockNotes.filter(n => n.deleted_at != null).length;
    mockNotes.splice(0, mockNotes.length, ...mockNotes.filter(n => n.deleted_at == null));
    return count;
  }
  
  try {
    // 先统计数量
    const rows = await db.select<any[]>("SELECT COUNT(*) as count FROM notes WHERE deleted_at IS NOT NULL");
    const count = rows[0]?.count || 0;
    
    // 永久删除
    await db.execute("DELETE FROM notes WHERE deleted_at IS NOT NULL");
    logger.debug("[notes] Emptied trash, deleted:", count);
    return count;
  } catch (error) {
    logger.error("[notes] Failed to empty trash:", error);
    return 0;
  }
}

/**
 * 清理超过指定天数的已删除笔记
 * @param days 保留天数，默认7天
 */
export async function cleanupDeletedNotes(days: number = 7): Promise<number> {
  const db = await getDbOrMock();
  
  if (db === mockDb) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoff = cutoffDate.toISOString();
    
    const before = mockNotes.length;
    mockNotes.splice(0, mockNotes.length, ...mockNotes.filter(n => 
      n.deleted_at == null || n.deleted_at > cutoff
    ));
    return before - mockNotes.length;
  }
  
  try {
    // 先统计数量
    const rows = await db.select<any[]>(
      `SELECT COUNT(*) as count FROM notes 
       WHERE deleted_at IS NOT NULL 
       AND deleted_at < datetime('now', '-${days} days')`
    );
    const count = rows[0]?.count || 0;
    
    if (count > 0) {
      // 删除超期笔记
      await db.execute(
        `DELETE FROM notes 
         WHERE deleted_at IS NOT NULL 
         AND deleted_at < datetime('now', '-${days} days')`
      );
      logger.info(`[notes] Auto-cleaned ${count} notes older than ${days} days`);
    }
    
    return count;
  } catch (error) {
    logger.error("[notes] Failed to cleanup deleted notes:", error);
    return 0;
  }
}

export async function createFolder(name: string): Promise<Folder> {
  const id = `folder_${Date.now()}`;
  const newFolder: Folder = {
    id,
    name,
    type: "user",
    icon: "Folder",
  };
  
  try {
    const db = await getDatabase();
    await db.execute(
      "INSERT INTO folders (id, name, icon, type) VALUES (?, ?, ?, ?)",
      [id, name, "Folder", "user"]
    );
    logger.debug("[notes] Created folder:", name);
  } catch (error) {
    logger.error("[notes] Failed to create folder in DB:", error);
  }
  
  return newFolder;
}

export async function deleteFolder(folderId: string): Promise<void> {
  // 系统文件夹不可删除
  if (folderId === "all" || folderId === "trash") {
    throw new Error("系统文件夹不可删除");
  }
  
  try {
    const db = await getDatabase();
    
    // 检查是否为用户文件夹
    const folders = await db.select<any[]>(
      "SELECT * FROM folders WHERE id = ? AND type = 'user'",
      [folderId]
    );
    
    if (folders.length === 0) {
      throw new Error("系统文件夹不可删除");
    }
    
    // 将该文件夹内的笔记移到"全部"（数据保护，不删除笔记）
    await db.execute(
      "UPDATE notes SET folder_id = 'all', updated_at = datetime('now', 'localtime') WHERE folder_id = ?",
      [folderId]
    );
    logger.debug("[notes] Moved notes from folder to 'all':", folderId);
    
    // 删除文件夹
    await db.execute("DELETE FROM folders WHERE id = ?", [folderId]);
    logger.debug("[notes] Deleted folder:", folderId);
  } catch (error) {
    logger.error("[notes] Failed to delete folder:", error);
    throw error;
  }
}
