/**
 * @file island/constants.ts
 * @description 灵动岛模块常量
 */

// Apple 风格系统字体
export const SYSTEM_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif';

// 从全局配置导入
import { ISLAND_CONFIG as GLOBAL_ISLAND_CONFIG } from "@/config/constants";

export const ISLAND_CONFIG = GLOBAL_ISLAND_CONFIG;

// 主题颜色配置
export interface IslandColors {
  bg: string;
  text: string;
  textMuted: string;
  accent: string;
  success: string;
  border: string;
  borderGlow: string;
  cardBg: string;
}

export const COLORS = {
  dark: {
    bg: "#0a0a0a",
    text: "#ffffff",
    textMuted: "rgba(255,255,255,0.5)",
    accent: "#22d3ee",
    success: "#22c55e",
    border: "rgba(34,211,238,0.3)",
    borderGlow: "rgba(34,211,238,0.5)",
    cardBg: "rgba(255,255,255,0.05)",
  },
  light: {
    bg: "#ffffff",
    text: "#1a1a1a",
    textMuted: "rgba(0,0,0,0.5)",
    accent: "#0ea5e9",
    success: "#22c55e",
    border: "rgba(14,165,233,0.3)",
    borderGlow: "rgba(14,165,233,0.5)",
    cardBg: "rgba(0,0,0,0.05)",
  },
} as const;
