/**
 * @file types/index.ts
 * @description 全局类型定义中心
 * 
 * 设计原则:
 * - 所有业务实体类型在此定义
 * - 避免类型分散在多个文件
 * - 确保类型单一来源 (Single Source of Truth)
 */

// ============ Task Types ============

export type TaskStatus = "INBOX" | "TODO" | "DOING" | "DONE";

export interface Task {
  id: number;
  content: string;
  status: TaskStatus;
  due_date: string | null;
  scheduled_time: string | null;
  duration: number | null;
  created_at: string;
  completed_at: string | null;
}

export interface CreateTaskInput {
  content: string;
  status?: TaskStatus;
  due_date?: string | null;
  scheduled_time?: string | null;
  duration?: number | null;
}

export interface UpdateTaskInput {
  content?: string;
  status?: TaskStatus;
  due_date?: string | null;
  scheduled_time?: string | null;
  duration?: number | null;
}

// ============ Plan Types ============

export type PlanStatus = "active" | "completed" | "archived";

export interface Plan {
  id: number;
  title: string;
  description: string | null;
  color: string;
  progress: number;
  status: PlanStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface KeyResult {
  id: number;
  plan_id: number;
  title: string;
  target_value: number;
  current_value: number;
  unit: string;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePlanInput {
  title: string;
  description?: string;
  color?: string;
  start_date?: string;
  end_date?: string;
}

export interface UpdatePlanInput {
  title?: string;
  description?: string;
  color?: string;
  status?: PlanStatus;
  start_date?: string;
  end_date?: string;
}

export interface CreateKeyResultInput {
  plan_id: number;
  title: string;
  target_value: number;
  unit?: string;
}

export interface UpdateKeyResultInput {
  title?: string;
  target_value?: number;
  current_value?: number;
  unit?: string;
}

// ============ Plan Image Types ============

/**
 * 计划图片实体
 * 用于存储用户上传的手写计划图片
 */
export interface PlanImage {
  id: number;
  /** 图片标题/描述 */
  title: string;
  /** 图片相对路径（相对于应用数据目录） */
  imagePath: string;
  /** 缩略图路径（可选，用于优化加载） */
  thumbnailPath: string | null;
  /** 文件大小（字节） */
  fileSize: number;
  /** 图片宽度 */
  width: number | null;
  /** 图片高度 */
  height: number | null;
  /** 创建时间 */
  createdAt: string;
  /** 排序顺序 */
  sortOrder: number;
}

export interface CreatePlanImageInput {
  /** 图片标题 */
  title: string;
  /** 原始文件名（用于提取扩展名） */
  fileName: string;
}

// ============ Note Types ============

export interface Note {
  id: number;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface CreateNoteInput {
  content: string;
  is_pinned?: boolean;
}

export interface UpdateNoteInput {
  content?: string;
  is_pinned?: boolean;
}

// ============ UI Types ============

export type ViewType = "board" | "calendar";

// ============ NLP Types ============

export type TaskCategory = 
  | "work"
  | "study"
  | "life"
  | "health"
  | "social"
  | "finance"
  | "creative"
  | "other";
