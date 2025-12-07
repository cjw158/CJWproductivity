/**
 * @file island/types.ts
 * @description 灵动岛模块类型定义
 */

import type { Task } from "@/lib/tasks";
import type { Note } from "@/types";

/**
 * 灵动岛状态
 */
export interface IslandState {
  isExpanded: boolean;
  isVisible: boolean;
  isCaptureMode: boolean;
  captureText: string;
  isSaving: boolean;
  showNoteSelector: boolean;
  noteMode: "append" | "new" | "select";
  selectedNoteId: number | null;
  capturedImage: string | null;
}

/**
 * 番茄钟状态
 */
export interface PomodoroState {
  minutes: number;
  remaining: number;
  isActive: boolean;
  isHovered: boolean;
}

/**
 * 笔记选择模式
 */
export type NoteMode = "append" | "new" | "select";

/**
 * 灵动岛尺寸
 */
export interface IslandSize {
  width: number;
  height: number;
}

/**
 * 今日任务数据
 */
export interface TodayTasksData {
  tasks: Task[];
  completed: number;
  total: number;
  running: Task | null;
}

/**
 * 笔记数据
 */
export interface NotesData {
  notes: Note[];
  recentNotes: Note[];
  latestNote: Note | null;
  latestNoteTitle: string | null;
}
