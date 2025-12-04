# Hooks 目录说明

## 数据 Hooks

| Hook | 文件 | 用途 |
|------|------|------|
| `useTasks` | `useTasks.ts` | 任务 CRUD，返回 React Query 的 query/mutation |
| `useNotes` | `useNotes.ts` | 笔记 CRUD |
| `usePlanImages` | `usePlanImages.ts` | 计划图片管理 |
| `useSettings` | `useSettings.ts` | 应用设置读写 |
| `usePreload` | `usePreload.ts` | 启动时预加载数据 |

## 功能 Hooks

| Hook | 文件 | 用途 |
|------|------|------|
| `useEnergyMode` | `useEnergyMode.ts` | 能量模式（专注/管理/充电）自动切换 |

## 使用示例

```tsx
// 获取任务
const { data: tasks } = useTasks();

// 创建任务
const createTask = useCreateTask();
createTask.mutate({ content: "新任务" });

// 获取设置
const { settings } = useSettings();
```

## 修改指南

- 新增数据类型的 Hook → 参考 `useTasks.ts` 的模式
- 所有 Hook 使用 React Query 管理缓存
- Query Key 定义在文件顶部导出
