/**
 * @file env.ts
 * @description 环境配置中心
 * 
 * 设计原则:
 * - 集中管理所有可配置参数
 * - 支持环境变量覆盖
 * - 类型安全
 * 
 * 使用方式:
 * ```ts
 * import { env } from '@/config/env';
 * console.log(env.APP_NAME);
 * ```
 */

// ============ 应用信息 ============

export const APP_INFO = {
  /** 应用名称 */
  NAME: "CJWproductivity",
  /** 应用版本 */
  VERSION: "0.1.0",
  /** 应用标识符 */
  IDENTIFIER: "com.cjwproductivity.app",
} as const;

// ============ 数据库配置 ============

export const DATABASE_CONFIG = {
  /** SQLite 数据库名称 */
  DB_NAME: "cjwproductivity.db",
  /** 连接字符串 */
  CONNECTION_STRING: "sqlite:cjwproductivity.db",
} as const;

// ============ 功能开关 ============

export const FEATURE_FLAGS = {
  /** 是否启用 NLP 解析 */
  ENABLE_NLP: true,
  /** 是否启用灵动岛 */
  ENABLE_DYNAMIC_ISLAND: true,
  /** 是否启用全局快捷键 */
  ENABLE_GLOBAL_SHORTCUTS: true,
  /** 是否启用调试日志 */
  ENABLE_DEBUG_LOG: import.meta.env.DEV,
} as const;

// ============ 平台检测 ============

export const PLATFORM = {
  /** 是否在 Tauri 环境中 */
  IS_TAURI: typeof window !== "undefined" && "__TAURI__" in window,
  /** 是否在开发模式 */
  IS_DEV: import.meta.env.DEV,
  /** 是否在生产模式 */
  IS_PROD: import.meta.env.PROD,
} as const;

// ============ API 端点 (预留) ============

export const API_ENDPOINTS = {
  /** 同步服务器地址 (未来功能) */
  SYNC_SERVER: import.meta.env.VITE_SYNC_SERVER || "",
} as const;

// ============ 导出统一入口 ============

export const env = {
  ...APP_INFO,
  ...DATABASE_CONFIG,
  ...FEATURE_FLAGS,
  ...PLATFORM,
  ...API_ENDPOINTS,
} as const;

export default env;
