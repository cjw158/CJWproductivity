/**
 * @file utils/index.ts
 * @description 工具函数统一导出
 * 
 * 设计原则:
 * - 所有纯函数工具集中在此模块
 * - 无副作用，易于测试
 * - 提供通用的文本/日期/任务处理功能
 */

export * from "./date";
export * from "./task";

/**
 * 去除 HTML 标签，保留纯文本
 * @param html - HTML 字符串
 * @returns 纯文本字符串
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

/**
 * 从 HTML 内容中提取第一个 h1 标题作为笔记标题
 * @param html - HTML 字符串
 * @param fallback - 可选的默认值，默认为 "未命名笔记"
 * @returns 标题文本
 */
export function extractH1Title(html: string, fallback: string = "未命名笔记"): string {
  if (!html) return fallback;
  
  // 匹配第一个 h1 标签及其内容
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match && h1Match[1]) {
    // 去除 h1 内部可能存在的其他 HTML 标签
    const title = stripHtml(h1Match[1]).trim();
    if (title) {
      return title;
    }
  }
  
  // 如果没有 h1，尝试从纯文本第一行提取
  const textContent = stripHtml(html).trim();
  if (textContent) {
    const firstLine = textContent.split("\n")[0].trim();
    if (firstLine && firstLine.length <= 50) {
      return firstLine;
    }
    // 如果第一行太长，截取前50个字符
    if (firstLine && firstLine.length > 50) {
      return firstLine.substring(0, 50) + "...";
    }
  }
  
  return fallback;
}
