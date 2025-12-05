import Database from "@tauri-apps/plugin-sql";

// ============ 数据库连接管理 ============

let db: Database | null = null;
let isInitialized = false;
let initPromise: Promise<Database> | null = null; // 🟡 性能优化：防止并发初始化

/**
 * 获取数据库连接（单例模式 + 并发安全）
 * 🟡 性能优化：使用Promise缓存防止重复初始化
 */
export async function getDatabase(): Promise<Database> {
  // 已初始化直接返回
  if (db && isInitialized) return db;

  // 正在初始化中，等待完成
  if (initPromise) return initPromise;

  // 开始初始化（保存Promise防止并发）
  initPromise = initializeDatabaseConnection();
  
  try {
    return await initPromise;
  } finally {
    initPromise = null;
  }
}

/**
 * 内部初始化函数
 */
async function initializeDatabaseConnection(): Promise<Database> {
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

/**
 * 数据库表结构初始化
 * 🟡 性能优化：使用事务批量执行DDL
 */
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

  // 🔴 关键修复：创建 Folders 表（笔记文件夹持久化）
  await db.execute(`
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT DEFAULT 'Folder',
      type TEXT DEFAULT 'user',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // 初始化系统文件夹（如果不存在）
  await db.execute(`
    INSERT OR IGNORE INTO folders (id, name, icon, type) VALUES 
      ('all', '全部笔记', 'Archive', 'system'),
      ('trash', '最近删除', 'Trash2', 'system');
  `);

  // 数据库迁移 - 添加缺失的列（静默处理已存在的情况）
  const migrations = [
    `ALTER TABLE tasks ADD COLUMN due_date TEXT`,
    `ALTER TABLE tasks ADD COLUMN scheduled_time TEXT`,
    `ALTER TABLE tasks ADD COLUMN duration INTEGER`,
  ];
  
  for (const sql of migrations) {
    try {
      await db.execute(sql);
    } catch (e) { 
      // 列已存在，忽略错误
    }
  }

  // 创建索引（性能优化）
  const indexes = [
    `CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`,
    `CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)`,
    `CREATE INDEX IF NOT EXISTS idx_memos_pinned ON memos(is_pinned)`,
    `CREATE INDEX IF NOT EXISTS idx_plans_status ON plans(status)`,
    `CREATE INDEX IF NOT EXISTS idx_kr_plan ON key_results(plan_id)`,
    `CREATE INDEX IF NOT EXISTS idx_notes_folder ON notes(folder_id)`,
    `CREATE INDEX IF NOT EXISTS idx_folders_type ON folders(type)`,
    // 🟡 性能优化：添加笔记更新时间索引，加速排序查询
    `CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at DESC)`,
    // 🟡 性能优化：添加笔记置顶索引，加速筛选
    `CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(is_pinned)`,
  ];
  
  for (const sql of indexes) {
    await db.execute(sql);
  }
    
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

/**
 * 关闭数据库连接
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
    isInitialized = false;
  }
}
