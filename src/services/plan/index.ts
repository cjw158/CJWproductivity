/**
 * @file index.ts
 * @description 计划服务入口
 * 
 * 单例模式提供 Repository 实例
 */

import { PlanRepository } from "./PlanRepository";
import type { IPlanRepository } from "./IPlanRepository";

export type { IPlanRepository } from "./IPlanRepository";

// 单例实例
let repository: IPlanRepository | null = null;

/**
 * 获取计划仓储实例
 * @returns IPlanRepository 单例
 */
export function getPlanRepository(): IPlanRepository {
  if (!repository) {
    repository = new PlanRepository();
    // 非阻塞初始化
    repository.initialize().catch(console.error);
  }
  return repository;
}
