# 更新日志

> AI 每次修改后在此记录，帮助追踪项目演进。

## [未发布]

### 2024-12-05 - 架构优化与关键Bug修复

#### 🔴 红色危重区修复 (Critical)

##### 问题1：功能切换时前后端状态不匹配

**问题描述：**
- 切换功能时（如从待办切换到笔记），任务相关的右键菜单和批量操作栏仍然激活
- 用户在笔记界面可能点击到属于待办功能的按钮
- 严重影响用户体验和软件稳定性

**修复方案：**
1. 在 `App.tsx` 中，切换Tab时主动清除任务选择状态和右键菜单
2. 将 `TaskContextMenu` 和 `BatchActionsBar` 组件的渲染条件改为仅在任务视图激活时渲染
3. 引入 `useTaskSelection` hook 获取 `clearSelection` 和 `closeContextMenu` 方法

**修改代码：**
```typescript
// App.tsx - 切换Tab时清除状态
const handleTabChange = useCallback((tab: TabType) => {
  clearSelection();
  closeContextMenu();
  startTransition(() => {
    setActiveTab(tab);
  });
}, [clearSelection, closeContextMenu]);

// App.tsx - 条件渲染
{activeTab === "tasks" && <TaskContextMenu />}
{activeTab === "tasks" && <BatchActionsBar />}
```

##### 问题2：笔记文件夹存储丢失

**问题描述：**
- 用户在笔记功能中新建文件夹后，重启应用文件夹消失
- 原因：`mockFolders` 是内存数组，没有持久化到数据库
- 所有用户创建的文件夹都会在应用重启时丢失

**修复方案：**
1. 在 `database.ts` 中新增 `folders` 表
2. 重写 `getFolders()` 函数，从数据库读取文件夹
3. 重写 `createFolder()` 函数，持久化到数据库
4. 重写 `deleteFolder()` 函数，从数据库删除并保护笔记数据

**数据库新增表：**
```sql
CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'Folder',
  type TEXT DEFAULT 'user',
  created_at TEXT DEFAULT (datetime('now'))
);

-- 初始化系统文件夹
INSERT OR IGNORE INTO folders (id, name, icon, type) VALUES 
  ('all', '全部笔记', 'Archive', 'system'),
  ('trash', '最近删除', 'Trash2', 'system');
```

**关键优化：**
- 删除文件夹时，将其中的笔记移动到"全部笔记"而非直接删除，保护用户数据
- 支持浏览器环境的Mock回退机制

#### 📁 修改文件

**核心修改：**
- `src/App.tsx` - 添加Tab切换时的状态清理逻辑，条件渲染任务组件
- `src/lib/database.ts` - 新增folders表和索引
- `src/lib/notes.ts` - 重写文件夹CRUD操作，实现数据库持久化

**同步到 CJWproductivity-main：**
- `CJWproductivity-main/src/App.tsx`
- `CJWproductivity-main/src/lib/database.ts`
- `CJWproductivity-main/src/lib/notes.ts`

#### 🟡 黄色改善区优化 (Moderate)

- 移除了 `mockFolders` 中的硬编码用户文件夹（personal, work），仅保留系统文件夹作为回退
- 添加了详细的函数文档注释，说明各函数的职责和修复目的

#### 🟢 绿色保留区 (Stable)

以下模块保持不变，代码逻辑清晰稳定：
- `Header.tsx` - Tab切换逻辑
- `TasksView.tsx` - 任务视图
- `PlansView.tsx` - 计划视图
- `NotesLayout.tsx` - 笔记布局
- `TaskSelectionContext.tsx` - 任务选择状态管理
- `TaskActionsContext.tsx` - 任务操作Context

---

### 2024-12-04 - 独立启动窗口

#### ✨ 新增
- **独立启动窗口** - 仿 Notion/Linear 的优雅启动体验
  - 应用启动时先显示 320×240 的小窗口
  - 居中显示、无边框、透明背景
  - 包含 Logo 动画 + 加载进度条
  - 初始化完成后平滑过渡到主窗口

#### 🎨 设计
- Logo 弹性缩放动画 (spring 物理效果)
- 背景流光效果（青色 + 紫色渐变光晕）
- 品牌名渐变色展示
- 三点波浪加载指示器

#### 📁 修改文件
- `src-tauri/tauri.conf.json` - 添加 splash 窗口配置
- `src-tauri/src/main.rs` - 添加窗口控制命令
- `src/components/SplashWindow.tsx` - 新建启动窗口组件
- `src/App.tsx` - 添加 splash 路由判断

---

### 2024-12-04 - Logo 优化

#### 🎨 优化
- **Logo 重设计** - 移除正方形边框背景，仅保留 "CJW" 文字
- 使用 SF Pro Display 字体，700 粗体
- 透明背景 + 白色文字（浅色模式通过 CSS filter 反转为黑色）

#### 📁 修改文件
- `public/logo.svg` - 简化为纯文字 Logo

---

### 2024-12-04 - 动态壁纸 & 开发者设置

#### ✨ 新增
- **动态壁纸功能** - WebGL/Canvas 实现的动态壁纸效果
  - 流星云 (Nebula) - 模拟流星云的动态效果
  - 数字矩阵 (Matrix) - 数字雨效果
  - 粒子网络 (Particles) - 粒子和线条效果
  - 波浪线 (Waves) - 波浪动态效果
- **开发者设置界面** - 实验性功能集中管理
  - 壁纸类型选择
  - 不透明度调节 (0-100%)
  - 动画速度调节 (0.1x-2.0x)
  - FPS 显示开关

#### 📁 新增文件
- `src/components/LiveWallpaper.tsx` - 动态壁纸组件

#### 📁 修改文件
- `src/types/settings.ts` - 添加开发者设置类型
- `src/components/settings/SettingsModal.tsx` - 添加开发者设置 UI
- `src/App.tsx` - 集成动态壁纸组件

---

### 2024-12-04 - 数据备份与恢复功能

#### ✨ 新增
- **完整数据导出** - 导出任务、计划、关键结果、笔记、设置为 JSON 文件
- **数据恢复** - 从备份文件导入并恢复所有数据
- **Tauri 文件对话框** - 使用原生文件选择器选择保存位置

#### ⚠️ 已知限制
- 计划图片暂不支持备份（文件系统权限限制）

#### 📁 新增文件
- `src/lib/backup.ts` - 数据备份与恢复服务

#### 📁 修改文件
- `src/components/settings/SettingsModal.tsx` - 添加备份恢复 UI
- `src/services/settings/SettingsRepository.ts` - 修复 import 方法
- `src-tauri/capabilities/default.json` - 添加 dialog 和 fs 权限

---

### 2024-12-04 - 品牌标语更新 & Header 优化

#### 🔧 修改
- **品牌 Slogan** - "思维的墙，创意的源" → "Capture. Journal. Wrap-up."
- CJW = **C**apture（捕获）· **J**ournal（整理）· **W**rap-up（搞定）
- **Header 重设计** - Logo 区域改为纯文字，首字母带呼吸发光特效
- **底部进度条** - Header 底部增加时间进度条

#### 📁 涉及文件
- `src/components/SplashScreen.tsx` - 启动动画
- `src/components/Background.tsx` - 背景组件
- `src/components/Header.tsx` - 导航栏重设计
- `src/components/settings/SettingsModal.tsx` - 设置页关于
- `src/types/settings.ts` - FontSize 类型定义
- `src/contexts/ThemeContext.tsx` - 字体大小映射

---

### 2024-12-03 - 代码质量优化

#### 🔧 重构
- **console.log 替换为 logger** - 全局替换 20 处 console.log/error 为 logger.debug/error
- **any 类型修复** - 将 5 处 any 类型替换为具体类型（unknown、LucideIcon 等）

#### 📁 涉及文件
- `src/App.tsx`
- `src/components/Header.tsx`
- `src/components/DynamicIsland.tsx`
- `src/components/BatchActionsBar.tsx`
- `src/components/settings/SettingsModal.tsx`
- `src/services/settings/SettingsRepository.ts`
- `src/lib/notes.ts`

---

### 2024-12-03 - 添加目录说明文档

#### 📄 新增
- `src/hooks/README.md` - Hooks 用途说明
- `src/contexts/README.md` - Context 职责说明
- `src/services/README.md` - 数据层架构说明

---

### 2024-12-03 - 代码重构

#### 🔧 重构
- **清理调试日志** - `globalShortcuts.ts`, `island.ts` 中的 console.log 替换为 logger
- **抽取共享工具函数** - `stripHtml`, `formatRemaining`, `getTaskRemaining` 移到 `utils/`
- **常量集中管理** - 新增 `ISLAND_CONFIG` 到 `constants.ts`

#### 📁 涉及文件
- `src/lib/globalShortcuts.ts`
- `src/lib/island.ts`
- `src/utils/index.ts`
- `src/utils/date.ts`
- `src/utils/task.ts`
- `src/config/constants.ts`
- `src/components/DynamicIsland.tsx`
- `src/components/TimeBlockView.tsx`
- `src/components/QuickCapture/utils.ts`

---

## 格式说明

每次修改请按以下格式记录：

```markdown
### YYYY-MM-DD - 简短标题

#### 🆕 新增 / 🔧 重构 / 🐛 修复 / 🗑️ 删除

- 改动说明

#### 📁 涉及文件
- file1.ts
- file2.tsx
```
