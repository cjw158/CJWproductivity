/**
 * @file useSettings.ts
 * @description 设置管理 React Hooks
 * 
 * 提供：
 * - useSettings: 获取完整设置
 * - useSettingValue: 获取单个设置值
 * - useUpdateSettings: 更新设置
 * - useResetSettings: 重置设置
 * - useExportSettings: 导出设置
 * - useImportSettings: 导入设置
 * 
 * 基于 React Query 实现，支持：
 * - 自动缓存
 * - 乐观更新
 * - 错误处理
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { settingsRepository } from "@/services/settings";
import type { AppSettings, SettingsUpdate } from "@/types/settings";
import { DEFAULT_SETTINGS } from "@/types/settings";

// ============ Query Keys ============

export const SETTINGS_QUERY_KEY = ["settings"] as const;

// ============ 基础 Hooks ============

/**
 * 获取完整设置
 * 
 * @example
 * ```tsx
 * const { data: settings, isLoading } = useSettings();
 * ```
 */
export function useSettings() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: () => settingsRepository.get(),
    staleTime: Infinity, // 设置不会过期
    gcTime: Infinity,
    // 使用 placeholderData 而不是 initialData，这样会在获取到真实数据后替换
    placeholderData: DEFAULT_SETTINGS,
    // 确保每次挂载时都重新获取设置
    refetchOnMount: true,
  });
}

/**
 * 获取单个设置分组
 * 
 * @param category - 设置分组名称
 * 
 * @example
 * ```tsx
 * const theme = useSettingCategory("theme");
 * ```
 */
export function useSettingCategory<K extends keyof Omit<AppSettings, "version">>(
  category: K
): AppSettings[K] {
  const { data } = useSettings();
  return data?.[category] ?? DEFAULT_SETTINGS[category];
}

/**
 * 更新设置
 * 
 * @example
 * ```tsx
 * const updateSettings = useUpdateSettings();
 * 
 * // 更新单个设置
 * updateSettings.mutate({ theme: { mode: "light" } });
 * 
 * // 更新多个设置
 * updateSettings.mutate({
 *   theme: { mode: "dark" },
 *   general: { fontSize: "large" }
 * });
 * ```
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (update: SettingsUpdate) => settingsRepository.update(update),
    onMutate: async (update) => {
      // 取消正在进行的查询
      await queryClient.cancelQueries({ queryKey: SETTINGS_QUERY_KEY });

      // 获取当前数据
      const previous = queryClient.getQueryData<AppSettings>(SETTINGS_QUERY_KEY);

      // 乐观更新
      if (previous) {
        queryClient.setQueryData<AppSettings>(SETTINGS_QUERY_KEY, (old) => {
          if (!old) return old;
          return deepMergeSettings(old, update);
        });
      }

      return { previous };
    },
    onError: (_err, _update, context) => {
      // 回滚
      if (context?.previous) {
        queryClient.setQueryData(SETTINGS_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      // 重新验证
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
    },
  });
}

/**
 * 重置设置
 * 
 * @example
 * ```tsx
 * const resetSettings = useResetSettings();
 * resetSettings.mutate();
 * ```
 */
export function useResetSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => settingsRepository.reset(),
    onSuccess: (data) => {
      queryClient.setQueryData(SETTINGS_QUERY_KEY, data);
    },
  });
}

/**
 * 导出设置
 * 
 * @example
 * ```tsx
 * const exportSettings = useExportSettings();
 * 
 * const handleExport = async () => {
 *   const json = await exportSettings.mutateAsync();
 *   // 下载或复制 json
 * };
 * ```
 */
export function useExportSettings() {
  return useMutation({
    mutationFn: () => settingsRepository.export(),
  });
}

/**
 * 导入设置
 * 
 * @example
 * ```tsx
 * const importSettings = useImportSettings();
 * 
 * const handleImport = async (json: string) => {
 *   await importSettings.mutateAsync(json);
 * };
 * ```
 */
export function useImportSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (json: string) => settingsRepository.import(json),
    onSuccess: (data) => {
      queryClient.setQueryData(SETTINGS_QUERY_KEY, data);
    },
  });
}

// ============ 便捷 Hooks ============

/**
 * 主题设置 Hook
 */
export function useThemeSettings() {
  const { data } = useSettings();
  const updateSettings = useUpdateSettings();

  const setThemeMode = useCallback(
    (mode: AppSettings["theme"]["mode"]) => {
      updateSettings.mutate({ theme: { mode } });
    },
    [updateSettings]
  );

  const setAccentColor = useCallback(
    (accentColor: string) => {
      updateSettings.mutate({ theme: { accentColor } });
    },
    [updateSettings]
  );

  const toggleAnimations = useCallback(() => {
    updateSettings.mutate({
      theme: { enableAnimations: !data?.theme.enableAnimations },
    });
  }, [updateSettings, data?.theme.enableAnimations]);

  return {
    theme: data?.theme ?? DEFAULT_SETTINGS.theme,
    setThemeMode,
    setAccentColor,
    toggleAnimations,
    isUpdating: updateSettings.isPending,
  };
}

/**
 * 灵动岛设置 Hook
 */
export function useIslandSettings() {
  const { data } = useSettings();
  const updateSettings = useUpdateSettings();

  const setEnabled = useCallback(
    (enabled: boolean) => {
      updateSettings.mutate({ island: { enabled } });
    },
    [updateSettings]
  );

  const setPosition = useCallback(
    (position: AppSettings["island"]["position"]) => {
      updateSettings.mutate({ island: { position } });
    },
    [updateSettings]
  );

  const setOpacity = useCallback(
    (opacity: number) => {
      updateSettings.mutate({ island: { opacity } });
    },
    [updateSettings]
  );

  return {
    island: data?.island ?? DEFAULT_SETTINGS.island,
    setEnabled,
    setPosition,
    setOpacity,
    isUpdating: updateSettings.isPending,
  };
}

/**
 * 通用设置 Hook
 */
export function useGeneralSettings() {
  const { data } = useSettings();
  const updateSettings = useUpdateSettings();

  const setLanguage = useCallback(
    (language: AppSettings["general"]["language"]) => {
      updateSettings.mutate({ general: { language } });
    },
    [updateSettings]
  );

  const setFontSize = useCallback(
    (fontSize: AppSettings["general"]["fontSize"]) => {
      updateSettings.mutate({ general: { fontSize } });
    },
    [updateSettings]
  );

  const setStartPage = useCallback(
    (startPage: AppSettings["general"]["startPage"]) => {
      updateSettings.mutate({ general: { startPage } });
    },
    [updateSettings]
  );

  return {
    general: data?.general ?? DEFAULT_SETTINGS.general,
    setLanguage,
    setFontSize,
    setStartPage,
    isUpdating: updateSettings.isPending,
  };
}

// ============ 工具函数 ============

function deepMergeSettings(
  target: AppSettings,
  source: SettingsUpdate
): AppSettings {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key as keyof SettingsUpdate];
      const targetValue = target[key as keyof AppSettings];

      if (
        sourceValue !== null &&
        typeof sourceValue === "object" &&
        !Array.isArray(sourceValue) &&
        targetValue !== null &&
        typeof targetValue === "object" &&
        !Array.isArray(targetValue)
      ) {
        (result as Record<string, unknown>)[key] = {
          ...targetValue,
          ...sourceValue,
        };
      } else if (sourceValue !== undefined) {
        (result as Record<string, unknown>)[key] = sourceValue;
      }
    }
  }

  return result;
}
