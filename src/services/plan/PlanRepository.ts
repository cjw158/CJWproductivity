/**
 * @file PlanRepository.ts
 * @description 计划仓储实现
 * 
 * 支持两种存储模式:
 * - SQLite: Tauri 桌面环境
 * - Mock: 浏览器开发环境
 */

import Database from "@tauri-apps/plugin-sql";
import type { IPlanRepository } from "./IPlanRepository";
import type {
  Plan,
  KeyResult,
  CreatePlanInput,
  UpdatePlanInput,
  CreateKeyResultInput,
  UpdateKeyResultInput,
  PlanStatus,
} from "@/types";

// ============ 默认值 ============

const DEFAULT_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

function getRandomColor(): string {
  return DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];
}

function getNow(): string {
  return new Date().toISOString();
}

// ============ Repository 实现 ============

export class PlanRepository implements IPlanRepository {
  private db: Database | null = null;
  private isMock = false;
  private isInitialized = false;

  // Mock 存储
  private mockPlans: Plan[] = [];
  private mockKeyResults: KeyResult[] = [];
  private mockPlanIdCounter = 1;
  private mockKRIdCounter = 1;

  // ============ 初始化 ============

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 检测环境
      if (typeof window !== "undefined" && 
          !("__TAURI__" in window) && 
          !("__TAURI_INTERNALS__" in window)) {
        console.info("[PlanRepository] Browser environment, using Mock");
        this.isMock = true;
        this.isInitialized = true;
        return;
      }

      // Tauri 环境，使用 SQLite
      this.db = await Database.load("sqlite:cjwproductivity.db");
      await this.initTables();
      this.isInitialized = true;
      console.info("[PlanRepository] SQLite initialized");
    } catch (error) {
      console.warn("[PlanRepository] SQLite failed, using Mock:", error);
      this.isMock = true;
      this.isInitialized = true;
    }
  }

  private async initTables(): Promise<void> {
    if (!this.db) return;

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#3B82F6',
        progress REAL DEFAULT 0,
        status TEXT DEFAULT 'active',
        start_date TEXT,
        end_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS key_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        target_value REAL DEFAULT 100,
        current_value REAL DEFAULT 0,
        unit TEXT DEFAULT '%',
        progress REAL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
      )
    `);
  }

  // ============ Plan CRUD ============

  async getAllPlans(): Promise<Plan[]> {
    if (this.isMock) {
      return [...this.mockPlans];
    }

    const rows = await this.db!.select<Plan[]>(
      "SELECT * FROM plans ORDER BY created_at DESC"
    );
    return rows;
  }

  async getPlansByStatus(status: PlanStatus): Promise<Plan[]> {
    if (this.isMock) {
      return this.mockPlans.filter(p => p.status === status);
    }

    const rows = await this.db!.select<Plan[]>(
      "SELECT * FROM plans WHERE status = ? ORDER BY created_at DESC",
      [status]
    );
    return rows;
  }

  async getPlanById(id: number): Promise<Plan | null> {
    if (this.isMock) {
      return this.mockPlans.find(p => p.id === id) || null;
    }

    const rows = await this.db!.select<Plan[]>(
      "SELECT * FROM plans WHERE id = ?",
      [id]
    );
    return rows[0] || null;
  }

  async createPlan(input: CreatePlanInput): Promise<Plan> {
    const now = getNow();
    const color = input.color || getRandomColor();

    if (this.isMock) {
      const plan: Plan = {
        id: this.mockPlanIdCounter++,
        title: input.title,
        description: input.description || null,
        color,
        progress: 0,
        status: "active",
        start_date: input.start_date || null,
        end_date: input.end_date || null,
        created_at: now,
        updated_at: now,
      };
      this.mockPlans.push(plan);
      return plan;
    }

    const result = await this.db!.execute(
      `INSERT INTO plans (title, description, color, start_date, end_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [input.title, input.description || null, color, input.start_date || null, input.end_date || null, now, now]
    );

    return this.getPlanById(result.lastInsertId as number) as Promise<Plan>;
  }

  async updatePlan(id: number, input: UpdatePlanInput): Promise<Plan> {
    const now = getNow();

    if (this.isMock) {
      const index = this.mockPlans.findIndex(p => p.id === id);
      if (index === -1) throw new Error("Plan not found");
      
      this.mockPlans[index] = {
        ...this.mockPlans[index],
        ...input,
        updated_at: now,
      };
      return this.mockPlans[index];
    }

    const sets: string[] = ["updated_at = ?"];
    const values: unknown[] = [now];

    if (input.title !== undefined) { sets.push("title = ?"); values.push(input.title); }
    if (input.description !== undefined) { sets.push("description = ?"); values.push(input.description); }
    if (input.color !== undefined) { sets.push("color = ?"); values.push(input.color); }
    if (input.status !== undefined) { sets.push("status = ?"); values.push(input.status); }
    if (input.start_date !== undefined) { sets.push("start_date = ?"); values.push(input.start_date); }
    if (input.end_date !== undefined) { sets.push("end_date = ?"); values.push(input.end_date); }

    values.push(id);
    await this.db!.execute(`UPDATE plans SET ${sets.join(", ")} WHERE id = ?`, values);

    return this.getPlanById(id) as Promise<Plan>;
  }

  async deletePlan(id: number): Promise<void> {
    if (this.isMock) {
      this.mockPlans = this.mockPlans.filter(p => p.id !== id);
      this.mockKeyResults = this.mockKeyResults.filter(kr => kr.plan_id !== id);
      return;
    }

    await this.db!.execute("DELETE FROM plans WHERE id = ?", [id]);
  }

  // ============ KeyResult CRUD ============

  async getKeyResultsByPlanId(planId: number): Promise<KeyResult[]> {
    if (this.isMock) {
      return this.mockKeyResults.filter(kr => kr.plan_id === planId);
    }

    const rows = await this.db!.select<KeyResult[]>(
      "SELECT * FROM key_results WHERE plan_id = ? ORDER BY created_at ASC",
      [planId]
    );
    return rows;
  }

  async createKeyResult(input: CreateKeyResultInput): Promise<KeyResult> {
    const now = getNow();

    if (this.isMock) {
      const kr: KeyResult = {
        id: this.mockKRIdCounter++,
        plan_id: input.plan_id,
        title: input.title,
        target_value: input.target_value,
        current_value: 0,
        unit: input.unit || "%",
        progress: 0,
        created_at: now,
        updated_at: now,
      };
      this.mockKeyResults.push(kr);
      await this.recalculatePlanProgress(input.plan_id);
      return kr;
    }

    const result = await this.db!.execute(
      `INSERT INTO key_results (plan_id, title, target_value, unit, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [input.plan_id, input.title, input.target_value, input.unit || "%", now, now]
    );

    await this.recalculatePlanProgress(input.plan_id);

    const rows = await this.db!.select<KeyResult[]>(
      "SELECT * FROM key_results WHERE id = ?",
      [result.lastInsertId]
    );
    return rows[0];
  }

  async updateKeyResult(id: number, input: UpdateKeyResultInput): Promise<KeyResult> {
    const now = getNow();

    if (this.isMock) {
      const index = this.mockKeyResults.findIndex(kr => kr.id === id);
      if (index === -1) throw new Error("KeyResult not found");
      
      const kr = this.mockKeyResults[index];
      const newCurrentValue = input.current_value ?? kr.current_value;
      const newTargetValue = input.target_value ?? kr.target_value;
      const newProgress = newTargetValue > 0 ? (newCurrentValue / newTargetValue) * 100 : 0;

      this.mockKeyResults[index] = {
        ...kr,
        ...input,
        progress: Math.min(100, newProgress),
        updated_at: now,
      };

      await this.recalculatePlanProgress(kr.plan_id);
      return this.mockKeyResults[index];
    }

    // 先获取当前 KR
    const current = await this.db!.select<KeyResult[]>(
      "SELECT * FROM key_results WHERE id = ?",
      [id]
    );
    if (!current[0]) throw new Error("KeyResult not found");

    const newCurrentValue = input.current_value ?? current[0].current_value;
    const newTargetValue = input.target_value ?? current[0].target_value;
    const newProgress = newTargetValue > 0 ? (newCurrentValue / newTargetValue) * 100 : 0;

    const sets: string[] = ["updated_at = ?", "progress = ?"];
    const values: unknown[] = [now, Math.min(100, newProgress)];

    if (input.title !== undefined) { sets.push("title = ?"); values.push(input.title); }
    if (input.target_value !== undefined) { sets.push("target_value = ?"); values.push(input.target_value); }
    if (input.current_value !== undefined) { sets.push("current_value = ?"); values.push(input.current_value); }
    if (input.unit !== undefined) { sets.push("unit = ?"); values.push(input.unit); }

    values.push(id);
    await this.db!.execute(`UPDATE key_results SET ${sets.join(", ")} WHERE id = ?`, values);

    await this.recalculatePlanProgress(current[0].plan_id);

    const rows = await this.db!.select<KeyResult[]>(
      "SELECT * FROM key_results WHERE id = ?",
      [id]
    );
    return rows[0];
  }

  async deleteKeyResult(id: number): Promise<void> {
    if (this.isMock) {
      const kr = this.mockKeyResults.find(k => k.id === id);
      if (kr) {
        this.mockKeyResults = this.mockKeyResults.filter(k => k.id !== id);
        await this.recalculatePlanProgress(kr.plan_id);
      }
      return;
    }

    const current = await this.db!.select<KeyResult[]>(
      "SELECT plan_id FROM key_results WHERE id = ?",
      [id]
    );

    await this.db!.execute("DELETE FROM key_results WHERE id = ?", [id]);

    if (current[0]) {
      await this.recalculatePlanProgress(current[0].plan_id);
    }
  }

  // ============ 聚合操作 ============

  async recalculatePlanProgress(planId: number): Promise<number> {
    const keyResults = await this.getKeyResultsByPlanId(planId);
    
    if (keyResults.length === 0) {
      if (this.isMock) {
        const plan = this.mockPlans.find(p => p.id === planId);
        if (plan) plan.progress = 0;
      } else {
        await this.db!.execute("UPDATE plans SET progress = 0 WHERE id = ?", [planId]);
      }
      return 0;
    }

    const avgProgress = keyResults.reduce((sum, kr) => sum + kr.progress, 0) / keyResults.length;
    const roundedProgress = Math.round(avgProgress * 10) / 10;

    if (this.isMock) {
      const plan = this.mockPlans.find(p => p.id === planId);
      if (plan) plan.progress = roundedProgress;
    } else {
      await this.db!.execute(
        "UPDATE plans SET progress = ?, updated_at = ? WHERE id = ?",
        [roundedProgress, getNow(), planId]
      );
    }

    return roundedProgress;
  }
}
