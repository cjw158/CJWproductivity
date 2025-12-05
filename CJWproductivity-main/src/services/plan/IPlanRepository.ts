/**
 * @file IPlanRepository.ts
 * @description 计划仓储接口定义
 * 
 * 遵循 SOLID 原则中的依赖倒置原则 (DIP)
 * 业务逻辑依赖于此接口，而不是具体实现
 */

import type { 
  Plan, 
  KeyResult, 
  CreatePlanInput, 
  UpdatePlanInput,
  CreateKeyResultInput,
  UpdateKeyResultInput,
  PlanStatus 
} from "@/types";

export interface IPlanRepository {
  // ============ 初始化 ============
  
  /** 初始化仓储 */
  initialize(): Promise<void>;
  
  // ============ Plan CRUD ============
  
  /** 获取所有计划 */
  getAllPlans(): Promise<Plan[]>;
  
  /** 根据状态获取计划 */
  getPlansByStatus(status: PlanStatus): Promise<Plan[]>;
  
  /** 根据 ID 获取计划 */
  getPlanById(id: number): Promise<Plan | null>;
  
  /** 创建计划 */
  createPlan(input: CreatePlanInput): Promise<Plan>;
  
  /** 更新计划 */
  updatePlan(id: number, input: UpdatePlanInput): Promise<Plan>;
  
  /** 删除计划 */
  deletePlan(id: number): Promise<void>;
  
  // ============ KeyResult CRUD ============
  
  /** 获取计划的所有关键结果 */
  getKeyResultsByPlanId(planId: number): Promise<KeyResult[]>;
  
  /** 创建关键结果 */
  createKeyResult(input: CreateKeyResultInput): Promise<KeyResult>;
  
  /** 更新关键结果 */
  updateKeyResult(id: number, input: UpdateKeyResultInput): Promise<KeyResult>;
  
  /** 删除关键结果 */
  deleteKeyResult(id: number): Promise<void>;
  
  // ============ 聚合操作 ============
  
  /** 重新计算计划进度 */
  recalculatePlanProgress(planId: number): Promise<number>;
}
