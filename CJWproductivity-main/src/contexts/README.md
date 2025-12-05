# Contexts 目录说明

## Context 清单

| Context | 文件 | 职责 |
|---------|------|------|
| `ThemeContext` | `ThemeContext.tsx` | 主题（深色/浅色）、强调色、字体大小、动画开关 |
| `FocusContext` | `FocusContext.tsx` | 专注模式状态（当前专注的任务） |
| `TaskSelectionContext` | `TaskSelectionContext.tsx` | 多选任务、右键菜单位置 |
| `TaskActionsContext` | `TaskActionsContext.tsx` | 任务操作（创建/更新/删除/移动） |

## Provider 嵌套顺序

在 `main.tsx` 中的顺序（外到内）：

```
QueryClientProvider
  └─ ThemeProvider
       └─ TaskActionsProvider
            └─ FocusProvider
                 └─ TaskSelectionProvider
                      └─ App
```

## 使用示例

```tsx
// 获取主题
const { theme, isDark, toggleTheme } = useTheme();

// 任务操作
const { createTask, updateTask, deleteTask } = useTaskActions();

// 专注模式
const { focusedTask, startFocus, stopFocus } = useFocus();

// 多选
const { selectedIds, toggleSelect, clearSelection } = useTaskSelection();
```

## 修改指南

- 改主题相关 → `ThemeContext.tsx`
- 改任务操作逻辑 → `TaskActionsContext.tsx`
- 新增全局状态 → 创建新 Context，加到 `main.tsx`
