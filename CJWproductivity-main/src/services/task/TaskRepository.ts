/**
 * @file TaskRepository.ts
 * @description 任务仓储实现 (Hybrid: SQLite + Mock)
 * 
 * 职责:
 * 1. 管理数据持久化
 * 2. 自动处理环境切换 (Browser vs Tauri)
 * 3. 处理数据模型转换
 */

import Database from "@tauri-apps/plugin-sql";
import { ITaskRepository } from "./ITaskRepository";
import type { Task, CreateTaskInput, UpdateTaskInput, TaskStatus } from "@/types";
import { logger } from "@/lib/logger";

// ============ 内部类型定义 ============

interface TaskRow {
  id: number;
  content: string;
  status: string;
  due_date: string | null;
  scheduled_time: string | null;
  duration: number | null;
  created_at: string;
  completed_at: string | null;
}

// ============ 辅助函数 ============

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    content: row.content,
    status: row.status as TaskStatus,
    due_date: row.due_date,
    scheduled_time: row.scheduled_time,
    duration: row.duration,
    created_at: row.created_at,
    completed_at: row.completed_at,
  };
}

// ============ 实现类 ============

export class TaskRepository implements ITaskRepository {
  private db: Database | null = null;
  private isMock = false;
  private mockData: Task[] = [];
  private mockIdCounter = 1;

  constructor() {
    // 简单的 Mock 数据初始化
    this.mockData = [];
  }

  /**
   * 初始化数据库连接和 Schema
   */
  async initialize(): Promise<void> {
    if (this.db || this.isMock) return;

    try {
      // 环境检测
      if (typeof window !== 'undefined' && !('__TAURI__' in window) && !('__TAURI_INTERNALS__' in window)) {
        logger.debug("TaskRepository: Browser environment, using mock data");
        this.isMock = true;
        return;
      }

      this.db = await Database.load("sqlite:cjwproductivity.db");
      await this.migrate();
      
    } catch (error) {
      logger.warn("TaskRepository: SQLite unavailable, using mock data", error);
      this.isMock = true;
    }
  }

  /**
   * 数据库迁移/Schema 同步
   */
  private async migrate(): Promise<void> {
    if (!this.db) return;

    // 确保表结构正确 (修复了之前缺失的字段)
    await this.db.execute(`
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

    // 创建索引
    await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);`);
    await this.db.execute(`CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(due_date);`);
  }

  async getAll(): Promise<Task[]> {
    await this.initialize();

    if (this.isMock) {
      return [...this.mockData].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    const rows = await this.db!.select<TaskRow[]>(
      "SELECT * FROM tasks ORDER BY created_at DESC"
    );
    return rows.map(rowToTask);
  }

  async getById(id: number): Promise<Task | null> {
    await this.initialize();

    if (this.isMock) {
      return this.mockData.find(t => t.id === id) || null;
    }

    const rows = await this.db!.select<TaskRow[]>(
      "SELECT * FROM tasks WHERE id = ?", 
      [id]
    );
    return rows.length > 0 ? rowToTask(rows[0]) : null;
  }

  async getByStatus(status: TaskStatus): Promise<Task[]> {
    await this.initialize();

    if (this.isMock) {
      return this.mockData.filter(t => t.status === status);
    }

    const rows = await this.db!.select<TaskRow[]>(
      "SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC",
      [status]
    );
    return rows.map(rowToTask);
  }

  async create(input: CreateTaskInput): Promise<Task> {
    await this.initialize();

    const now = new Date().toISOString();

    if (this.isMock) {
      const newTask: Task = {
        id: this.mockIdCounter++,
        content: input.content,
        status: input.status || "INBOX",
        due_date: input.due_date || null,
        scheduled_time: input.scheduled_time || null,
        duration: input.duration || null,
        created_at: now,
        completed_at: null
      };
      this.mockData.push(newTask);
      return newTask;
    }

    const result = await this.db!.execute(
      `INSERT INTO tasks (content, status, due_date, scheduled_time, duration, created_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        input.content,
        input.status || "INBOX",
        input.due_date || null,
        input.scheduled_time || null,
        input.duration || null,
        now
      ]
    );

    const task = await this.getById(result.lastInsertId!);
    if (!task) throw new Error("Task creation failed");
    return task;
  }

  async update(id: number, input: UpdateTaskInput): Promise<Task> {
    await this.initialize();

    if (this.isMock) {
      const index = this.mockData.findIndex(t => t.id === id);
      if (index === -1) throw new Error("Task not found");

      const task = { ...this.mockData[index] };
      if (input.content !== undefined) task.content = input.content;
      if (input.status !== undefined) {
        task.status = input.status;
        task.completed_at = input.status === "DONE" ? new Date().toISOString() : null;
      }
      if (input.due_date !== undefined) task.due_date = input.due_date;
      if (input.scheduled_time !== undefined) task.scheduled_time = input.scheduled_time;
      if (input.duration !== undefined) task.duration = input.duration;

      this.mockData[index] = task;
      return task;
    }

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (input.content !== undefined) {
      updates.push("content = ?");
      values.push(input.content);
    }
    if (input.status !== undefined) {
      updates.push("status = ?");
      values.push(input.status);
      if (input.status === "DONE") {
        updates.push("completed_at = datetime('now')");
      } else {
        updates.push("completed_at = NULL");
      }
    }
    if (input.due_date !== undefined) {
      updates.push("due_date = ?");
      values.push(input.due_date);
    }
    if (input.scheduled_time !== undefined) {
      updates.push("scheduled_time = ?");
      values.push(input.scheduled_time);
    }
    if (input.duration !== undefined) {
      updates.push("duration = ?");
      values.push(input.duration ?? null);
    }

    if (updates.length === 0) return (await this.getById(id))!;

    values.push(id);
    await this.db!.execute(
      `UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`,
      values
    );

    return (await this.getById(id))!;
  }

  async delete(id: number): Promise<void> {
    await this.initialize();

    if (this.isMock) {
      this.mockData = this.mockData.filter(t => t.id !== id);
      return;
    }

    await this.db!.execute("DELETE FROM tasks WHERE id = ?", [id]);
  }

  async countByStatus(status: TaskStatus): Promise<number> {
    await this.initialize();

    if (this.isMock) {
      return this.mockData.filter(t => t.status === status).length;
    }

    const rows = await this.db!.select<{ count: number }[]>(
      "SELECT COUNT(*) as count FROM tasks WHERE status = ?",
      [status]
    );
    return rows[0]?.count || 0;
  }
}
