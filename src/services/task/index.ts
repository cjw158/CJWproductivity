/**
 * @file index.ts
 * @description 任务服务入口
 * 
 * 设计模式: 单例 + 依赖注入预留
 * - 默认使用 TaskRepository
 * - 可通过 setTaskRepository 注入 Mock 用于测试
 */

import { TaskRepository } from "./TaskRepository";
import { ITaskRepository } from "./ITaskRepository";
import { logger } from "@/lib/logger";

// 单例实例
let repository: ITaskRepository | null = null;

/**
 * 获取任务仓储实例
 * @returns ITaskRepository 任务仓储接口
 */
export function getTaskRepository(): ITaskRepository {
  if (!repository) {
    repository = new TaskRepository();
    // 初始化 (非阻塞)
    repository.initialize().catch((err) => {
      logger.error("TaskRepository initialization failed", err);
    });
  }
  return repository;
}

/**
 * 注入自定义仓储 (用于测试)
 * @param repo 自定义仓储实现
 */
export function setTaskRepository(repo: ITaskRepository): void {
  repository = repo;
}

/**
 * 重置仓储 (用于测试清理)
 */
export function resetTaskRepository(): void {
  repository = null;
}
