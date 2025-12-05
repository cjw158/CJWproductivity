/**
 * @file services/nlp/index.ts
 * @description NLP 服务入口
 * 
 * 设计模式: 单例
 * 使用方式:
 * ```ts
 * import { getNlpService } from '@/services/nlp';
 * const result = getNlpService().parseTaskText("明天下午3点开会");
 * ```
 */

import { NlpService } from "./NlpService";
import type { INlpService } from "./types";

// 单例实例
let service: INlpService | null = null;

/**
 * 获取 NLP 服务实例
 */
export function getNlpService(): INlpService {
  if (!service) {
    service = new NlpService();
  }
  return service;
}

/**
 * 注入自定义服务 (用于测试)
 */
export function setNlpService(customService: INlpService): void {
  service = customService;
}

/**
 * 重置服务 (用于测试清理)
 */
export function resetNlpService(): void {
  service = null;
}

// 类型导出
export type {
  INlpService,
  NLPParseResult,
  TaskCategory,
  DatetimeResult,
  PriorityResult,
  DurationResult,
  CategoryResult,
} from "./types";

// 便捷函数导出 (保持兼容旧 API)
export function parseTaskText(text: string) {
  return getNlpService().parseTaskText(text);
}

export function getCategoryLabel(category: import("./types").TaskCategory) {
  return getNlpService().getCategoryLabel(category);
}

export function getCategoryColor(category: import("./types").TaskCategory) {
  return getNlpService().getCategoryColor(category);
}
