# AI 编程指南

> 本文件是 AI 助手的"记忆文件"，每次新对话开始时请先阅读此文件。

## 项目概述

这是一个 **Tauri + React + TypeScript** 桌面生产力应用，包含：
- 任务管理（看板、日历、四象限）
- 笔记系统（富文本编辑）
- 灵动岛（桌面悬浮窗）
- 计划与目标管理

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Tauri 2.0 (Rust 后端) |
| 前端 | React 18 + TypeScript |
| 状态 | @tanstack/react-query |
| 样式 | TailwindCSS |
| 动画 | framer-motion |
| 数据库 | SQLite (via @tauri-apps/plugin-sql) |

## 关键目录结构

```
src/
├── components/     # React 组件
├── contexts/       # React Context（全局状态）
├── hooks/          # 自定义 Hooks
├── services/       # 数据层（Repository 模式）
├── lib/            # 工具库（数据库、日志等）
├── utils/          # 纯工具函数
├── types/          # TypeScript 类型定义
└── config/         # 常量配置
```

## 修改代码的规则

### ✅ 必须遵守
1. **常量放 `config/constants.ts`**，不要硬编码数字/字符串
2. **工具函数放 `utils/`**，不要在组件里写内联函数
3. **日志用 `logger`**，不要用 `console.log`
4. **类型定义放 `types/`**，不要用 `any`
5. **新组件超过 300 行时拆分**

### ❌ 禁止操作
1. 不要删除 `src/services/task/ITaskRepository.ts` 的接口定义
2. 不要修改 `src/lib/database.ts` 的表结构（除非明确要求迁移）
3. 不要在 `main.tsx` 之外创建 QueryClient

## 常用修改场景

### 场景 1：添加新任务字段
1. 修改 `src/types/index.ts` 的 `Task` 接口
2. 修改 `src/services/task/TaskRepository.ts` 的 SQL 语句
3. 修改 `src/lib/database.ts` 添加迁移语句
4. 修改相关组件使用新字段

### 场景 2：添加新设置项
1. 修改 `src/types/settings.ts` 添加类型
2. 修改 `DEFAULT_SETTINGS` 添加默认值
3. 修改 `src/contexts/ThemeContext.tsx` 或相关 Context

### 场景 3：添加新组件
1. 在 `src/components/` 创建文件
2. 组件用 `memo()` 包裹
3. 使用 `useTheme()` 获取主题
4. 使用 `cn()` 合并样式类名

### 场景 4：修改灵动岛
- 尺寸配置在 `config/constants.ts` 的 `ISLAND_CONFIG`
- 窗口控制在 `lib/island.ts`
- UI 在 `components/DynamicIsland.tsx`

## 快速定位文件

| 要改什么 | 看哪个文件 |
|---------|-----------|
| 任务数据操作 | `services/task/TaskRepository.ts` |
| 任务 UI 卡片 | `components/UnifiedTaskCard.tsx` |
| 任务右键菜单 | `components/TaskContextMenu.tsx` |
| 笔记编辑器 | `components/RichTextEditor.tsx` |
| 全局快捷键 | `lib/globalShortcuts.ts` |
| 主题切换 | `contexts/ThemeContext.tsx` |
| 数据库表结构 | `lib/database.ts` |
| 所有类型定义 | `types/index.ts` + `types/settings.ts` |
| 所有常量配置 | `config/constants.ts` |

## 调试命令

```bash
# 开发模式
npm run tauri dev

# 仅前端（浏览器）
npm run dev

# 构建
npm run tauri build
```

---

## 最近修改记录

| 日期 | 修改内容 | 涉及文件 |
|------|---------|---------|
| 2024-12-04 | 新增：独立启动窗口 | tauri.conf.json, main.rs, SplashWindow.tsx, App.tsx |
| 2024-12-04 | 优化：Logo 重设计 | public/logo.svg |
| 2024-12-04 | 新增：动态壁纸 & 开发者设置 | LiveWallpaper.tsx, SettingsModal.tsx |
| 2024-12-03 | 重构：抽取共享工具函数到 utils/ | DynamicIsland, utils/index.ts |
| 2024-12-03 | 重构：常量集中到 constants.ts | constants.ts, DynamicIsland, TimeBlockView |
| 2024-12-03 | 清理：console.log 替换为 logger | globalShortcuts.ts, island.ts |
