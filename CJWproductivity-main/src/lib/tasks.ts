/**
 * @file tasks.ts
 * @description 任务数据访问层 (Facade)
 * 
 * [Refactoring Note]
 * 该文件现在作为 facade，将请求转发给 TaskRepository。
 * 保持 API 兼容，但底层实现已解耦。
 */

import { getTaskRepository } from "@/services/task";

// ============ 类型重导出 (保持兼容) ============

export type {
  Task,
  TaskStatus,
  CreateTaskInput,
  UpdateTaskInput,
} from "@/types";

import type { Task, TaskStatus, CreateTaskInput, UpdateTaskInput } from "@/types";

// ============ Initialization ============

export async function initializeDataStore() {
  // 初始化任务仓储
  await getTaskRepository().initialize();
  // 初始化设置仓储（确保设置可以被正确读取和保存）
  const { settingsRepository } = await import("@/services/settings/SettingsRepository");
  await settingsRepository.initialize();
}

// ============ CRUD Operations ============

export async function getAllTasks(): Promise<Task[]> {
  return getTaskRepository().getAll();
}

export async function getTasksByStatus(status: TaskStatus): Promise<Task[]> {
  return getTaskRepository().getByStatus(status);
}

export async function getActiveTasks(): Promise<Task[]> {
  const all = await getTaskRepository().getAll();
  // 内存中排序，保持一致性
  return all
    .filter(t => t.status !== 'DONE')
    .sort((a, b) => {
      // 状态优先级: DOING > TODO > INBOX
      const statusScore = (s: string) => s === 'DOING' ? 3 : s === 'TODO' ? 2 : 1;
      const scoreA = statusScore(a.status);
      const scoreB = statusScore(b.status);
      return scoreB - scoreA;
    });
}

export async function getDoingTasks(): Promise<Task[]> {
  return getTaskRepository().getByStatus("DOING");
}

export async function getDoingTasksCount(): Promise<number> {
  return getTaskRepository().countByStatus("DOING");
}

export async function getTaskById(id: number): Promise<Task | null> {
  return getTaskRepository().getById(id);
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  return getTaskRepository().create(input);
}

export async function updateTask(id: number, input: UpdateTaskInput): Promise<Task> {
  return getTaskRepository().update(id, input);
}

export async function updateTaskStatus(id: number, status: TaskStatus): Promise<Task> {
  return getTaskRepository().update(id, { status });
}

export async function deleteTask(id: number): Promise<void> {
  return getTaskRepository().delete(id);
}

// ============ Kanban Support ============

export async function getTasksByKanban(): Promise<Record<TaskStatus, Task[]>> {
  const tasks = await getAllTasks();
  
  const kanban: Record<TaskStatus, Task[]> = {
    INBOX: [],
    TODO: [],
    DOING: [],
    DONE: [],
  };
  
  tasks.forEach(task => {
    if (kanban[task.status]) {
      kanban[task.status].push(task);
    }
  });
  
  return kanban;
}
