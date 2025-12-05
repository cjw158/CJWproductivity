# 组件目录说明

## 组件清单

| 组件 | 文件 | 行数 | 职责 |
|------|------|------|------|
| **Header** | `Header.tsx` | 263 | 顶部导航栏、主题切换、灵动岛开关 |
| **Background** | `Background.tsx` | 269 | 动态背景效果（光效、网格） |
| **UnifiedTaskCard** | `UnifiedTaskCard.tsx` | 344 | 统一任务卡片（标准/紧凑两种样式） |
| **TaskContextMenu** | `TaskContextMenu.tsx` | 224 | 任务右键菜单（编辑、删除、完成） |
| **BatchActionsBar** | `BatchActionsBar.tsx` | 138 | 多选批量操作栏 |
| **TimeBlockView** | `TimeBlockView.tsx` | 360 | 日程时间块视图 |
| **DynamicIsland** | `DynamicIsland.tsx` | ~760 | 桌面灵动岛悬浮窗 |
| **NotesLayout** | `NotesLayout.tsx` | 676 | 笔记模块（侧边栏+编辑器） |
| **PlansView** | `PlansView.tsx` | 842 | 计划视图（含图片灯箱） |
| **RichTextEditor** | `RichTextEditor.tsx` | 416 | 富文本编辑器（基于 TipTap） |
| **CalendarView** | `CalendarView.tsx` | 265 | 月历视图 |
| **SplashScreen** | `SplashScreen.tsx` | 157 | 启动画面 |
| **FocusOverlay** | `FocusOverlay.tsx` | 280 | 专注模式遮罩层 |

## 子目录

| 目录 | 说明 |
|------|------|
| `QuickCapture/` | 快速捕获组件（任务/笔记快速添加） |
| `calendar/` | 日历相关组件 |
| `common/` | 通用小组件 |
| `ui/` | 基础 UI 组件（button, input, toast 等） |

## 修改指南

- 改任务卡片样式 → `UnifiedTaskCard.tsx`
- 改任务右键菜单 → `TaskContextMenu.tsx`
- 改笔记编辑器 → `RichTextEditor.tsx`
- 改灵动岛 → `DynamicIsland.tsx` + `config/constants.ts`
- 改日历视图 → `CalendarView.tsx`
