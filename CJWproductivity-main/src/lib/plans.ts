/**
 * @file plans.ts
 * @description OKR 计划数据访问层 (Facade)
 * 
 * [Refactoring Note]
 * 该文件现在作为 facade，将请求转发给 PlanRepository。
 * 保持 API 兼容，但底层实现已解耦到 services/plan。
 */

import { getPlanRepository } from "@/services/plan";

// ============ 类型重导出 (保持兼容) ============

export type {
  Plan,
  KeyResult,
  PlanStatus,
  CreatePlanInput,
  UpdatePlanInput,
  CreateKeyResultInput,
  UpdateKeyResultInput,
} from "@/types";

import type {
  Plan,
  KeyResult,
  CreatePlanInput,
  UpdatePlanInput,
  CreateKeyResultInput,
  UpdateKeyResultInput,
} from "@/types";

// ============ 初始化 ============

export async function initializePlanStore(): Promise<void> {
  await getPlanRepository().initialize();
}

// ============ Plan CRUD ============

export async function getAllPlans(): Promise<Plan[]> {
  return getPlanRepository().getAllPlans();
}

export async function getActivePlans(): Promise<Plan[]> {
  return getPlanRepository().getPlansByStatus("active");
}

export async function getPlanById(id: number): Promise<Plan | null> {
  return getPlanRepository().getPlanById(id);
}

export async function createPlan(input: CreatePlanInput): Promise<Plan> {
  return getPlanRepository().createPlan(input);
}

export async function updatePlan(id: number, input: UpdatePlanInput): Promise<Plan> {
  return getPlanRepository().updatePlan(id, input);
}

export async function deletePlan(id: number): Promise<void> {
  return getPlanRepository().deletePlan(id);
}

// ============ KeyResult CRUD ============

export async function getKeyResultsByPlan(planId: number): Promise<KeyResult[]> {
  return getPlanRepository().getKeyResultsByPlanId(planId);
}

export async function createKeyResult(input: CreateKeyResultInput): Promise<KeyResult> {
  return getPlanRepository().createKeyResult(input);
}

export async function updateKeyResult(id: number, input: UpdateKeyResultInput): Promise<KeyResult> {
  return getPlanRepository().updateKeyResult(id, input);
}

export async function deleteKeyResult(id: number): Promise<void> {
  return getPlanRepository().deleteKeyResult(id);
}
