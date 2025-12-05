/**
 * @file island.ts
 * @description 灵动岛窗口控制
 * 
 * 功能:
 * - 创建/关闭/切换灵动岛 Tauri 窗口
 * - 窗口位置管理
 * - 可见性检测
 * 
 * 注意: 所有日志使用 logger 模块，非 console.log
 */

import { WebviewWindow, getAllWebviewWindows } from "@tauri-apps/api/webviewWindow";
import { PhysicalPosition } from "@tauri-apps/api/dpi";
import type { IslandPosition } from "@/types/settings";
import { logger } from "./logger";

let islandWindow: WebviewWindow | null = null;

// 检查是否在 Tauri 环境中
const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

// 位置映射（基于 1920x1080 屏幕）
const POSITION_MAP: Record<IslandPosition, { x: number; y: number }> = {
  "top-left": { x: 20, y: 10 },
  "top-center": { x: 780, y: 10 },
  "top-right": { x: 1540, y: 10 },
};

/**
 * 获取灵动岛窗口实例
 */
async function getIslandWindow(): Promise<WebviewWindow | null> {
  if (!isTauri) return null;
  try {
    const windows = await getAllWebviewWindows();
    return windows.find(w => w.label === "island") || null;
  } catch {
    return null;
  }
}

/**
 * 切换灵动岛窗口显示
 */
export async function toggleIsland(): Promise<void> {
  logger.debug("toggleIsland called, isTauri:", isTauri);
  if (!isTauri) {
    logger.debug("Island: Not in Tauri environment");
    return;
  }
  
  try {
    islandWindow = await getIslandWindow();
    
    if (islandWindow) {
      // 窗口存在，关闭它
      await islandWindow.close();
      islandWindow = null;
      logger.debug("Island window closed");
    } else {
      // 窗口不存在，创建新窗口
      islandWindow = new WebviewWindow("island", {
        url: "/#island",
        title: "Dynamic Island",
        width: 140,
        height: 36,
        x: 890,
        y: 5,
        resizable: false,
        decorations: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        focus: false,
      });

      islandWindow.once("tauri://created", () => {
        logger.debug("Island window created");
      });

      islandWindow.once("tauri://error", (e) => {
        logger.error("Island window creation error:", e);
      });
    }
  } catch (error) {
    logger.error("Toggle island error:", error);
  }
}

/**
 * 显示灵动岛
 */
export async function showIsland(): Promise<void> {
  logger.debug("showIsland called, isTauri:", isTauri);
  if (!isTauri) {
    logger.debug("Island: Not in Tauri environment");
    return;
  }
  
  try {
    islandWindow = await getIslandWindow();
    if (islandWindow) {
      await islandWindow.show();
      await islandWindow.setFocus();
    } else {
      // 窗口不存在，创建新窗口
      islandWindow = new WebviewWindow("island", {
        url: "/#island",
        title: "Dynamic Island",
        width: 140,
        height: 36,
        x: 890,
        y: 5,
        resizable: false,
        decorations: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        focus: false,
      });
      
      // 等待窗口创建完成
      await new Promise<void>((resolve, reject) => {
        islandWindow!.once("tauri://created", () => {
          logger.debug("Island window created");
          resolve();
        });
        islandWindow!.once("tauri://error", (e) => {
          logger.error("Island window creation error:", e);
          reject(e);
        });
      });
    }
  } catch (error) {
    logger.error("Show island error:", error);
  }
}

/**
 * 隐藏/关闭灵动岛
 */
export async function hideIsland(): Promise<void> {
  try {
    islandWindow = await getIslandWindow();
    if (islandWindow) {
      await islandWindow.close();
      islandWindow = null;
    }
  } catch (error) {
    logger.error("Hide island error:", error);
  }
}

/**
 * 检查灵动岛是否可见
 */
export async function isIslandVisible(): Promise<boolean> {
  try {
    islandWindow = await getIslandWindow();
    if (islandWindow) {
      return await islandWindow.isVisible();
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * 设置灵动岛位置
 */
export async function setIslandPosition(position: IslandPosition): Promise<void> {
  if (!isTauri) return;
  
  try {
    islandWindow = await getIslandWindow();
    if (islandWindow) {
      const { x, y } = POSITION_MAP[position];
      await islandWindow.setPosition(new PhysicalPosition(x, y));
    }
  } catch (error) {
    logger.error("Set island position error:", error);
  }
}
