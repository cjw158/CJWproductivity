/**
 * @file constants.ts
 * @description 业务常量配置中心
 * 
 * 设计原则:
 * - 所有硬编码数字/字符串集中管理
 * - 方便后续配置化或国际化
 * - 单一修改点
 */

// ============ 任务系统常量 ============

import type { TaskStatus } from "@/types";

/** 任务状态常量 (值来自 @/types) */
export const TASK_STATUS: Record<TaskStatus, TaskStatus> = {
  INBOX: "INBOX",
  TODO: "TODO",
  DOING: "DOING",
  DONE: "DONE",
} as const;

// Re-export for convenience
export type { TaskStatus } from "@/types";

/** 专注区(DOING)任务数量限制 */
export const DOING_LIMIT = 3;

/** 默认任务时长(分钟) */
export const DEFAULT_TASK_DURATION = 30;

// ============ 时间配置 ============

export const TIME_CONFIG = {
  /** 日视图起始小时 */
  START_HOUR: 6,
  /** 日视图结束小时 */
  END_HOUR: 23,
  /** 每小时高度(px) */
  HOUR_HEIGHT: 60,
  /** 最小任务时长(分钟) */
  MIN_DURATION: 15,
  /** 时间槽间隔(分钟) */
  SLOT_INTERVAL: 30,
} as const;

// ============ 灵动岛配置 ============

export const ISLAND_CONFIG = {
  /** 基础任务宽度(px) */
  BASE_TASK_WIDTH: 160,
  /** 折叠高度(px) */
  COLLAPSED_HEIGHT: 36,
  /** 展开宽度(px) */
  EXPANDED_WIDTH: 320,
  /** 展开高度(px) */
  EXPANDED_HEIGHT: 240,
  /** 最小折叠宽度(px) */
  MIN_COLLAPSED_WIDTH: 140,
  /** 捕获模式宽度(px) */
  CAPTURE_WIDTH: 400,
  /** 捕获模式高度(px) */
  CAPTURE_HEIGHT: 52,
} as const;

// ============ 优先级配置 ============

/** 
 * 优先级颜色映射
 * 基于艾森豪威尔矩阵四象限
 */
export const PRIORITY_COLORS = {
  /** Q1: 重要且紧急 - 红色 */
  URGENT_IMPORTANT: "#EF4444",
  /** Q2: 重要不紧急 - 蓝色 */
  IMPORTANT: "#3B82F6",
  /** Q3: 紧急不重要 - 黄色 */
  URGENT: "#F59E0B",
  /** Q4: 不重要不紧急 - 紫色 */
  NORMAL: "#A855F7",
} as const;

/** 象限标识 */
export const QUADRANT_IDS = {
  Q1: "Q1", // 重要且紧急
  Q2: "Q2", // 重要不紧急
  Q3: "Q3", // 紧急不重要
  Q4: "Q4", // 不重要不紧急
} as const;

// ============ UI 配置 ============

export const UI_CONFIG = {
  /** 动画时长(ms) */
  ANIMATION_DURATION: 200,
  /** 拖拽激活距离(px) */
  DRAG_ACTIVATION_DISTANCE: 8,
  /** Toast 显示时长(ms) */
  TOAST_DURATION: 3000,
} as const;

// ============ 视图类型 ============

export const VIEW_TYPES = {
  BOARD: "board",
  CALENDAR: "calendar",
  MATRIX: "matrix",
} as const;

export type ViewType = (typeof VIEW_TYPES)[keyof typeof VIEW_TYPES];

/** 视图描述 */
export const VIEW_DESCRIPTIONS: Record<ViewType, string> = {
  board: "按状态流转",
  calendar: "按时间规划",
  matrix: "按优先级排序",
};
