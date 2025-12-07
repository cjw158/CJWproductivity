# 下一步工作指南

## 📋 当前状态

已完成 Phase 0 核心基础设施搭建，灵动岛模块完成 30%。现在需要继续完成模块拆分工作。

## 🎯 立即要做的事情 (Phase 1 继续)

### 1. 完成灵动岛组件拆分 (预计 2-3 小时)

#### 步骤 1: 创建 IslandCollapsed.tsx (~150行)
**位置**: `src/modules/island/components/IslandCollapsed.tsx`

**职责**:
- 显示收起状态的灵动岛
- 展示当前进行中的任务
- 显示番茄钟状态
- 悬停展开交互

**需要的数据**:
- `activeTasks`: 当前进行中的任务
- `nextTask`: 下一个任务
- `pomodoroState`: 番茄钟状态
- `colors`: 主题颜色

**参考原文件**: `DynamicIsland.tsx` 行 700-850

#### 步骤 2: 创建 IslandExpanded.tsx (~150行)
**位置**: `src/modules/island/components/IslandExpanded.tsx`

**职责**:
- 显示展开状态的今日任务列表
- 任务完成/开始交互
- 滚动列表
- 空状态提示

**需要的数据**:
- `todayTasks`: 今日所有任务
- `onToggleTask`: 切换任务状态
- `onStartTask`: 开始任务
- `colors`: 主题颜色

**参考原文件**: `DynamicIsland.tsx` 行 850-1100

#### 步骤 3: 创建 IslandCapture.tsx (~150行)
**位置**: `src/modules/island/components/IslandCapture.tsx`

**职责**:
- 快速捕获文本和图片
- 笔记模式选择
- 截图功能
- 保存/取消操作

**使用 Hooks**:
- `useCapture` (已完成)

**参考原文件**: `DynamicIsland.tsx` 行 712-900

#### 步骤 4: 创建 IslandTaskList.tsx (~100行)
**位置**: `src/modules/island/components/IslandTaskList.tsx`

**职责**:
- 渲染任务列表
- 任务项交互
- 滚动容器

**参考原文件**: `DynamicIsland.tsx` 行 900-1000

#### 步骤 5: 创建 IslandPomodoro.tsx (~100行)
**位置**: `src/modules/island/components/IslandPomodoro.tsx`

**职责**:
- 番茄钟显示和控制
- 时间调节
- 进度显示

**使用 Hooks**:
- `usePomodoro` (已完成)

**参考原文件**: `DynamicIsland.tsx` 行 1100-1200

### 2. 创建服务层 (预计 1 小时)

#### islandWindow.ts
**位置**: `src/modules/island/services/islandWindow.ts`

**功能**:
```typescript
export async function resizeIslandWindow(width: number, height: number): Promise<void>
export async function showIslandWindow(): Promise<void>
export async function hideIslandWindow(): Promise<void>
export async function isIslandVisible(): Promise<boolean>
```

**参考原文件**: `DynamicIsland.tsx` 行 614-645, `lib/island.ts`

### 3. 创建样式文件 (预计 30 分钟)

#### island.module.css
**位置**: `src/modules/island/styles/island.module.css`

**内容**:
- `.container`: 主容器样式
- `.collapsed`: 收起状态
- `.expanded`: 展开状态
- `.capture`: 捕获模式
- `.streaming`: 流光边框动画

**参考原文件**: `DynamicIsland.tsx` 行 652-689 (内联样式)

### 4. 创建主组件容器 (预计 1 小时)

#### DynamicIsland.tsx (新版本)
**位置**: `src/modules/island/components/DynamicIsland.tsx`

**职责**:
- 组合所有子组件
- 管理状态
- 处理窗口调整
- 事件监听

**代码结构**:
```typescript
import { useIslandState } from "../hooks/useIslandState";
import { usePomodoro } from "../hooks/usePomodoro";
import { useCapture } from "../hooks/useCapture";
import { IslandCollapsed } from "./IslandCollapsed";
import { IslandExpanded } from "./IslandExpanded";
import { IslandCapture } from "./IslandCapture";

export const DynamicIsland = memo(function DynamicIsland() {
  // 使用 hooks
  const state = useIslandState();
  const pomodoro = usePomodoro();
  const capture = useCapture({ ...state, ...pomodoro });
  
  // 数据获取
  const { data: tasks = [] } = useQuery({ ... });
  
  // 渲染逻辑
  return (
    <motion.div>
      {isCaptureMode ? (
        <IslandCapture {...captureProps} />
      ) : isExpanded ? (
        <IslandExpanded {...expandedProps} />
      ) : (
        <IslandCollapsed {...collapsedProps} />
      )}
    </motion.div>
  );
});
```

### 5. 测试和验证 (预计 1 小时)

**测试清单**:
- [ ] 收起状态正确显示
- [ ] 悬停展开动画流畅
- [ ] 任务列表正确渲染
- [ ] 任务状态切换正常
- [ ] 快速捕获功能正常
- [ ] 图片粘贴正常
- [ ] 截图功能正常
- [ ] 番茄钟计时正常
- [ ] 窗口尺寸自适应
- [ ] 主题切换正常

## 🔧 关键技术要点

### 1. 状态管理
使用 hooks 集中管理状态，避免 prop drilling：
```typescript
const state = useIslandState();
// state 包含所有必要的状态和 setters
```

### 2. 事件处理
使用 EventBus 处理跨模块通信：
```typescript
import { getEventBus } from "@/core/EventBus";

const bus = getEventBus();
bus.on("island-capture", handleCapture);
```

### 3. 窗口管理
使用 Tauri API 控制窗口：
```typescript
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalSize } from "@tauri-apps/api/dpi";

const win = getCurrentWindow();
await win.setSize(new LogicalSize(width, height));
```

### 4. 样式隔离
使用 CSS Modules 避免样式冲突：
```typescript
import styles from "../styles/island.module.css";
<div className={styles.container}>
```

## 📚 参考资源

### 已完成的文件
- ✅ `src/core/ModuleManager.ts` - 模块管理参考
- ✅ `src/core/EventBus.ts` - 事件总线参考
- ✅ `src/modules/island/hooks/usePomodoro.ts` - Hook 编写参考
- ✅ `src/modules/island/components/icons/PulseIndicator.tsx` - 组件编写参考

### 原始文件
- 📄 `src/components/DynamicIsland.tsx` - 原始灵动岛实现（1412行）
- 📄 `src/lib/island.ts` - 窗口控制逻辑

### 文档
- 📖 `MODULARIZATION_GUIDE.md` - 完整的模块化指南
- 📖 `configs/README.md` - 构建配置说明

## ⚠️ 注意事项

### 1. 保持向后兼容
在新组件完成之前，原 `DynamicIsland.tsx` 必须继续工作。可以通过以下方式逐步迁移：

```typescript
// 在 App.tsx 中使用 feature flag
import { DynamicIsland as NewDynamicIsland } from "@/modules/island";
import { DynamicIsland as OldDynamicIsland } from "@/components/DynamicIsland";

const USE_NEW_ISLAND = false; // 完成后改为 true

const DynamicIsland = USE_NEW_ISLAND ? NewDynamicIsland : OldDynamicIsland;
```

### 2. 逐步测试
每完成一个子组件，立即测试：
```bash
npm run dev
# 打开灵动岛窗口测试
```

### 3. 保持组件小而专注
如果任何组件超过 300 行，考虑进一步拆分。

### 4. 使用 TypeScript
所有新代码必须有完整的类型定义，避免 `any`。

## 🚀 快速开始

```bash
# 1. 进入项目目录
cd /home/runner/work/CJWproductivity/CJWproductivity/CJWproductivity-main

# 2. 创建新组件文件
touch src/modules/island/components/IslandCollapsed.tsx
touch src/modules/island/components/IslandExpanded.tsx
touch src/modules/island/components/IslandCapture.tsx
touch src/modules/island/components/IslandTaskList.tsx
touch src/modules/island/components/IslandPomodoro.tsx

# 3. 创建服务文件
touch src/modules/island/services/islandWindow.ts

# 4. 创建样式文件
touch src/modules/island/styles/island.module.css

# 5. 开始开发
npm run dev
```

## 📞 需要帮助？

如果遇到问题：
1. 查看 `MODULARIZATION_GUIDE.md` 获取详细指导
2. 参考已完成的 hooks 和组件
3. 查看原始 `DynamicIsland.tsx` 了解业务逻辑
4. 使用 TypeScript 类型系统捕获错误

## ✅ 完成标志

当以下所有项都完成时，Phase 1 就完成了：
- [ ] 所有5个子组件创建并测试通过
- [ ] 服务层创建完成
- [ ] 样式文件创建完成
- [ ] 新的 DynamicIsland 容器组件创建完成
- [ ] 所有功能测试通过
- [ ] 代码审查通过
- [ ] 文档更新

预计总时间：6-8 小时

开始吧！🚀
