/**
 * @file globalShortcuts.ts
 * @description 全局快捷键注册 - 即使应用在后台也能响应
 */

import { register, unregisterAll } from "@tauri-apps/plugin-global-shortcut";
import { logger } from "./logger";

// 检查是否在 Tauri 环境中
const isTauri = typeof window !== "undefined" && "__TAURI__" in window;

export interface GlobalShortcutConfig {
  globalQuickCapture: string;
  globalToggleIsland: string;
  globalShowMain: string;
}

const DEFAULT_SHORTCUTS: GlobalShortcutConfig = {
  globalQuickCapture: "Alt+J",
  globalToggleIsland: "Alt+I", 
  globalShowMain: "Alt+M",
};

/**
 * 注册全局快捷键
 */
export async function registerGlobalShortcuts(
  config: Partial<GlobalShortcutConfig> = {}
): Promise<void> {
  logger.debug("registerGlobalShortcuts called, isTauri:", isTauri);
  
  if (!isTauri) {
    logger.debug("Global shortcuts: Not in Tauri environment, skipping");
    return;
  }

  const shortcuts = { ...DEFAULT_SHORTCUTS, ...config };
  logger.debug("Shortcuts config:", shortcuts);

  try {
    // 先清除所有已注册的快捷键
    await unregisterAll();
    logger.debug("All shortcuts unregistered");

    // 快速捕获 - 在灵动岛中快速添加任务
    await register(shortcuts.globalQuickCapture, async () => {
      logger.action("Quick Capture triggered");
      try {
        // 先确保灵动岛显示
        const { showIsland, isIslandVisible } = await import("@/lib/island");
        const visible = await isIslandVisible();
        
        if (!visible) {
          await showIsland();
          // 等待窗口显示
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // 使用 emit 发送全局事件（所有窗口都能收到）
        const { emit } = await import("@tauri-apps/api/event");
        await emit("island-capture-trigger", {});
      } catch (error) {
        logger.error("Failed to trigger capture:", error);
      }
    });
    logger.debug("Quick capture registered:", shortcuts.globalQuickCapture);

    // 切换灵动岛
    await register(shortcuts.globalToggleIsland, async () => {
      logger.action("Toggle Island triggered");
      try {
        const { toggleIsland } = await import("@/lib/island");
        await toggleIsland();
      } catch (error) {
        logger.error("Failed to toggle island:", error);
      }
    });

    // 显示主窗口
    await register(shortcuts.globalShowMain, async () => {
      logger.action("Show Main Window triggered");
      try {
        const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
        const mainWindow = await WebviewWindow.getByLabel("main");
        if (mainWindow) {
          await mainWindow.show();
          await mainWindow.unminimize();
          await mainWindow.setFocus();
        }
      } catch (error) {
        logger.error("Failed to show main window:", error);
      }
    });

    logger.info("Global shortcuts registered successfully", shortcuts);
  } catch (error) {
    logger.error("Failed to register global shortcuts:", error);
  }
}

/**
 * 取消注册所有全局快捷键
 */
export async function unregisterGlobalShortcuts(): Promise<void> {
  if (!isTauri) return;
  
  try {
    await unregisterAll();
    logger.debug("Global shortcuts unregistered");
  } catch (error) {
    logger.error("Failed to unregister global shortcuts:", error);
  }
}
