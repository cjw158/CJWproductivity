# 🧠 MindWall - 心智墙

> 一款「零摩擦」的桌面任务管理应用，将你的任务清单无缝融入桌面壁纸

![Tauri](https://img.shields.io/badge/Tauri-v2-blue?logo=tauri)
![React](https://img.shields.io/badge/React-18-61dafb?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ 功能特性

### 📥 记录功能
- **智能识别 (Smart Capture)**：支持自然语言输入，如 "明天下午3点开会"，自动识别日期和时间
- **快捷键唤起**：同时按 `F` + `J` 随时随地快速记录
- **双模式切换**：按 `Tab` 在笔记/任务模式间切换
- **笔记模式**：支持指定文件夹分类存储
- **任务模式**：支持设置重要/紧急、截止日期、预计时长

### 🧘‍♂️ 专注模式 (Zen Mode)
- **可拖拽 HUD**：点击任务卡片上的 ▶️ 按钮进入专注模式
- **计时器胶囊**：可最小化的悬浮计时器，不遮挡视线
- **时间到提醒**：计时结束时胶囊闪烁 + 系统通知弹窗

### 📊 每日回顾
- **自动弹出**：每天首次打开应用时显示回顾弹窗
- **统计展示**：昨日完成数量 + 今日待办数量
- **优先级提醒**：显示紧急/重要任务数量

### 🖱️ 右键菜单
- **右键任务卡片**：弹出操作菜单
- **快捷操作**：完成、复制、标记重要/紧急、移动到象限、删除

### ✅ 批量操作
- **Shift + 点击**：多选任务
- **批量工具栏**：底部弹出操作栏，一键完成/删除/标记

### 📋 看板视图
- **四列工作流**：收件箱 → 待办 → 执行中 → 已完成
- **WIP 限制**：执行中最多 3 个任务，保持专注
- **拖拽排序**：自由调整任务顺序和状态

### 📅 日历视图
- **月历总览**：查看任务在各日期的分布
- **时间块规划**：TickTick 风格的时间轴日视图
- **拖拽排期**：将待排期任务拖入时间轴
- **未排期提醒**：右侧显示未安排日期的任务

### 🎯 矩阵视图
- **艾森豪威尔四象限**：按重要/紧急维度分类
- **待分类区域**：显示未标记的任务
- **拖拽分类**：快速将任务拖入对应象限

### 🖼️ 壁纸引擎
- **实时渲染**：将任务清单渲染到桌面壁纸
- **自动更新**：任务变化自动刷新壁纸
- **高度自定义**：支持自定义背景和布局

### 🎨 设计美学
- **双主题支持**：霓虹暗黑 / Apple 浅色
- **毛玻璃效果**：精致的玻璃态 UI
- **流畅动画**：基于物理的弹性动画
- **统一卡片**：三视图任务卡片样式一致

---

## 🏗️ 技术架构

### 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **桌面框架** | Tauri v2 | Rust + WebView2，轻量高性能 |
| **前端框架** | React 18 | 函数式组件 + Hooks |
| **开发语言** | TypeScript 5 | 类型安全 |
| **构建工具** | Vite 5 | 极速 HMR |
| **样式方案** | Tailwind CSS | 原子化 CSS |
| **UI 组件** | shadcn/ui | 可定制组件库 |
| **动画引擎** | Framer Motion | 声明式动画 |
| **状态管理** | TanStack Query | 服务端状态缓存 |
| **拖拽交互** | dnd-kit | 现代化拖拽库 |
| **数据库** | SQLite | 本地持久化存储 |

### 项目结构

```
src/
├── components/           # React 组件
│   ├── ui/              # 基础 UI 组件 (shadcn/ui)
│   ├── Header.tsx       # 顶部导航栏
│   ├── Spotlight.tsx    # 记录面板
│   ├── TasksView.tsx    # 任务视图容器
│   ├── KanbanBoard.tsx  # 看板视图
│   ├── KanbanColumn.tsx # 看板列
│   ├── CalendarView.tsx # 日历视图
│   ├── TimeBlockView.tsx# 时间块日视图
│   ├── Dashboard.tsx    # 矩阵视图
│   ├── Quadrant.tsx     # 矩阵象限
│   ├── UnifiedTaskCard.tsx # 统一任务卡片
│   ├── NotesLayout.tsx  # 笔记视图
│   └── WallpaperRenderer.tsx # 壁纸渲染
├── hooks/               # 自定义 Hooks
│   ├── useTasks.ts      # 任务数据操作
│   ├── useNotes.ts      # 笔记数据操作
│   ├── useToast.ts      # Toast 通知
│   └── useEnergyMode.ts # 能量模式
├── lib/                 # 工具库
│   ├── tasks.ts         # 任务 CRUD
│   ├── notes.ts         # 笔记 CRUD
│   ├── database.ts      # 数据库连接
│   └── utils.ts         # 工具函数
├── contexts/            # React Context
│   └── ThemeContext.tsx # 主题上下文
├── App.tsx              # 应用入口
├── main.tsx             # React 挂载点
└── index.css            # 全局样式
```

---

## 📊 数据模型

### Task 任务

```typescript
interface Task {
  id: number;
  content: string;           // 任务内容
  status: TaskStatus;        // INBOX | TODO | DOING | DONE
  is_urgent: boolean;        // 是否紧急
  is_important: boolean;     // 是否重要
  due_date: string | null;   // 截止日期 (YYYY-MM-DD)
  scheduled_time: string | null; // 排期时间 (HH:mm)
  duration: number | null;   // 预计时长（分钟）
  created_at: string;        // 创建时间
  completed_at: string | null; // 完成时间
}
```

### Note 笔记

```typescript
interface Note {
  id: string;
  content: string;           // 笔记内容 (Markdown)
  folder_id: string | null;  // 所属文件夹
  is_pinned: boolean;        // 是否置顶
  created_at: string;
  updated_at: string;
}
```

---

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18.0
- **Rust** (最新稳定版)
- **Tauri 依赖** ([查看文档](https://tauri.app/v1/guides/getting-started/prerequisites))

### 安装步骤

```bash
# 1. 克隆项目
git clone <repository-url>
cd pj

# 2. 安装依赖
npm install

# 3. 开发模式运行
npm run tauri dev

# 4. 生产构建
npm run tauri build
```

### 纯前端预览

```bash
# 无需 Rust 环境，快速预览 UI
npm run dev
```

---

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Shift` + `F` + `J` | 全局快速捕获（打开悬浮窗，再按保存关闭） |
| `Ctrl/⌘ + N` | 打开完整记录面板 |
| `Tab` | 切换笔记/任务模式 |
| `Enter` | 保存并关闭（快速捕获模式） |
| `Ctrl/⌘ + Enter` | 保存记录（完整面板） |
| `Alt + Enter` | 应用 NLP 识别结果 |
| `Escape` | 关闭面板 |

### 全局快速捕获工作流
1. 在任何应用中工作时，按 `Shift+F+J` 唤起胶囊悬浮窗
2. 输入想法或任务，按 `Tab` 切换模式
3. 再按 `Shift+F+J` 或 `Enter` 保存并关闭

---

## 🎯 艾森豪威尔矩阵

任务按重要性和紧急性分为四个象限：

| 象限 | 类型 | 建议 |
|------|------|------|
| 🔴 **Q1** | 重要且紧急 | 立即执行 |
| 🔵 **Q2** | 重要不紧急 | 计划安排 |
| 🟡 **Q3** | 紧急不重要 | 委托他人 |
| 🟣 **Q4** | 不重要不紧急 | 考虑删除 |

---

## 🎨 主题系统

### 霓虹暗黑主题
- 深色背景 + 霓虹色彩
- 发光边框效果
- 适合夜间使用

### Apple 浅色主题
- 参考 iOS 设计语言
- 护眼柔和配色
- 适合白天使用

---

## 📁 文件说明

| 文件 | 说明 |
|------|------|
| `package.json` | 项目配置和依赖 |
| `vite.config.ts` | Vite 构建配置 |
| `tailwind.config.js` | Tailwind CSS 配置 |
| `tsconfig.json` | TypeScript 配置 |
| `src-tauri/` | Tauri 后端 (Rust) |

---

## 🔧 开发指南

### 添加新任务属性

1. 更新 `src/lib/tasks.ts` 中的类型定义
2. 更新 Mock 数据库逻辑
3. 更新真实数据库 SQL 语句
4. 更新相关组件 UI

### 添加新视图

1. 在 `src/components/` 创建新组件
2. 在 `TasksView.tsx` 中添加视图切换
3. 添加对应的导航按钮

### 样式规范

- 使用 CSS 变量定义颜色（`--neon-*`, `--color-*`）
- 优先使用 Tailwind 工具类
- 动画使用 Framer Motion
- 保持深色/浅色主题兼容

---

## 📝 更新日志

> 详细更新日志请查看 [CHANGELOG.md](./CHANGELOG.md)

### v0.3.0 (2024-12)
- ✨ 新增 Smart Capture：支持自然语言日期识别
- ✨ 新增 Zen Mode：可拖拽悬浮计时器 HUD
- ✨ 新增计时结束闪烁 + 系统通知提醒
- ✨ 新增每日回顾弹窗（昨日完成/今日待办统计）
- ✨ 新增右键菜单（完成/复制/移动到象限/删除）
- ✨ 新增批量操作（Shift+点击多选）
- ⌨️ 快捷键改为 F+J 唤起记录面板
- 📝 更新项目文档

### v0.2.0 (2024-11)
- ✨ 新增时间块规划功能
- ✨ 统一三视图任务卡片样式
- ✨ 记录功能支持设置任务属性
- ✨ 矩阵视图添加待分类区域
- ✨ 日历视图添加未排期侧边栏
- 🔧 优化代码结构和性能
- 🐛 修复 FluidText 重复嵌套问题

### v0.1.0 (2024-10)
- 🎉 项目初始化
- ✨ 基础看板功能
- ✨ 艾森豪威尔矩阵
- ✨ 壁纸渲染引擎
- ✨ 双主题支持

---

## 📄 开源协议

[MIT License](LICENSE)

---

<p align="center">
  <b>Made with ❤️ by CJW</b>
</p>
