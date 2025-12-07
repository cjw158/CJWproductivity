/**
 * @file services/islandWindow.ts
 * @description 灵动岛窗口管理服务
 */

import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalSize } from "@tauri-apps/api/dpi";

/**
 * 调整灵动岛窗口大小
 * @param width 窗口宽度（像素）
 * @param height 窗口高度（像素）
 */
export async function resizeIslandWindow(width: number, height: number): Promise<void> {
  try {
    const win = getCurrentWindow();
    await win.setSize(new LogicalSize(width, height));
  } catch (error) {
    console.error("[IslandWindow] Failed to resize window:", error);
  }
}

/**
 * 显示灵动岛窗口
 */
export async function showIslandWindow(): Promise<void> {
  try {
    const win = getCurrentWindow();
    await win.show();
    await win.setFocus();
  } catch (error) {
    console.error("[IslandWindow] Failed to show window:", error);
  }
}

/**
 * 隐藏灵动岛窗口
 */
export async function hideIslandWindow(): Promise<void> {
  try {
    const win = getCurrentWindow();
    await win.hide();
  } catch (error) {
    console.error("[IslandWindow] Failed to hide window:", error);
  }
}

/**
 * 检查灵动岛窗口是否可见
 * @returns 是否可见
 */
export async function isIslandVisible(): Promise<boolean> {
  try {
    const win = getCurrentWindow();
    return await win.isVisible();
  } catch (error) {
    console.error("[IslandWindow] Failed to check visibility:", error);
    return false;
  }
}

/**
 * 开始拖动灵动岛窗口
 */
export async function startDraggingIsland(): Promise<void> {
  try {
    const win = getCurrentWindow();
    await win.startDragging();
  } catch (error) {
    // 拖动失败是正常的，不记录错误
  }
}
