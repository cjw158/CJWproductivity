/**
 * @file island/module.ts
 * @description 灵动岛模块定义
 */

import type { CJWModule } from "@/core/types";

/**
 * 灵动岛模块
 * 
 * 功能：
 * - 桌面悬浮任务面板
 * - 显示今日任务列表
 * - 快速捕获笔记
 * - 番茄钟计时器
 */
export const islandModule: CJWModule = {
  id: "island",
  name: "灵动岛",
  version: "1.0.0",
  description: "桌面悬浮任务面板，显示今日任务、快速捕获、番茄计时",
  icon: "Sparkles",
  
  // 依赖声明
  dependencies: [], // 核心功能，无硬依赖
  optionalDeps: ["calendar", "notes"], // 可选依赖任务和笔记模块
  
  // 生命周期
  async onLoad() {
    console.log("[Island] Module loading...");
    
    // 初始化灵动岛窗口 (Tauri)
    if (typeof window !== "undefined" && "__TAURI__" in window) {
      // 窗口已由 Tauri 配置创建，这里可以进行额外初始化
      console.log("[Island] Tauri window detected");
    }
    
    console.log("[Island] Module loaded successfully");
  },
  
  async onUnload() {
    console.log("[Island] Module unloading...");
    // 清理资源
  },
  
  onActivate() {
    console.log("[Island] Module activated");
  },
  
  onDeactivate() {
    console.log("[Island] Module deactivated");
  },
  
  // 灵动岛不注册路由（独立窗口）
  routes: [],
  
  // 注册设置面板
  settingsPanels: [
    {
      id: "island",
      icon: "Sparkles",
      label: "灵动岛",
      component: () => import("./components/IslandSettings").then(m => m.default).catch(() => null),
    },
  ],
  
  // 对外 API
  api: {
    /**
     * 显示灵动岛
     */
    show: async () => {
      const { showIsland } = await import("@/lib/island");
      return showIsland();
    },
    
    /**
     * 隐藏灵动岛
     */
    hide: async () => {
      if (typeof window !== "undefined" && "__TAURI__" in window) {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        await getCurrentWindow().hide();
      }
    },
    
    /**
     * 切换灵动岛显示状态
     */
    toggle: async () => {
      const { toggleIsland } = await import("@/lib/island");
      return toggleIsland();
    },
    
    /**
     * 触发快速捕获
     */
    triggerCapture: () => {
      window.dispatchEvent(new CustomEvent("island-capture"));
    },
    
    /**
     * 检查灵动岛是否可见
     */
    isVisible: async () => {
      if (typeof window !== "undefined" && "__TAURI__" in window) {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        return await getCurrentWindow().isVisible();
      }
      return false;
    },
  },
};
