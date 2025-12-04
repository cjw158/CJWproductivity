/**
 * @file usePlans.ts
 * @description 计划相关的 React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllPlans,
  getActivePlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  getKeyResultsByPlan,
  createKeyResult,
  updateKeyResult,
  deleteKeyResult,
  type CreatePlanInput,
  type UpdatePlanInput,
  type CreateKeyResultInput,
  type UpdateKeyResultInput,
} from "@/lib/plans";

// ============ Plan Hooks ============

export function useAllPlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: getAllPlans,
  });
}

export function useActivePlans() {
  return useQuery({
    queryKey: ["plans", "active"],
    queryFn: getActivePlans,
  });
}

export function usePlan(id: number) {
  return useQuery({
    queryKey: ["plans", id],
    queryFn: () => getPlanById(id),
    enabled: id > 0,
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePlanInput) => createPlan(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdatePlanInput }) =>
      updatePlan(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.invalidateQueries({ queryKey: ["plans", id] });
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });
}

// ============ Key Result Hooks ============

export function useKeyResults(planId: number) {
  return useQuery({
    queryKey: ["key_results", planId],
    queryFn: () => getKeyResultsByPlan(planId),
    enabled: planId > 0,
  });
}

export function useCreateKeyResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateKeyResultInput) => createKeyResult(input),
    onSuccess: (_, { plan_id }) => {
      queryClient.invalidateQueries({ queryKey: ["key_results", plan_id] });
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });
}

export function useUpdateKeyResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateKeyResultInput }) =>
      updateKeyResult(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["key_results"] });
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });
}

export function useDeleteKeyResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteKeyResult(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["key_results"] });
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });
}
