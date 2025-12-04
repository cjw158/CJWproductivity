# Services 目录说明

## 架构模式

采用 **Repository 模式**，数据访问与业务逻辑分离。

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   Hooks     │ ──▶ │  Repository  │ ──▶ │   SQLite     │
│ (useTasks)  │     │ (TaskRepo)   │     │   Database   │
└─────────────┘     └──────────────┘     └──────────────┘
```

## 目录结构

```
services/
├── task/
│   ├── index.ts           # 导出入口，提供单例
│   ├── ITaskRepository.ts # 接口定义
│   └── TaskRepository.ts  # 实现（SQLite + Mock）
└── settings/
    ├── index.ts
    ├── ISettingsRepository.ts
    └── SettingsRepository.ts
```

## 关键接口

### ITaskRepository

```typescript
interface ITaskRepository {
  getAll(): Promise<Task[]>;
  getById(id: number): Promise<Task | null>;
  getByStatus(status: TaskStatus): Promise<Task[]>;
  create(input: CreateTaskInput): Promise<Task>;
  update(id: number, input: UpdateTaskInput): Promise<Task>;
  delete(id: number): Promise<void>;
}
```

## 修改指南

- 添加新任务字段 → 改 `TaskRepository.ts` 的 SQL + `types/index.ts`
- 添加新数据类型 → 参考 `task/` 目录结构创建
- Mock 数据在 `TaskRepository.ts` 底部（浏览器环境用）

## 环境检测

- **Tauri 环境** → 使用 SQLite
- **浏览器环境** → 使用内存 Mock 数据
