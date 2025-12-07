/**
 * @file generated/modules.example.ts
 * @description 模块注册示例文件（构建时自动生成）
 * 
 * 此文件展示了构建系统将如何根据配置文件自动生成模块注册代码
 * 实际的 modules.ts 文件会在构建时根据 build.config.json 生成
 */

// ========================================
// 自动生成的模块注册文件
// 请勿手动修改 - 由构建脚本生成
// ========================================

import { getModuleManager } from "@/core/ModuleManager";

// 根据配置导入模块
import { islandModule } from "@/modules/island";
// import { notesModule } from "@/modules/notes";
// import { plansModule } from "@/modules/plans";
// import { calendarModule } from "@/modules/calendar";
// import { focusModule } from "@/modules/focus";
// import { wallpaperModule } from "@/modules/wallpaper";

/**
 * 注册所有已启用的模块
 */
export function registerModules(): void {
  const moduleManager = getModuleManager();
  
  console.log("[ModuleRegistry] Registering modules...");
  
  // 按照配置注册模块
  moduleManager.register(islandModule);
  // moduleManager.register(notesModule);
  // moduleManager.register(plansModule);
  // moduleManager.register(calendarModule);
  // moduleManager.register(focusModule);
  // moduleManager.register(wallpaperModule);
  
  console.log("[ModuleRegistry] Modules registered:", moduleManager.getAllModules().length);
}

/**
 * 加载所有核心模块
 */
export async function loadCoreModules(): Promise<void> {
  const moduleManager = getModuleManager();
  
  console.log("[ModuleRegistry] Loading core modules...");
  
  // 加载基础模块
  // await moduleManager.load("calendar");
  // await moduleManager.load("notes");
  
  // 加载可选模块
  if (moduleManager.isRegistered("island")) {
    await moduleManager.load("island");
  }
  
  // if (moduleManager.isRegistered("plans")) {
  //   await moduleManager.load("plans");
  // }
  
  // if (moduleManager.isRegistered("focus")) {
  //   await moduleManager.load("focus");
  // }
  
  // if (moduleManager.isRegistered("wallpaper")) {
  //   await moduleManager.load("wallpaper");
  // }
  
  console.log("[ModuleRegistry] Core modules loaded:", moduleManager.getLoadedModules());
}
