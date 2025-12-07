/**
 * @file core/ModuleManager.ts
 * @description 模块注册、加载、卸载管理器
 */

import type { CJWModule } from "./types";
import { EventBus } from "./EventBus";

/**
 * 模块管理器
 * 负责模块的注册、加载、卸载和生命周期管理
 */
class ModuleManager {
  private modules: Map<string, CJWModule> = new Map();
  private loadedModules: Set<string> = new Set();
  private activeModule: string | null = null;
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  /**
   * 注册模块
   * @param module 模块定义
   */
  register(module: CJWModule): void {
    if (this.modules.has(module.id)) {
      console.warn(`[ModuleManager] Module ${module.id} already registered`);
      return;
    }
    this.modules.set(module.id, module);
    console.log(`[ModuleManager] Module registered: ${module.id}`);
  }

  /**
   * 批量注册模块
   * @param modules 模块数组
   */
  registerBatch(modules: CJWModule[]): void {
    modules.forEach(module => this.register(module));
  }

  /**
   * 加载模块
   * @param moduleId 模块ID
   */
  async load(moduleId: string): Promise<void> {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`[ModuleManager] Module ${moduleId} not found`);
    }

    if (this.loadedModules.has(moduleId)) {
      console.log(`[ModuleManager] Module ${moduleId} already loaded`);
      return;
    }

    // 加载依赖
    for (const depId of module.dependencies || []) {
      if (!this.loadedModules.has(depId)) {
        await this.load(depId);
      }
    }

    // 加载可选依赖 (不阻塞)
    for (const depId of module.optionalDeps || []) {
      if (!this.loadedModules.has(depId)) {
        try {
          await this.load(depId);
        } catch (error) {
          console.warn(`[ModuleManager] Optional dependency ${depId} failed to load:`, error);
        }
      }
    }

    // 执行 onLoad
    if (module.onLoad) {
      try {
        await module.onLoad();
      } catch (error) {
        console.error(`[ModuleManager] Module ${moduleId} onLoad failed:`, error);
        throw error;
      }
    }

    this.loadedModules.add(moduleId);
    this.eventBus.emit("module:loaded", { moduleId });
    console.log(`[ModuleManager] Module loaded: ${moduleId}`);
  }

  /**
   * 卸载模块
   * @param moduleId 模块ID
   */
  async unload(moduleId: string): Promise<void> {
    const module = this.modules.get(moduleId);
    if (!module || !this.loadedModules.has(moduleId)) {
      return;
    }

    // 如果是激活模块，先停用
    if (this.activeModule === moduleId) {
      this.deactivate(moduleId);
    }

    // 执行 onUnload
    if (module.onUnload) {
      try {
        await module.onUnload();
      } catch (error) {
        console.error(`[ModuleManager] Module ${moduleId} onUnload failed:`, error);
      }
    }

    this.loadedModules.delete(moduleId);
    this.eventBus.emit("module:unloaded", { moduleId });
    console.log(`[ModuleManager] Module unloaded: ${moduleId}`);
  }

  /**
   * 激活模块
   * @param moduleId 模块ID
   */
  activate(moduleId: string): void {
    const module = this.modules.get(moduleId);
    if (!module || !this.loadedModules.has(moduleId)) {
      console.warn(`[ModuleManager] Cannot activate module ${moduleId}: not loaded`);
      return;
    }

    // 停用当前激活的模块
    if (this.activeModule && this.activeModule !== moduleId) {
      this.deactivate(this.activeModule);
    }

    if (module.onActivate) {
      module.onActivate();
    }

    this.activeModule = moduleId;
    this.eventBus.emit("module:activated", { moduleId });
    console.log(`[ModuleManager] Module activated: ${moduleId}`);
  }

  /**
   * 停用模块
   * @param moduleId 模块ID
   */
  deactivate(moduleId: string): void {
    const module = this.modules.get(moduleId);
    if (!module || this.activeModule !== moduleId) {
      return;
    }

    if (module.onDeactivate) {
      module.onDeactivate();
    }

    this.activeModule = null;
    this.eventBus.emit("module:deactivated", { moduleId });
    console.log(`[ModuleManager] Module deactivated: ${moduleId}`);
  }

  /**
   * 获取模块 API
   * @param moduleId 模块ID
   * @returns 模块API或null
   */
  getAPI<T extends Record<string, Function>>(moduleId: string): T | null {
    const module = this.modules.get(moduleId);
    if (module && this.loadedModules.has(moduleId) && module.api) {
      return module.api as T;
    }
    return null;
  }

  /**
   * 获取模块定义
   * @param moduleId 模块ID
   * @returns 模块定义或undefined
   */
  getModule(moduleId: string): CJWModule | undefined {
    return this.modules.get(moduleId);
  }

  /**
   * 获取所有已注册模块
   * @returns 模块数组
   */
  getAllModules(): CJWModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * 获取所有已加载模块ID
   * @returns 模块ID数组
   */
  getLoadedModules(): string[] {
    return Array.from(this.loadedModules);
  }

  /**
   * 获取当前激活的模块ID
   * @returns 模块ID或null
   */
  getActiveModule(): string | null {
    return this.activeModule;
  }

  /**
   * 检查模块是否已加载
   * @param moduleId 模块ID
   * @returns 是否已加载
   */
  isLoaded(moduleId: string): boolean {
    return this.loadedModules.has(moduleId);
  }

  /**
   * 检查模块是否已注册
   * @param moduleId 模块ID
   * @returns 是否已注册
   */
  isRegistered(moduleId: string): boolean {
    return this.modules.has(moduleId);
  }
}

// 单例模式
let instance: ModuleManager | null = null;

/**
 * 获取模块管理器单例
 */
export function getModuleManager(): ModuleManager {
  if (!instance) {
    const { getEventBus } = require("./EventBus");
    instance = new ModuleManager(getEventBus());
  }
  return instance;
}

export { ModuleManager };
