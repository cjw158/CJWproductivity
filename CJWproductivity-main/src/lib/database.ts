import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;
let isInitialized = false;

export async function getDatabase(): Promise<Database> {
  if (db && isInitialized) return db;

  try {
    // 检查是否在 Tauri 环境中
    if (typeof window !== 'undefined' && !('__TAURI__' in window) && !('__TAURI_INTERNALS__' in window)) {
      throw new Error("Browser environment detected, skipping SQLite load");
    }

    db = await Database.load("sqlite:cjwproductivity.db");
    
    if (!isInitialized) {
      await initializeDatabase();
      isInitialized = true;
    }
    
    return db;
  } catch (error) {
    console.warn("Failed to load database:", error);
    throw error; // Re-throw to be handled by getDbOrMock
  }
}

async function initializeDatabase(): Promise<void> {
  if (!db) return;

  // 创建 Memos 表（参考/想法/便签）
  await db.execute(`
    CREATE TABLE IF NOT EXISTS memos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      is_pinned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // 创建 Tasks 表（可执行项）
  await db.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'INBOX',
      is_urgent INTEGER DEFAULT 0,
      is_important INTEGER DEFAULT 0,
      due_date TEXT,
      scheduled_time TEXT,
      duration INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT
    );
  `);
    
  // 创建 Settings 表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
    
  // 创建 Plans 表 (OKR 计划)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      color TEXT DEFAULT '#00FFFF',
      progress INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      start_date TEXT,
      end_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // 创建 Key Results 表 (关键结果)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS key_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      target_value REAL DEFAULT 100,
      current_value REAL DEFAULT 0,
      unit TEXT DEFAULT '%',
      progress INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
    );
  `);

  // 创建 Notes 表（三栏式笔记）
  await db.execute(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      folder_id TEXT DEFAULT 'all',
      is_pinned INTEGER DEFAULT 0,
      tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // 创建 Folders 表（笔记文件夹）
  await db.execute(`
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT DEFAULT 'Folder',
      type TEXT DEFAULT 'user',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // 插入默认系统文件夹（如果不存在）
  await db.execute(`
    INSERT OR IGNORE INTO folders (id, name, icon, type) VALUES
      ('all', '全部笔记', 'Archive', 'system'),
      ('trash', '最近删除', 'Trash2', 'system');
  `);

  // 数据库迁移 - 添加缺失的列
  try {
    await db.execute(`ALTER TABLE tasks ADD COLUMN due_date TEXT;`);
  } catch (e) { /* 列已存在 */ }
  try {
    await db.execute(`ALTER TABLE tasks ADD COLUMN scheduled_time TEXT;`);
  } catch (e) { /* 列已存在 */ }
  try {
    await db.execute(`ALTER TABLE tasks ADD COLUMN duration INTEGER;`);
  } catch (e) { /* 列已存在 */ }
  
  // 笔记软删除支持
  try {
    await db.execute(`ALTER TABLE notes ADD COLUMN deleted_at TEXT;`);
  } catch (e) { /* 列已存在 */ }

  // 创建索引
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_memos_pinned ON memos(is_pinned);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_plans_status ON plans(status);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_kr_plan ON key_results(plan_id);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder_id);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_notes_deleted ON notes(deleted_at);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_folders_type ON folders(type);`);
    
  // 初始化设置
  await db.execute(`
    INSERT OR IGNORE INTO settings (key, value) VALUES 
      ('focus_start_time', '09:00'),
      ('focus_end_time', '12:00'),
      ('admin_start_time', '14:00'),
      ('admin_end_time', '18:00'),
      ('recharge_start_time', '20:00');
  `);
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
  }
}
