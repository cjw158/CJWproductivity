/**
 * @file LanguageContext.tsx
 * @description 语言上下文，提供国际化支持
 */

import { createContext, useContext, useCallback, useMemo, type ReactNode } from "react";
import { translations, languageNames } from "@/i18n";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import type { Language } from "@/types/settings";

// ============ 类型定义 ============

interface LanguageContextType {
  /** 当前语言 */
  language: Language;
  /** 设置语言 */
  setLanguage: (lang: Language) => void;
  /** 翻译函数 */
  t: (key: string, params?: Record<string, string | number>) => string;
  /** 语言名称映射 */
  languageNames: typeof languageNames;
  /** 可用语言列表 */
  availableLanguages: Language[];
}

// ============ Context ============

const LanguageContext = createContext<LanguageContextType | null>(null);

// ============ Provider ============

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  
  const language = settings?.general.language ?? "zh-CN";

  const setLanguage = useCallback((lang: Language) => {
    updateSettings.mutate({ general: { language: lang } });
  }, [updateSettings]);

  // 翻译函数
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const keys = key.split(".");
    let value: unknown = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        // 找不到翻译，返回 key
        console.warn(`[i18n] Missing translation: ${key}`);
        return key;
      }
    }

    if (typeof value !== "string") {
      console.warn(`[i18n] Translation is not a string: ${key}`);
      return key;
    }

    // 替换参数
    if (params) {
      return value.replace(/\{(\w+)\}/g, (_, paramKey) => {
        return String(params[paramKey] ?? `{${paramKey}}`);
      });
    }

    return value;
  }, [language]);

  const availableLanguages: Language[] = useMemo(() => 
    Object.keys(translations) as Language[], 
  []);

  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t,
    languageNames,
    availableLanguages,
  }), [language, setLanguage, t, availableLanguages]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

// ============ Hook ============

/**
 * 使用语言上下文
 * 
 * @example
 * ```tsx
 * const { t, language, setLanguage } = useLanguage();
 * 
 * return <h1>{t("settings.title")}</h1>;
 * ```
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

/**
 * 仅获取翻译函数（轻量级）
 */
export function useTranslation() {
  const { t } = useLanguage();
  return { t };
}
