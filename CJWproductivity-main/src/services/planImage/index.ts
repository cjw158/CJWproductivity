/**
 * @file index.ts
 * @description 计划图片服务模块导出
 * 
 * 使用单例模式确保全局只有一个仓储实例
 */

import { PlanImageRepository } from "./PlanImageRepository";
import type { IPlanImageRepository } from "./IPlanImageRepository";

export type { IPlanImageRepository };
export { PlanImageRepository };

// 单例实例
let repository: IPlanImageRepository | null = null;

/**
 * 获取计划图片仓储实例（单例）
 */
export function getPlanImageRepository(): IPlanImageRepository {
  if (!repository) {
    repository = new PlanImageRepository();
  }
  return repository;
}

/**
 * 初始化计划图片存储
 * 应在应用启动时调用
 */
export async function initializePlanImageStore(): Promise<void> {
  await getPlanImageRepository().initialize();
}
