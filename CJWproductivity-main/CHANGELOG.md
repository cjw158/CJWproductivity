# 更新日志

> AI 每次修改后在此记录，帮助追踪项目演进。

## [未发布]

### 2024-12-05 - 灵动岛截图功能 & NSIS 安装器优化

#### ✨ 新增
- **灵动岛截图功能** - 一键截图自动粘贴
  - 点击截图按钮 → 隐藏灵动岛 → 启动 Windows 截图工具
  - 截图完成后自动从剪贴板读取图片
  - 图片自动显示在快速捕获输入框
  - 使用浏览器 Clipboard API 实现跨格式兼容

#### 🎨 优化
- **灵动岛动画优化** - 移除 blur 滤镜动画，避免负值警告
- **代码性能优化**
  - `measureTextWidth` 函数缓存 canvas 实例，避免重复创建
  - `todayStr` 日期计算使用 `useMemo` 按天缓存
  - `handleScreenshot` 函数简化为链式 Promise
  - `handleMouseDown` 拖动处理简化为单行

#### 📦 安装器专业化
- **NSIS 安装器全面升级**
  - 自定义安装钩子：桌面快捷方式、开始菜单、注册表增强
  - 双语许可协议（中英文）
  - LZMA 压缩优化安装包体积
  - 卸载时询问是否删除用户数据
  - 完整的"程序和功能"信息展示

#### 📁 新增文件
- `src-tauri/windows/hooks.nsh` - NSIS 安装器自定义钩子

#### 📁 修改文件
- `src/components/DynamicIsland.tsx` - 添加截图功能、优化性能
- `src-tauri/tauri.conf.json` - NSIS 专业配置
- `src-tauri/nsis/LICENSE.txt` - 双语许可协议
- `src-tauri/capabilities/default.json` - 添加 shell、clipboard 权限
- `src/i18n/*.ts` - 添加截图相关翻译

#### 📦 依赖
- 新增 `@tauri-apps/plugin-shell` - Shell 命令执行
- 新增 `@tauri-apps/plugin-clipboard-manager` - 剪贴板管理

---

### 2024-12-05 - 笔记导出 & UI 优化

#### ✨ 新增
- **笔记导出功能** - 支持多种格式导出
  - Markdown (.md) - 纯文本格式，保留标题、列表、代码等
  - PDF (.pdf) - 使用 html2pdf.js 生成精美排版 PDF
  - LaTeX (.tex) - 完整 LaTeX 文档，可直接编译
  - Word (.doc) - Office 兼容格式
- **相对时间显示** - "刚刚"、"5分钟前"、"2小时前" 等友好时间格式
- **字数统计** - 编辑器顶部实时显示当前笔记字数

#### 🎨 优化
- **笔记卡片交互升级**
  - 悬浮时轻微上浮 + 阴影加深，增强点击感
  - 选中态添加玻璃拟态背景 + 渐变边框 + 动态光效
  - 置顶标签样式优化，更加醒目
- **设置页下拉组件** - 原生 select 替换为自定义动画下拉组件
- **设置持久化修复** - 修复设置重启后丢失的问题

#### 🐛 修复
- 修复 `DeveloperSettings` 缺少 `useLanguage` 导致的构建错误
- 修复 `ThemeContext` 中 `fontSize` 类型不匹配问题
- 修复 i18n 文件中重复键导致的构建错误

#### 📁 新增文件
- `src/utils/noteExport.ts` - 笔记导出工具（HTML→MD/LaTeX 转换）
- `src/utils/timeUtils.ts` - 相对时间工具函数

#### 📁 修改文件
- `src/components/NotesLayout.tsx` - 添加导出按钮、优化卡片样式、显示字数
- `src/components/RichTextEditor.tsx` - 暴露 getWordCount 方法
- `src/components/settings/SettingsModal.tsx` - 自定义下拉组件
- `src/hooks/useSettings.ts` - 修复设置加载逻辑
- `src/lib/tasks.ts` - 初始化时加载设置仓储
- `src/i18n/zh-CN.ts` - 添加导出相关翻译
- `src/i18n/en-US.ts` - 添加导出相关翻译
- `src/i18n/ja-JP.ts` - 添加导出相关翻译

#### 📦 依赖
- 新增 `html2pdf.js` - PDF 生成库

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
