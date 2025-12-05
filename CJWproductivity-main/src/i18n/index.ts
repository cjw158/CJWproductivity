/**
 * @file i18n/index.ts
 * @description 国际化系统入口
 */

import { zhCN, type TranslationKeys } from "./zh-CN";
import { enUS } from "./en-US";
import { jaJP } from "./ja-JP";
import type { Language } from "@/types/settings";

// 翻译资源映射
export const translations: Record<Language, TranslationKeys> = {
  "zh-CN": zhCN,
  "en-US": enUS,
  "ja-JP": jaJP,
};

// 语言显示名称
export const languageNames: Record<Language, string> = {
  "zh-CN": "简体中文",
  "en-US": "English",
  "ja-JP": "日本語",
};

// 导出类型
export type { TranslationKeys };
export { zhCN, enUS, jaJP };
