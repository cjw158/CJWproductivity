/**
 * @file task.ts
 * @description 任务相关工具函数
 * 
 * 统一任务处理逻辑，包括：
 * - 任务过滤/分组
 * - 排序规则
 */

import type { Task } from "@/lib/tasks";

// ============ 类型定义 ============

export interface TaskGroups {
  /** 未排期任务（无 due_date） */
  unscheduled: Task[];
  /** 已排期任务（有 due_date） */
  scheduled: Task[];
  /** 已完成任务 */
  completed: Task[];
  /** 待处理任务（未完成） */
  pending: Task[];
}

// ============ 过滤/分组函数 ============

/**
 * 将任务列表分组
 * @param tasks - 任务数组
 * @returns 分组后的任务对象
 */
export function groupTasks(tasks: Task[]): TaskGroups {
  const completed = tasks.filter(t => t.status === "DONE");
  const pending = tasks.filter(t => t.status !== "DONE");
  const scheduled = pending.filter(t => t.due_date);
  const unscheduled = pending.filter(t => !t.due_date);

  return { unscheduled, scheduled, completed, pending };
}

/**
 * 按日期分组任务
 * @param tasks - 任务数组
 * @returns { [date: string]: Task[] }
 */
export function groupTasksByDate(tasks: Task[]): Record<string, Task[]> {
  const map: Record<string, Task[]> = {};
  
  for (const task of tasks) {
    if (task.due_date) {
      if (!map[task.due_date]) {
        map[task.due_date] = [];
      }
      map[task.due_date].push(task);
    }
  }
  
  return map;
}

// ============ 排序函数 ============

/**
 * 按 scheduled_time 排序任务
 * @param tasks - 任务数组
 * @returns 排序后的新数组
 */
export function sortByScheduledTime(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (!a.scheduled_time && !b.scheduled_time) return 0;
    if (!a.scheduled_time) return 1;
    if (!b.scheduled_time) return -1;
    return a.scheduled_time.localeCompare(b.scheduled_time);
  });
}

// ============ 过滤函数 ============

/**
 * 获取指定日期的任务
 * @param tasks - 任务数组
 * @param dateStr - 日期字符串 YYYY-MM-DD
 * @param excludeDone - 是否排除已完成
 * @returns 过滤后的任务数组
 */
export function getTasksByDate(
  tasks: Task[],
  dateStr: string,
  excludeDone = true
): Task[] {
  return tasks.filter(t => 
    t.due_date === dateStr && 
    (!excludeDone || t.status !== "DONE")
  );
}

/**
 * 获取未排期任务
 * @param tasks - 任务数组
 * @param excludeDone - 是否排除已完成
 * @returns 未排期的任务数组
 */
export function getUnscheduledTasks(tasks: Task[], excludeDone = true): Task[] {
  return tasks.filter(t => 
    !t.due_date && 
    (!excludeDone || t.status !== "DONE")
  );
}

/**
 * 计算任务剩余时间（秒）
 * @param task - 任务对象
 * @param now - 当前时间
 * @returns 剩余秒数，或 null（如果任务没有排期时间或已过期）
 */
export function getTaskRemaining(task: Task, now: Date): number | null {
  if (!task.scheduled_time) return null;
  
  const [hours, minutes] = task.scheduled_time.split(":").map(Number);
  const start = new Date(now);
  start.setHours(hours, minutes, 0, 0);
  
  const duration = task.duration || 30;
  const endTime = start.getTime() + duration * 60000;
  const remainingMs = endTime - now.getTime();
  
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : null;
}
