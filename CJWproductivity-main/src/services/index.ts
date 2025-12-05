/**
 * @file index.ts
 * @description 服务层统一入口
 * 
 * 所有 Repository 和 Service 的单一访问点
 */

// Task Repository
export { getTaskRepository } from "./task";
export type { ITaskRepository } from "./task/ITaskRepository";

// Plan Repository
export { getPlanRepository } from "./plan";
export type { IPlanRepository } from "./plan/IPlanRepository";

// Input Service
export { getTaskInputService, TaskInputService } from "./input";
export type { ParsedTaskInput, TaskInputOptions } from "./input";

// NLP Service
export { getNlpService, parseTaskText, getCategoryLabel, getCategoryColor } from "./nlp";
export type { INlpService, NLPParseResult, TaskCategory } from "./nlp";
