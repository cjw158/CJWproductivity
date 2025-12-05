/**
 * @file ITaskRepository.ts
 * @description 任务仓储接口定义
 * 
 * 遵循 SOLID 原则中的依赖倒置原则 (DIP)
 * 业务逻辑依赖于此接口，而不是具体的 SQLite 或 Mock 实现
 */

import type { Task, CreateTaskInput, UpdateTaskInput, TaskStatus } from "@/lib/tasks";

export interface ITaskRepository {
  /** 初始化仓储 */
  initialize(): Promise<void>;
  
  /** 获取所有任务 */
  getAll(): Promise<Task[]>;
  
  /** 根据 ID 获取任务 */
  getById(id: number): Promise<Task | null>;
  
  /** 根据状态获取任务 */
  getByStatus(status: TaskStatus): Promise<Task[]>;
  
  /** 创建任务 */
  create(input: CreateTaskInput): Promise<Task>;
  
  /** 更新任务 */
  update(id: number, input: UpdateTaskInput): Promise<Task>;
  
  /** 删除任务 */
  delete(id: number): Promise<void>;
  
  /** 获取特定状态的任务数量 */
  countByStatus(status: TaskStatus): Promise<number>;
}
