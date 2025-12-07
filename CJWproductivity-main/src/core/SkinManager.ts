/**
 * @file core/SkinManager.ts
 * @description 皮肤加载和管理器
 */

import type { CJWSkin } from "./types";
import { EventBus } from "./EventBus";

/**
 * 皮肤管理器
 * 负责皮肤的注册、应用和移除
 */
class SkinManager {
  private skins: Map<string, CJWSkin> = new Map();
  private appliedSkins: Map<string, CJWSkin> = new Map(); // key: type
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  /**
   * 注册皮肤
   * @param skin 皮肤定义
   */
  register(skin: CJWSkin): void {
    if (this.skins.has(skin.id)) {
      console.warn(`[SkinManager] Skin ${skin.id} already registered`);
      return;
    }
    this.skins.set(skin.id, skin);
    console.log(`[SkinManager] Skin registered: ${skin.id}`);
  }

  /**
   * 批量注册皮肤
   * @param skins 皮肤数组
   */
  registerBatch(skins: CJWSkin[]): void {
    skins.forEach(skin => this.register(skin));
  }

  /**
   * 应用皮肤
   * @param skinId 皮肤ID
   */
  async apply(skinId: string): Promise<void> {
    const skin = this.skins.get(skinId);
    if (!skin) {
      throw new Error(`[SkinManager] Skin ${skinId} not found`);
    }

    // 移除同类型的旧皮肤
    const oldSkin = this.appliedSkins.get(skin.type);
    if (oldSkin) {
      await this.remove(oldSkin.id);
    }

    // 应用新皮肤
    try {
      if (skin.assets.css) {
        await this.loadCSS(skin.id, skin.assets.css);
      }

      if (skin.assets.variables) {
        this.applyVariables(skin.assets.variables);
      }

      if (skin.onApply) {
        skin.onApply();
      }

      this.appliedSkins.set(skin.type, skin);
      this.eventBus.emit("skin:applied", { skinId });
      console.log(`[SkinManager] Skin applied: ${skinId}`);
    } catch (error) {
      console.error(`[SkinManager] Failed to apply skin ${skinId}:`, error);
      throw error;
    }
  }

  /**
   * 移除皮肤
   * @param skinId 皮肤ID
   */
  async remove(skinId: string): Promise<void> {
    const skin = this.skins.get(skinId);
    if (!skin) {
      return;
    }

    // 移除 CSS
    const styleEl = document.getElementById(`skin-${skinId}`);
    if (styleEl) {
      styleEl.remove();
    }

    // 移除变量 (恢复默认值需要主题系统支持)
    if (skin.assets.variables) {
      this.removeVariables(skin.assets.variables);
    }

    if (skin.onRemove) {
      try {
        skin.onRemove();
      } catch (error) {
        console.error(`[SkinManager] Error in onRemove for skin ${skinId}:`, error);
      }
    }

    this.appliedSkins.delete(skin.type);
    this.eventBus.emit("skin:removed", { skinId });
    console.log(`[SkinManager] Skin removed: ${skinId}`);
  }

  /**
   * 加载CSS文件
   * @param id 皮肤ID
   * @param path CSS文件路径
   */
  private async loadCSS(id: string, path: string): Promise<void> {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load CSS: ${response.statusText}`);
      }
      const css = await response.text();

      const style = document.createElement("style");
      style.id = `skin-${id}`;
      style.textContent = css;
      document.head.appendChild(style);
    } catch (error) {
      console.error(`[SkinManager] Failed to load CSS from ${path}:`, error);
      throw error;
    }
  }

  /**
   * 应用CSS变量
   * @param variables CSS变量映射
   */
  private applyVariables(variables: Record<string, string>): void {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(variables)) {
      root.style.setProperty(key, value);
    }
  }

  /**
   * 移除CSS变量
   * @param variables CSS变量映射
   */
  private removeVariables(variables: Record<string, string>): void {
    const root = document.documentElement;
    for (const key of Object.keys(variables)) {
      root.style.removeProperty(key);
    }
  }

  /**
   * 获取已应用的皮肤
   * @param type 皮肤类型
   * @returns 皮肤定义或undefined
   */
  getAppliedSkin(type: string): CJWSkin | undefined {
    return this.appliedSkins.get(type);
  }

  /**
   * 获取所有已注册皮肤
   * @returns 皮肤数组
   */
  getAllSkins(): CJWSkin[] {
    return Array.from(this.skins.values());
  }

  /**
   * 按类型获取皮肤
   * @param type 皮肤类型
   * @returns 该类型的所有皮肤
   */
  getSkinsByType(type: CJWSkin["type"]): CJWSkin[] {
    return this.getAllSkins().filter(skin => skin.type === type);
  }

  /**
   * 获取皮肤定义
   * @param skinId 皮肤ID
   * @returns 皮肤定义或undefined
   */
  getSkin(skinId: string): CJWSkin | undefined {
    return this.skins.get(skinId);
  }

  /**
   * 检查皮肤是否已应用
   * @param skinId 皮肤ID
   * @returns 是否已应用
   */
  isApplied(skinId: string): boolean {
    return Array.from(this.appliedSkins.values()).some(skin => skin.id === skinId);
  }
}

// 单例模式
let instance: SkinManager | null = null;

/**
 * 获取皮肤管理器单例
 */
export function getSkinManager(): SkinManager {
  if (!instance) {
    const { getEventBus } = require("./EventBus");
    instance = new SkinManager(getEventBus());
  }
  return instance;
}

export { SkinManager };
