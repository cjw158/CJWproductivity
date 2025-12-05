/**
 * @file usePlanImages.ts
 * @description 计划图片 React Query Hooks
 * 
 * 设计原则：
 * 1. 封装所有数据获取逻辑
 * 2. 提供乐观更新支持
 * 3. 自动处理缓存失效
 * 4. 统一错误处理
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPlanImageRepository } from "@/services/planImage";
import type { PlanImage, CreatePlanImageInput } from "@/types";

// ============ Query Keys ============

export const PLAN_IMAGES_QUERY_KEY = ["planImages"] as const;

// ============ 查询 Hooks ============

/**
 * 获取所有计划图片
 */
export function usePlanImages() {
  return useQuery({
    queryKey: PLAN_IMAGES_QUERY_KEY,
    queryFn: async () => {
      const repo = getPlanImageRepository();
      return repo.getAll();
    },
    staleTime: 1000 * 60 * 5, // 5分钟内不重新获取
  });
}

/**
 * 获取单个图片详情
 */
export function usePlanImage(id: number) {
  return useQuery({
    queryKey: [...PLAN_IMAGES_QUERY_KEY, id],
    queryFn: async () => {
      const repo = getPlanImageRepository();
      return repo.getById(id);
    },
    enabled: id > 0,
  });
}

// ============ 变更 Hooks ============

/**
 * 上传新图片
 */
export function useUploadPlanImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      input, 
      imageData 
    }: { 
      input: CreatePlanImageInput; 
      imageData: Uint8Array;
    }) => {
      const repo = getPlanImageRepository();
      return repo.create(input, imageData);
    },
    onSuccess: () => {
      // 使缓存失效，触发重新获取
      queryClient.invalidateQueries({ queryKey: PLAN_IMAGES_QUERY_KEY });
    },
  });
}

/**
 * 更新图片标题
 */
export function useUpdatePlanImageTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title }: { id: number; title: string }) => {
      const repo = getPlanImageRepository();
      return repo.updateTitle(id, title);
    },
    onSuccess: (updatedImage) => {
      // 更新缓存中的单个图片
      queryClient.setQueryData(
        [...PLAN_IMAGES_QUERY_KEY, updatedImage.id],
        updatedImage
      );
      // 更新列表缓存
      queryClient.invalidateQueries({ queryKey: PLAN_IMAGES_QUERY_KEY });
    },
  });
}

/**
 * 删除图片
 */
export function useDeletePlanImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const repo = getPlanImageRepository();
      await repo.delete(id);
      return id;
    },
    onSuccess: (deletedId) => {
      // 乐观更新：立即从列表中移除
      queryClient.setQueryData<PlanImage[]>(
        PLAN_IMAGES_QUERY_KEY,
        (old) => old?.filter((img) => img.id !== deletedId) ?? []
      );
    },
  });
}

// ============ 工具 Hooks ============

/**
 * 获取图片的完整访问 URL
 */
export function useImageSrc(imagePath: string | undefined) {
  return useQuery({
    queryKey: ["imageSrc", imagePath],
    queryFn: async () => {
      if (!imagePath) return "";
      const repo = getPlanImageRepository();
      return repo.getFullPath(imagePath);
    },
    enabled: !!imagePath,
    staleTime: Infinity, // 路径转换结果不会变，永久缓存
  });
}
