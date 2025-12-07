/**
 * @file island/index.ts
 * @description 灵动岛模块统一导出
 */

// 模块定义
export { islandModule } from "./module";

// 类型
export type * from "./types";

// 常量
export { ISLAND_CONFIG, COLORS, SYSTEM_FONT } from "./constants";

// Hooks
export * from "./hooks";

// 工具函数
export * from "./utils";

// 组件
export { DynamicIsland } from "./components/DynamicIsland";
export * from "./components";

// 服务
export * from "./services/islandWindow";
