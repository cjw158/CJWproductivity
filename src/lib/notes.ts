import { getDatabase } from "./database";
import { logger } from "./logger";

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

// ============ Mock Data ============

const mockFolders: Folder[] = [
  { id: "all", name: "全部笔记", type: "system", icon: "Archive" },
  { id: "trash", name: "最近删除", type: "system", icon: "Trash2" },
  { id: "personal", name: "个人思考", type: "user", icon: "Folder" },
  { id: "work", name: "工作记录", type: "user", icon: "Folder" },
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

// Extract title from content (simple HTML tag stripping)
export function extractTitle(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  const text = div.textContent || div.innerText || "";
  const firstLine = text.split("\n")[0].trim();
  return firstLine.substring(0, 50) || "无标题笔记";
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
  // Mock folders for now
  return mockFolders;
}

export async function getNotes(folderId: string = "all"): Promise<Note[]> {
  const db = await getDbOrMock();
  
  if (db === mockDb) {
    if (folderId === "all") {
      return mockNotes.filter(n => n.folder_id !== "trash");
    }
    return mockNotes.filter(n => n.folder_id === folderId);
  }

  // Real DB implementation
  try {
    let sql = "SELECT * FROM notes";
    const args: unknown[] = [];
    
    if (folderId === "all") {
      sql += " WHERE folder_id != 'trash'";
    } else {
      sql += " WHERE folder_id = ?";
      args.push(folderId);
    }
    
    sql += " ORDER BY is_pinned DESC, updated_at DESC";
    
    const rows = await db.select<any[]>(sql, args);
    return rows.map(row => ({
      ...row,
      is_pinned: row.is_pinned === 1,
      tags: JSON.parse(row.tags || "[]"),
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
    `INSERT INTO notes (title, content, folder_id, is_pinned, tags) VALUES (?, ?, ?, ?, ?)`,
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
    `UPDATE notes SET ${updates.join(", ")}, updated_at = datetime('now') WHERE id = ?`,
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

export async function deleteNote(id: number): Promise<void> {
  const db = await getDbOrMock();
  await db.execute("DELETE FROM notes WHERE id = ?", [id]);
}

export async function createFolder(name: string): Promise<Folder> {
  // 生成唯一 ID
  const id = `folder_${Date.now()}`;
  const newFolder: Folder = {
    id,
    name,
    type: "user",
    icon: "Folder",
  };
  mockFolders.push(newFolder);
  return newFolder;
}

export async function deleteFolder(folderId: string): Promise<void> {
  // 只能删除用户文件夹
  const folder = mockFolders.find(f => f.id === folderId);
  if (!folder || folder.type === "system") {
    throw new Error("系统文件夹不可删除");
  }
  
  // 删除文件夹内的所有笔记
  const notesToDelete = mockNotes.filter(n => n.folder_id === folderId);
  notesToDelete.forEach(note => {
    const index = mockNotes.findIndex(n => n.id === note.id);
    if (index !== -1) {
      mockNotes.splice(index, 1);
    }
  });
  
  // 删除文件夹
  const folderIndex = mockFolders.findIndex(f => f.id === folderId);
  if (folderIndex !== -1) {
    mockFolders.splice(folderIndex, 1);
  }
}
