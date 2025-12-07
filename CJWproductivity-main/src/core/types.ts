/**
 * @file core/types.ts
 * @description CJW 模块化系统的核心类型定义
 */

import { ComponentType } from "react";

/**
 * CJW 模块接口
 * 所有功能模块必须实现此接口
 */
export interface CJWModule {
  // ========== 基础信息 ==========
  /** 模块唯一标识 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 版本号 */
  version: string;
  /** 描述 */
  description?: string;
  /** 图标 (Lucide 图标名或组件) */
  icon?: string | ComponentType;
  
  // ========== 依赖声明 ==========
  /** 硬依赖 (必须先加载) */
  dependencies?: string[];
  /** 软依赖 (有则增强，无则降级) */
  optionalDeps?: string[];
  
  // ========== 生命周期 ==========
  /** 模块初始化 (异步) */
  onLoad?: () => Promise<void>;
  /** 模块卸载 */
  onUnload?: () => Promise<void>;
  /** 模块激活 (切换到此模块时) */
  onActivate?: () => void;
  /** 模块停用 */
  onDeactivate?: () => void;
  
  // ========== UI 注册 ==========
  /** 路由配置 */
  routes?: RouteConfig[];
  /** Header 按钮 */
  headerActions?: HeaderAction[];
  /** 灵动岛小部件 */
  islandWidgets?: IslandWidget[];
  /** 设置面板 */
  settingsPanels?: SettingsPanel[];
  
  // ========== 数据 ==========
  /** 数据库表 Schema */
  tables?: TableSchema[];
  
  // ========== API ==========
  /** 对外暴露的 API */
  api?: Record<string, (...args: any[]) => any>;
}

/**
 * 路由配置
 */
export interface RouteConfig {
  path: string;
  component: ComponentType;
  exact?: boolean;
}

/**
 * Header 操作按钮
 */
export interface HeaderAction {
  id: string;
  icon: ComponentType;
  label: string;
  onClick?: () => void;
}

/**
 * 灵动岛小部件
 */
export interface IslandWidget {
  id: string;
  component: ComponentType;
  priority: number;
}

/**
 * 设置面板配置
 */
export interface SettingsPanel {
  id: string;
  icon: ComponentType | string;
  label: string;
  component: ComponentType;
}

/**
 * 数据库表定义
 */
export interface TableSchema {
  name: string;
  sql: string;
  indexes?: string[];
}

/**
 * 皮肤接口
 */
export interface CJWSkin {
  /** 皮肤唯一标识 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 皮肤类型 */
  type: "theme" | "island" | "effect" | "sound";
  /** 版本号 */
  version: string;
  /** 描述 */
  description?: string;
  /** 预览图 */
  preview?: string;
  
  /** 资源路径 */
  assets: {
    css?: string;
    variables?: Record<string, string>;
    sounds?: Record<string, string>;
  };
  
  /** 应用皮肤时的回调 */
  onApply?: () => void;
  /** 移除皮肤时的回调 */
  onRemove?: () => void;
}

/**
 * 事件类型定义
 */
export interface ModuleEvents {
  "module:loaded": { moduleId: string };
  "module:unloaded": { moduleId: string };
  "module:activated": { moduleId: string };
  "module:deactivated": { moduleId: string };
  "skin:applied": { skinId: string };
  "skin:removed": { skinId: string };
}

/**
 * 事件处理器类型
 */
export type EventHandler<T = any> = (data?: T) => void;
