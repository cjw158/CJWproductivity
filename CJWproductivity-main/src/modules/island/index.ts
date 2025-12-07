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

// 组件 - 按需导出
// export { DynamicIsland } from "./components/DynamicIsland";
// export { IslandCollapsed } from "./components/IslandCollapsed";
// export { IslandExpanded } from "./components/IslandExpanded";
// export { IslandCapture } from "./components/IslandCapture";

// 图标组件
export * from "./components/icons";
