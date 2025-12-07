# 计划功能完整指南 (Plan Feature Guide)

> MindWall 项目中的计划管理系统完整文档

## 📋 功能概述

MindWall 的计划功能是一个完整的目标和计划管理系统，支持：
- **OKR 风格管理**：计划（Objective）+ 关键结果（Key Results）
- **图片画廊**：上传和管理手写计划图片
- **进度追踪**：自动计算计划完成度
- **状态管理**：active（活跃）/ completed（已完成）/ archived（已归档）

---

## 🏗️ 技术架构

### 数据模型

#### 1. Plan（计划实体）

```typescript
interface Plan {
  id: number;                    // 唯一标识符
  title: string;                 // 计划标题
  description: string | null;    // 计划描述
  color: string;                 // 标签颜色（用于 UI 展示）
  progress: number;              // 进度百分比 (0-100)
  status: PlanStatus;            // 状态：active | completed | archived
  start_date: string | null;     // 开始日期 (YYYY-MM-DD)
  end_date: string | null;       // 结束日期 (YYYY-MM-DD)
  created_at: string;            // 创建时间 (ISO 8601)
  updated_at: string;            // 更新时间 (ISO 8601)
}
```

#### 2. KeyResult（关键结果实体）

```typescript
interface KeyResult {
  id: number;                    // 唯一标识符
  plan_id: number;               // 所属计划 ID（外键）
  title: string;                 // 关键结果标题
  target_value: number;          // 目标值
  current_value: number;         // 当前值
  unit: string;                  // 单位（如 "%", "次", "个"）
  progress: number;              // 完成百分比 (0-100)
  created_at: string;            // 创建时间
  updated_at: string;            // 更新时间
}
```

#### 3. PlanImage（计划图片实体）

```typescript
interface PlanImage {
  id: number;                    // 唯一标识符
  title: string;                 // 图片标题/描述
  imagePath: string;             // 图片相对路径
  thumbnailPath: string | null;  // 缩略图路径（可选）
  fileSize: number;              // 文件大小（字节）
  width: number | null;          // 图片宽度（像素）
  height: number | null;         // 图片高度（像素）
  createdAt: string;             // 创建时间
}
```

### 数据库表结构

#### `plans` 表

```sql
CREATE TABLE plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  progress REAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  start_date TEXT,
  end_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

#### `key_results` 表

```sql
CREATE TABLE key_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  target_value REAL DEFAULT 100,
  current_value REAL DEFAULT 0,
  unit TEXT DEFAULT '%',
  progress REAL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
);
```

#### `plan_images` 表

```sql
CREATE TABLE plan_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  image_path TEXT NOT NULL,
  thumbnail_path TEXT,
  file_size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  created_at TEXT NOT NULL
);
```

---

## 📂 代码结构

```
src/
├── types/
│   └── index.ts                    # Plan, KeyResult, PlanImage 类型定义
├── services/
│   ├── plan/
│   │   ├── IPlanRepository.ts      # 计划仓储接口
│   │   ├── PlanRepository.ts       # 计划仓储实现（SQLite + Mock）
│   │   └── index.ts                # 导出统一实例
│   └── planImage/
│       ├── IPlanImageRepository.ts # 图片仓储接口
│       ├── PlanImageRepository.ts  # 图片仓储实现
│       └── index.ts                # 导出统一实例
├── hooks/
│   ├── usePlans.ts                 # 计划数据 Hooks（未创建，待实现）
│   └── usePlanImages.ts            # 计划图片 Hooks
└── components/
    └── PlansView.tsx               # 计划视图 UI 组件
```

---

## 🔄 数据流

### 1. 计划 CRUD 流程

```
UI Component (PlansView.tsx)
    ↓
Custom Hooks (usePlans.ts)
    ↓
Repository Layer (PlanRepository.ts)
    ↓
SQLite Database / Mock Storage
```

### 2. 进度自动计算

- **触发时机**：
  - 创建新的 KeyResult
  - 更新 KeyResult 的 `current_value` 或 `target_value`
  - 删除 KeyResult
  
- **计算公式**：
  ```typescript
  // KeyResult 进度
  kr.progress = (kr.current_value / kr.target_value) * 100
  
  // Plan 总进度（所有 KR 的平均值）
  plan.progress = sum(kr.progress) / count(keyResults)
  ```

---

## 🎨 UI 功能详解

### PlansView 组件功能

#### 1. 图片上传
- **拖拽上传**：直接拖拽图片文件到画廊区域
- **点击上传**：点击"上传图片"按钮选择文件
- **粘贴上传**：使用 `Ctrl+V` 粘贴剪贴板中的图片
- **支持格式**：JPG, PNG, GIF, WebP
- **文件限制**：最大 20MB

#### 2. 图片展示
- **瀑布流布局**：响应式多列展示（移动端 2 列，平板 3 列，桌面 4 列）
- **时间线分组**：按月份分组展示图片
- **悬浮操作**：鼠标悬停显示删除按钮和查看提示

#### 3. Lightbox 预览
- **完整预览**：点击图片进入全屏预览模式
- **缩放控制**：
  - `+` / `-` 键：放大/缩小
  - 鼠标滚轮：缩放
  - 双击：重置缩放
- **旋转控制**：`R` 键旋转 90 度
- **导航**：
  - 左右箭头键切换图片
  - `ESC` 退出预览
- **全屏模式**：`F` 键进入/退出全屏
- **信息面板**：`I` 键显示/隐藏图片信息

#### 4. 编辑功能
- 点击标题编辑图片描述
- 右键菜单删除图片

---

## 🚀 使用示例

### 1. 创建计划

```typescript
import { planRepository } from "@/services/plan";

const newPlan = await planRepository.createPlan({
  title: "2024 年度 OKR",
  description: "全年主要目标和关键结果",
  color: "#3B82F6",
  start_date: "2024-01-01",
  end_date: "2024-12-31"
});
```

### 2. 添加关键结果

```typescript
const keyResult = await planRepository.createKeyResult({
  plan_id: newPlan.id,
  title: "提升用户留存率",
  target_value: 80,
  unit: "%"
});
```

### 3. 更新关键结果进度

```typescript
await planRepository.updateKeyResult(keyResult.id, {
  current_value: 65  // 进度会自动重新计算
});

// 计划的总进度也会自动更新
```

### 4. 查询计划

```typescript
// 获取所有活跃计划
const activePlans = await planRepository.getPlansByStatus("active");

// 获取计划的所有关键结果
const keyResults = await planRepository.getKeyResultsByPlanId(plan.id);
```

### 5. 上传计划图片

```typescript
import { usePlanImages, useUploadPlanImage } from "@/hooks/usePlanImages";

// 在组件中使用
const uploadMutation = useUploadPlanImage();

const handleUpload = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const imageData = new Uint8Array(arrayBuffer);
  
  await uploadMutation.mutateAsync({
    input: {
      title: "我的手写计划",
      fileName: file.name
    },
    imageData
  });
};
```

---

## 🎯 实现原理

### Repository 模式

采用 Repository 模式实现数据持久化，优点：
- **环境适配**：自动检测 Tauri 环境，在浏览器中使用 Mock 数据
- **接口抽象**：业务逻辑依赖接口而非具体实现（符合 SOLID 原则）
- **易于测试**：可以轻松 Mock Repository 进行单元测试

### Mock 数据策略

在浏览器开发环境中：
- 数据存储在内存中（`mockPlans`, `mockKeyResults` 数组）
- 模拟 SQLite 的行为（自增 ID、关联查询等）
- 支持完整的 CRUD 操作

### 图片存储

- **Tauri 环境**：
  - 图片保存到应用数据目录 (`$APPDATA/com.cjw.productivity/plans/`)
  - 使用 Tauri 文件系统 API 读写
  - 路径存储为相对路径
  
- **浏览器环境**：
  - 使用 `localStorage` 或内存存储 Base64 数据
  - 仅用于开发预览

---

## 📊 进度计算细节

### 单个 KeyResult 进度

```typescript
const progress = targetValue > 0 
  ? (currentValue / targetValue) * 100 
  : 0;
  
// 限制在 0-100 范围内
const finalProgress = Math.min(100, Math.max(0, progress));
```

### Plan 总进度

```typescript
const keyResults = await getKeyResultsByPlanId(planId);

if (keyResults.length === 0) {
  plan.progress = 0;
} else {
  const avgProgress = keyResults.reduce((sum, kr) => sum + kr.progress, 0) / keyResults.length;
  plan.progress = Math.round(avgProgress * 10) / 10;  // 保留 1 位小数
}
```

---

## 🔧 开发指南

### 添加新的 Plan 字段

1. **更新类型定义** (`src/types/index.ts`)
   ```typescript
   export interface Plan {
     // ... 现有字段
     new_field: string;  // 新字段
   }
   ```

2. **更新数据库表** (`src/services/plan/PlanRepository.ts`)
   ```typescript
   await this.db.execute(`
     ALTER TABLE plans ADD COLUMN new_field TEXT
   `);
   ```

3. **更新 CRUD 操作**
   - `createPlan()` - 添加新字段到 INSERT 语句
   - `updatePlan()` - 添加新字段到 UPDATE 逻辑

### 添加新的 UI 视图

1. 创建新组件 `src/components/PlansOKRView.tsx`
2. 使用 `usePlans()` Hook 获取数据
3. 在 `Header.tsx` 添加新 Tab

---

## ⚠️ 注意事项

### 1. 数据一致性

- **外键约束**：删除 Plan 时会自动删除关联的 KeyResult（`ON DELETE CASCADE`）
- **进度同步**：更新 KeyResult 后必须调用 `recalculatePlanProgress()`

### 2. 文件路径

- **禁止使用绝对路径**：图片路径必须是相对于应用数据目录的相对路径
- **跨平台兼容**：使用 `/` 作为路径分隔符（Tauri 会自动转换）

### 3. 性能优化

- **懒加载**：PlansView 使用 `lazy()` 懒加载
- **图片加载**：使用 `loading="lazy"` 延迟加载图片
- **虚拟滚动**：大量图片时考虑使用虚拟滚动（待实现）

### 4. 浏览器限制

- Mock 模式下数据仅存在于内存中，刷新页面会丢失
- 图片上传在浏览器中无法真正保存到文件系统

---

## 🎨 UI 设计规范

### 颜色系统

```typescript
const DEFAULT_COLORS = [
  "#3B82F6",  // 蓝色
  "#10B981",  // 绿色
  "#F59E0B",  // 橙色
  "#EF4444",  // 红色
  "#8B5CF6"   // 紫色
];
```

### 动画效果

- **进入动画**：`opacity: 0 → 1`, `y: 20 → 0`
- **延迟加载**：每张图片延迟 `index * 0.03s`
- **过渡时长**：`0.3s`

### 响应式断点

```typescript
// 移动端
window.innerWidth < 640  → 2 columns

// 平板
window.innerWidth < 1024 → 3 columns

// 桌面
window.innerWidth >= 1024 → 4 columns
```

---

## 🚀 未来优化方向

### 短期（v1.0）
- [ ] 添加 `usePlans()` Hook（类似 `useTasks()`）
- [ ] 实现计划列表视图（非图片模式）
- [ ] 添加计划搜索和筛选
- [ ] 支持计划排序（按时间、进度、状态）

### 中期（v1.1）
- [ ] 计划与任务关联（一个任务可以属于某个计划）
- [ ] 计划模板系统（快速创建常见类型的计划）
- [ ] 计划报告导出（PDF/Markdown）
- [ ] 多人协作（分享计划给其他用户）

### 长期（v2.0）
- [ ] AI 辅助生成关键结果建议
- [ ] 甘特图视图（时间线可视化）
- [ ] 计划依赖关系管理
- [ ] 移动端 App 同步

---

## 📚 相关文档

- [项目 README](./README.md) - 项目整体介绍
- [AI 编程指南](./AI_GUIDE.md) - AI 助手协作指南
- [更新日志](./CHANGELOG.md) - 功能演进历史
- [类型定义](./src/types/index.ts) - TypeScript 类型系统

---

## 💡 最佳实践

1. **始终通过 Repository 操作数据**，不要直接操作数据库
2. **使用 React Query Hook** 进行数据获取和缓存
3. **保持类型安全**，避免使用 `any` 类型
4. **遵循命名规范**：
   - 组件：PascalCase (`PlansView`)
   - 函数：camelCase (`createPlan`)
   - 常量：UPPER_SNAKE_CASE (`DEFAULT_COLORS`)
5. **编写注释**：复杂逻辑添加 JSDoc 注释

---

<p align="center">
  <b>Made with ❤️ by CJW Team</b><br>
  <i>Last Updated: 2024-12-07</i>
</p>
