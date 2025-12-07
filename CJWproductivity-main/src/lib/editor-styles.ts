/**
 * @file editor-styles.ts
 * @description 编辑器样式常量 - 统一管理双屏/单屏模式的排版样式
 * 
 * 设计原则:
 * - 避免重复定义样式
 * - 编辑模式和浏览模式样式清晰分离
 * - 支持深色/浅色主题适配
 */

import { cn } from "@/lib/utils";

/**
 * 获取双屏模式页面的样式类名
 * @param isDark - 是否深色主题
 * @param editable - 是否编辑模式
 * @param page - 页面位置 ("left" | "right")
 */
export function getDualPageContentStyles(
  isDark: boolean,
  editable: boolean,
  page: "left" | "right"
): string {
  return cn(
    // 基础动画和页面标识
    "dual-page-content transition-transform duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)]",
    page === "left" ? "left-page" : "right-page",
    
    // Prose 基础
    "prose prose-sm max-w-none focus:outline-none",
    isDark ? "prose-invert" : "",
    
    // 通用元素样式 (编辑/浏览模式共用)
    ...getCommonElementStyles(isDark),
    
    // 模式特定样式
    editable 
      ? getEditModeStyles() 
      : getReadModeStyles(isDark)
  );
}

/**
 * 获取测量容器的样式类名 (用于计算内容高度)
 */
export function getMeasureContainerStyles(
  isDark: boolean,
  editable: boolean
): string {
  return cn(
    "absolute opacity-0 pointer-events-none",
    "prose prose-sm max-w-none",
    ...getCommonElementStyles(isDark),
    editable 
      ? getEditModeStyles() 
      : getReadModeStyles(isDark)
  );
}

/**
 * 通用元素样式 - 编辑/浏览模式共用
 */
function getCommonElementStyles(isDark: boolean): string[] {
  return [
    // 标题
    "prose-headings:font-semibold",
    "prose-h1:text-[1.35rem] prose-h1:leading-tight prose-h1:mb-4",
    "prose-h2:text-[1.15rem] prose-h2:leading-tight prose-h2:mb-3",
    "prose-h3:text-[1.05rem] prose-h3:leading-tight prose-h3:mb-2",
    
    // 列表
    "prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5",
    
    // 行内代码
    "prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm",
    isDark 
      ? "prose-code:bg-white/10 prose-code:text-emerald-400" 
      : "prose-code:bg-gray-100 prose-code:text-emerald-600",
    
    // 引用块
    "prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic",
    isDark 
      ? "prose-blockquote:border-white/20 prose-blockquote:text-white/60" 
      : "prose-blockquote:border-gray-300 prose-blockquote:text-gray-600",
    
    // 链接
    "prose-a:text-[var(--color-memo)] prose-a:no-underline hover:prose-a:underline",
    
    // 图片
    "prose-img:rounded-xl prose-img:shadow-md prose-img:object-contain",
    "[&_img]:inline-block [&_img]:my-0 [&_img]:mx-1 [&_img]:align-middle",
    "[&_img]:max-h-[400px]",
    
    // 代码块
    isDark 
      ? "prose-pre:bg-[#1e1e2e] prose-pre:text-gray-100 prose-pre:border prose-pre:border-white/10" 
      : "prose-pre:bg-gray-100 prose-pre:text-gray-800 prose-pre:border prose-pre:border-gray-200",
    
    // 数学公式
    "[&_.katex]:text-[1.1em]",
    "[&_.math-inline]:mx-1 [&_.math-inline]:align-middle",
    "[&_.math-block]:my-4 [&_.math-block]:overflow-x-auto [&_.math-block]:py-2",
  ];
}

/**
 * 编辑模式专属样式
 */
function getEditModeStyles(): string[] {
  return [
    "prose-p:leading-relaxed prose-p:my-2",
  ];
}

/**
 * 浏览模式专属样式 - 杂志级阅读体验
 */
function getReadModeStyles(isDark: boolean): string[] {
  return [
    isDark ? "text-gray-200" : "text-gray-700",
    "leading-[1.9]",
    "prose-p:text-base prose-p:my-4",
    "prose-headings:my-8",
    "prose-li:my-2",
    "font-['LXGW_WenKai_Screen','LXGW_WenKai',serif]",
    "tracking-wide",
    "selection:bg-cyan-500/30",
    "prose-p:leading-relaxed prose-p:my-2",
  ];
}
