import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import type { ThemeMode, FontSize } from "@/types/settings";

export type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  accentColor: string;
  fontSize: FontSize;
  enableAnimations: boolean;
  enableGlassEffect: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (color: string) => void;
  setFontSize: (size: FontSize) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_KEY = "cjw-theme";

// 字体大小范围 (px)
const FONT_SIZE_MIN = 12;
const FONT_SIZE_MAX = 24;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  
  // 本地主题状态（用于立即响应）- 作为唯一真实来源
  const [localTheme, setLocalTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
    return "dark";
  });

  // 监听 localStorage 变化（来自其他组件的修改）
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === "light" || stored === "dark") {
        setLocalTheme(stored);
      }
    };
    
    // 监听 storage 事件（跨标签页）
    window.addEventListener("storage", handleStorageChange);
    
    // 自定义事件（同一标签页内）
    window.addEventListener("theme-changed", handleStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("theme-changed", handleStorageChange);
    };
  }, []);

  // 从设置中获取其他配置
  const accentColor = settings?.theme.accentColor ?? "#00FFFF";
  const fontSize = settings?.general.fontSize ?? "medium";
  const enableAnimations = settings?.theme.enableAnimations ?? true;
  const enableGlassEffect = settings?.theme.enableGlassEffect ?? true;

  // 系统主题检测
  const [systemTheme, setSystemTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "dark";
  });

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // 计算当前应该使用的主题
  const themeMode = settings?.theme.mode ?? "dark";
  const theme: Theme = themeMode === "system" ? systemTheme : localTheme;

  // 应用主题类 - 只在主题变化时更新
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-dark", "theme-light");
    root.classList.add(`theme-${theme}`);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // 应用强调色 - 只在强调色变化时更新
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--neon-cyan", accentColor);
    root.style.setProperty("--accent-color", accentColor);
  }, [accentColor]);

  // 应用字体大小 - 只在字体大小变化时更新
  useEffect(() => {
    const root = document.documentElement;
    const size = Math.min(Math.max(fontSize, FONT_SIZE_MIN), FONT_SIZE_MAX);
    root.style.setProperty("--base-font-size", `${size}px`);
    root.style.fontSize = `${size}px`;
  }, [fontSize]);

  // 应用动画开关
  useEffect(() => {
    const root = document.documentElement;
    if (!enableAnimations) {
      root.classList.add("reduce-motion");
    } else {
      root.classList.remove("reduce-motion");
    }
  }, [enableAnimations]);

  // 应用毛玻璃效果
  useEffect(() => {
    const root = document.documentElement;
    if (!enableGlassEffect) {
      root.classList.add("no-glass");
    } else {
      root.classList.remove("no-glass");
    }
  }, [enableGlassEffect]);

  const setTheme = useCallback((newTheme: Theme) => {
    setLocalTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    updateSettings.mutate({ theme: { mode: newTheme } });
  }, [updateSettings]);

  const toggleTheme = useCallback(() => {
    const newTheme = localTheme === "dark" ? "light" : "dark";
    console.log("[ThemeContext] toggleTheme:", localTheme, "->", newTheme);
    // 立即更新本地状态
    setLocalTheme(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    // 异步保存到设置
    updateSettings.mutate({ theme: { mode: newTheme } });
  }, [localTheme, updateSettings]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    updateSettings.mutate({ theme: { mode } });
  }, [updateSettings]);

  const setAccentColor = useCallback((color: string) => {
    updateSettings.mutate({ theme: { accentColor: color } });
  }, [updateSettings]);

  const setFontSize = useCallback((size: FontSize) => {
    updateSettings.mutate({ general: { fontSize: size } });
  }, [updateSettings]);

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      themeMode,
      accentColor,
      fontSize,
      enableAnimations,
      enableGlassEffect,
      toggleTheme, 
      setTheme,
      setThemeMode,
      setAccentColor,
      setFontSize,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
