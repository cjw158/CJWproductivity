/**
 * @file SettingsRepository.ts
 * @description 设置仓储实现
 * 
 * 支持两种模式：
 * 1. Tauri 模式：使用 SQLite 持久化
 * 2. Mock 模式：使用内存存储（用于开发/测试）
 * 
 * 特性：
 * - 自动检测运行环境
 * - 深度合并更新
 * - 版本迁移支持
 * - 完整的错误处理
 */

import type { ISettingsRepository } from "./ISettingsRepository";
import type { AppSettings, SettingsUpdate } from "@/types/settings";
import { DEFAULT_SETTINGS } from "@/types/settings";
import { logger } from "@/lib/logger";

// ============ 工具函数 ============

/**
 * 深度合并对象
 * 
 * @param target - 目标对象
 * @param source - 源对象
 * @returns 合并后的新对象
 */
function deepMerge<T>(target: T, source: Partial<T>): T {
  const result = { ...target } as T;
  
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = (target as Record<string, unknown>)[key];
      
      if (
        sourceValue !== null &&
        typeof sourceValue === "object" &&
        !Array.isArray(sourceValue) &&
        targetValue !== null &&
        typeof targetValue === "object" &&
        !Array.isArray(targetValue)
      ) {
        // 递归合并嵌套对象
        (result as Record<string, unknown>)[key] = deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        );
      } else if (sourceValue !== undefined) {
        // 直接覆盖
        (result as Record<string, unknown>)[key] = sourceValue;
      }
    }
  }
  
  return result;
}

/**
 * 验证设置对象结构
 * 
 * @param settings - 待验证的设置对象
 * @returns 是否有效
 */
function validateSettings(settings: unknown): settings is Partial<AppSettings> {
  if (typeof settings !== "object" || settings === null) {
    return false;
  }
  // 基础验证：检查是否有非法字段类型
  const obj = settings as Record<string, unknown>;
  if (obj.version !== undefined && typeof obj.version !== "number") {
    return false;
  }
  return true;
}

// ============ 仓储实现 ============

/**
 * 设置仓储实现类
 */
export class SettingsRepository implements ISettingsRepository {
  private static instance: SettingsRepository | null = null;
  private initialized = false;
  private isMock = false;
  
  // Mock 模式下的内存存储
  private mockSettings: AppSettings = { ...DEFAULT_SETTINGS };
  
  // SQLite 数据库实例
  private db: Awaited<ReturnType<typeof import("@tauri-apps/plugin-sql").default.load>> | null = null;

  /**
   * 获取单例实例
   */
  static getInstance(): SettingsRepository {
    if (!SettingsRepository.instance) {
      SettingsRepository.instance = new SettingsRepository();
    }
    return SettingsRepository.instance;
  }

  /**
   * 初始化仓储
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // 检测 Tauri 环境
    const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

    if (isTauri) {
      try {
        const Database = (await import("@tauri-apps/plugin-sql")).default;
        this.db = await Database.load("sqlite:cjwproductivity.db");
        
        // 创建设置表
        await this.db.execute(`
          CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
          )
        `);
        
        this.isMock = false;
        logger.debug("SettingsRepository: SQLite mode initialized");
      } catch (error) {
        logger.warn("SettingsRepository: Failed to init SQLite, using mock mode", error);
        this.isMock = true;
      }
    } else {
      logger.debug("SettingsRepository: Mock mode (non-Tauri environment)");
      this.isMock = true;
      
      // 尝试从 localStorage 恢复
      try {
        const stored = localStorage.getItem("cjw_settings");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (validateSettings(parsed)) {
            this.mockSettings = deepMerge(DEFAULT_SETTINGS, parsed);
          }
        }
      } catch {
        // 忽略解析错误
      }
    }

    this.initialized = true;
  }

  /**
   * 获取完整设置
   */
  async get(): Promise<AppSettings> {
    await this.initialize();

    if (this.isMock) {
      return { ...this.mockSettings };
    }

    try {
      const result = await this.db!.select<{ key: string; value: string }[]>(
        "SELECT key, value FROM settings WHERE key = 'app_settings'"
      );
      
      if (result.length > 0) {
        const parsed = JSON.parse(result[0].value);
        if (validateSettings(parsed)) {
          // 合并默认值（处理新增设置项）
          return deepMerge(DEFAULT_SETTINGS, parsed);
        }
      }
      
      return { ...DEFAULT_SETTINGS };
    } catch (error) {
      logger.error("[SettingsRepository] Failed to get settings:", error);
      return { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * 更新设置
   */
  async update(update: SettingsUpdate): Promise<AppSettings> {
    logger.debug("[SettingsRepository] update called with:", update);
    await this.initialize();
    logger.debug("[SettingsRepository] isMock:", this.isMock);

    const current = await this.get();
    const updated = deepMerge(current, update as Partial<AppSettings>);
    updated.version = DEFAULT_SETTINGS.version; // 确保版本号正确
    logger.debug("[SettingsRepository] updated settings:", updated);

    if (this.isMock) {
      this.mockSettings = updated;
      // 同步到 localStorage
      try {
        localStorage.setItem("cjw_settings", JSON.stringify(updated));
        logger.debug("[SettingsRepository] Saved to localStorage");
      } catch (e) {
        logger.error("[SettingsRepository] localStorage error:", e);
      }
      return { ...updated };
    }

    try {
      const json = JSON.stringify(updated);
      await this.db!.execute(
        `INSERT OR REPLACE INTO settings (key, value) VALUES ('app_settings', ?)`,
        [json]
      );
      logger.debug("[SettingsRepository] Saved to SQLite");
      return updated;
    } catch (error) {
      logger.error("[SettingsRepository] Failed to update settings:", error);
      throw new Error("Failed to save settings");
    }
  }

  /**
   * 重置为默认设置
   */
  async reset(): Promise<AppSettings> {
    await this.initialize();

    if (this.isMock) {
      this.mockSettings = { ...DEFAULT_SETTINGS };
      try {
        localStorage.removeItem("cjw_settings");
      } catch {
        // 忽略
      }
      return { ...DEFAULT_SETTINGS };
    }

    try {
      await this.db!.execute(
        "DELETE FROM settings WHERE key = 'app_settings'"
      );
      return { ...DEFAULT_SETTINGS };
    } catch (error) {
      logger.error("[SettingsRepository] Failed to reset settings:", error);
      throw new Error("Failed to reset settings");
    }
  }

  /**
   * 导出设置为 JSON
   */
  async export(): Promise<string> {
    const settings = await this.get();
    return JSON.stringify(settings, null, 2);
  }

  /**
   * 从 JSON 导入设置
   */
  async import(json: string): Promise<AppSettings> {
    await this.initialize(); // 确保数据库已初始化
    
    let parsed: unknown;
    
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new Error("Invalid JSON format");
    }
    
    if (!validateSettings(parsed)) {
      throw new Error("Invalid settings structure");
    }
    
    // 合并默认值以处理缺失字段
    const merged = deepMerge(DEFAULT_SETTINGS, parsed as Partial<AppSettings>);
    
    // 保存
    if (this.isMock) {
      this.mockSettings = merged;
      try {
        localStorage.setItem("cjw_settings", JSON.stringify(merged));
      } catch {
        // 忽略
      }
    } else {
      await this.db!.execute(
        `INSERT OR REPLACE INTO settings (key, value) VALUES ('app_settings', ?)`,
        [JSON.stringify(merged)]
      );
    }
    
    return merged;
  }
}

// ============ 导出 ============

export const settingsRepository = SettingsRepository.getInstance();

export async function initializeSettings(): Promise<void> {
  await settingsRepository.initialize();
}
