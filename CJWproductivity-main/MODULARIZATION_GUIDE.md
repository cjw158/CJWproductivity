# CJWproductivity 模块化改造指南

## 📋 概述

本文档指导如何将 CJWproductivity 从单体应用重构为模块化架构，实现按需打包、模块化销售和高度定制化。

## 🎯 改造目标

### 业务目标
- ✅ **动态打包**：按用户选择的模块组合生成安装包
- ✅ **按组件付费**：基础版免费，模块单独定价
- ✅ **皮肤销售**：主题、灵动岛皮肤、特效、音效包
- ✅ **高度定制**：高端用户一对一定制服务

### 技术目标
- ✅ **模块化**：每个功能独立，可单独编译/删除
- ✅ **松耦合**：模块间通过事件总线通信
- ✅ **皮肤系统**：支持热加载皮肤资源
- ✅ **离线优先**：无需登录、无需联网、本地许可

## 📁 目标架构

```
src/
├── core/                        # 核心层 (不可删除)
│   ├── ModuleManager.ts         # ✅ 已完成 - 模块注册与管理
│   ├── SkinManager.ts           # ✅ 已完成 - 皮肤加载与切换
│   ├── EventBus.ts              # ✅ 已完成 - 模块间通信
│   ├── types.ts                 # ✅ 已完成 - 核心类型定义
│   └── index.ts                 # ✅ 已完成 - 统一导出
│
├── modules/                     # 功能模块 (可按需编译)
│   ├── island/                  # 🚧 进行中 - 灵动岛模块
│   │   ├── components/
│   │   │   ├── icons/           # ✅ 已完成
│   │   │   │   ├── PulseIndicator.tsx
│   │   │   │   ├── CheckIcon.tsx
│   │   │   │   ├── CircleIcon.tsx
│   │   │   │   ├── CircularProgress.tsx
│   │   │   │   └── index.ts
│   │   │   ├── DynamicIsland.tsx      # 🚧 待拆分
│   │   │   ├── IslandCollapsed.tsx    # ⏳ 待创建
│   │   │   ├── IslandExpanded.tsx     # ⏳ 待创建
│   │   │   ├── IslandCapture.tsx      # ⏳ 待创建
│   │   │   ├── IslandTaskList.tsx     # ⏳ 待创建
│   │   │   └── IslandPomodoro.tsx     # ⏳ 待创建
│   │   ├── hooks/
│   │   │   ├── useIslandState.ts      # ✅ 已完成
│   │   │   ├── usePomodoro.ts         # ✅ 已完成
│   │   │   ├── useCapture.ts          # ✅ 已完成
│   │   │   ├── useIslandSize.ts       # ⏳ 待创建
│   │   │   └── useIslandEvents.ts     # ⏳ 待创建
│   │   ├── services/
│   │   │   └── islandWindow.ts        # ⏳ 待创建
│   │   ├── styles/
│   │   │   └── island.module.css      # ⏳ 待创建
│   │   ├── constants.ts               # ✅ 已完成
│   │   ├── types.ts                   # ✅ 已完成
│   │   ├── utils.ts                   # ✅ 已完成
│   │   ├── module.ts                  # ⏳ 待创建
│   │   └── index.ts                   # ⏳ 待创建
│   │
│   ├── notes/                   # ⏳ 待创建 - 笔记模块
│   ├── plans/                   # ⏳ 待创建 - 计划画廊模块
│   ├── calendar/                # ⏳ 待创建 - 日历模块
│   ├── focus/                   # ⏳ 待创建 - 专注模式模块
│   └── wallpaper/               # ⏳ 待创建 - 动态壁纸模块
│
├── shared/                      # 共享资源
│   ├── components/              # 通用 UI 组件
│   ├── hooks/                   # 通用 Hooks
│   ├── utils/                   # 工具函数
│   └── types/                   # 全局类型
│
├── skins/                       # 皮肤资源
│   ├── themes/                  # 主题皮肤
│   ├── island/                  # 灵动岛皮肤
│   └── effects/                 # 特效包
│
└── generated/                   # 构建时生成
    ├── modules.ts               # 模块注册代码
    └── features.ts              # Feature Flags
```

## 🔧 核心层说明

### ModuleManager
模块管理器负责模块的注册、加载、卸载和生命周期管理。

```typescript
import { getModuleManager } from "@/core/ModuleManager";

const mm = getModuleManager();

// 注册模块
mm.register(islandModule);

// 加载模块
await mm.load("island");

// 获取模块 API
const api = mm.getAPI<IslandAPI>("island");
```

### EventBus
事件总线用于模块间解耦通信。

```typescript
import { getEventBus } from "@/core/EventBus";

const bus = getEventBus();

// 订阅事件
const unsubscribe = bus.on("task:completed", (data) => {
  console.log("Task completed:", data);
});

// 发布事件
bus.emit("task:completed", { taskId: 123 });

// 取消订阅
unsubscribe();
```

### SkinManager
皮肤管理器负责皮肤的注册和应用。

```typescript
import { getSkinManager } from "@/core/SkinManager";

const sm = getSkinManager();

// 注册皮肤
sm.register(darkNeonSkin);

// 应用皮肤
await sm.apply("dark-neon");

// 移除皮肤
await sm.remove("dark-neon");
```

## 📝 模块接口规范

每个模块必须实现 `CJWModule` 接口：

```typescript
export interface CJWModule {
  // 基础信息
  id: string;
  name: string;
  version: string;
  description?: string;
  icon?: string | ComponentType;
  
  // 依赖声明
  dependencies?: string[];
  optionalDeps?: string[];
  
  // 生命周期
  onLoad?: () => Promise<void>;
  onUnload?: () => Promise<void>;
  onActivate?: () => void;
  onDeactivate?: () => void;
  
  // UI 注册
  routes?: RouteConfig[];
  headerActions?: HeaderAction[];
  islandWidgets?: IslandWidget[];
  settingsPanels?: SettingsPanel[];
  
  // 数据
  tables?: TableSchema[];
  
  // API
  api?: Record<string, (...args: any[]) => any>;
}
```

## 🚀 模块开发流程

### 1. 创建模块目录结构

```bash
mkdir -p src/modules/mymodule/{components,hooks,services,styles}
```

### 2. 定义模块

创建 `module.ts`：

```typescript
import type { CJWModule } from "@/core/types";

export const myModule: CJWModule = {
  id: "mymodule",
  name: "我的模块",
  version: "1.0.0",
  description: "模块描述",
  
  async onLoad() {
    console.log("Module loaded");
  },
  
  api: {
    doSomething: () => {
      console.log("Doing something");
    },
  },
};
```

### 3. 创建统一导出

创建 `index.ts`：

```typescript
export * from "./module";
export * from "./components";
export * from "./hooks";
export * from "./types";
```

### 4. 注册模块

在 `src/generated/modules.ts` 中注册（构建时自动生成）：

```typescript
import { myModule } from "@/modules/mymodule";

mm.register(myModule);
```

## 📦 构建系统

### 配置文件

创建 `build.config.json`：

```json
{
  "modules": {
    "calendar": true,
    "notes": true,
    "plans": true,
    "island": true,
    "focus": true,
    "wallpaper": false
  },
  "skins": {
    "themes": ["dark-neon", "light-apple"],
    "island": [],
    "effects": [],
    "sounds": []
  }
}
```

### 构建命令

```bash
# 基础版（免费）
npm run build -- --config=free.json

# 完整版
npm run build -- --config=full.json

# 自定义版
npm run build -- --config=custom.json
```

## 🎨 样式规范

### CSS Modules

每个模块使用独立的 CSS Modules 文件：

```css
/* island.module.css */
.container {
  position: relative;
  cursor: grab;
}

.content {
  width: 100%;
  height: 100%;
}
```

使用：

```typescript
import styles from "./styles/island.module.css";

<div className={styles.container}>
  <div className={styles.content}>...</div>
</div>
```

## ✅ 代码规范

### 组件规范
- 每个组件 < 300 行
- 使用 TypeScript
- 使用函数组件和 Hooks
- 使用 memo 优化性能
- Props 必须有类型定义

### Hook 规范
- Hook 函数以 `use` 开头
- 返回值使用对象解构
- 包含详细的 JSDoc 注释
- 单一职责原则

### 命名规范
- 模块目录：`kebab-case`
- 组件文件：`PascalCase.tsx`
- Hook 文件：`camelCase.ts`
- 样式文件：`kebab-case.module.css`
- 类型文件：`types.ts`

## 🧪 测试

### 单元测试

```typescript
import { renderHook } from "@testing-library/react";
import { usePomodoro } from "./usePomodoro";

test("pomodoro should start with initial minutes", () => {
  const { result } = renderHook(() => usePomodoro(25));
  expect(result.current.minutes).toBe(25);
});
```

## 📚 下一步工作

### Phase 1: 灵动岛模块 (优先级 P0)
1. ✅ 提取图标组件
2. ✅ 创建基础 Hooks
3. ⏳ 拆分主组件为 5 个子组件
4. ⏳ 创建服务层
5. ⏳ 创建样式文件
6. ⏳ 创建模块定义
7. ⏳ 测试功能完整性

### Phase 2: 笔记模块 (优先级 P0)
参见详细计划...

### Phase 3-8: 其他阶段
参见主文档...

## 🤝 贡献指南

1. 创建功能分支：`git checkout -b feature/module-name`
2. 遵循代码规范和目录结构
3. 编写测试用例
4. 提交 Pull Request
5. 等待代码审查

## 📖 参考资料

- [React 官方文档](https://react.dev/)
- [Tauri 官方文档](https://tauri.app/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)

## 📝 更新日志

### 2025-12-07
- ✅ 创建核心层基础设施（EventBus, ModuleManager, SkinManager）
- ✅ 定义模块接口和类型系统
- ✅ 提取灵动岛图标组件
- ✅ 创建灵动岛基础 Hooks（useIslandState, usePomodoro, useCapture）
- ✅ 创建模块化指南文档
