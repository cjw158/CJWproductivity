/**
 * @file QuickCapture/utils.ts
 * @description QuickCapture 工具函数
 */

// 从公共 utils 重新导出，保持向后兼容
export { stripHtml } from "@/utils";

/**
 * 格式化日期为中文显示（带时间）
 */
export function formatDate(date: Date): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const hours = date.getHours();
  const mins = date.getMinutes();
  const hasTime = hours !== 0 || mins !== 0;
  const timeStr = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;

  if (isToday) return hasTime ? `今天 ${timeStr}` : "今天";
  if (isTomorrow) return hasTime ? `明天 ${timeStr}` : "明天";
  return hasTime
    ? `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${timeStr}`
    : `${date.getMonth() + 1}月${date.getDate()}日`;
}

/**
 * 获取今天的日期字符串 (YYYY-MM-DD) - 本地时间
 */
export function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

/**
 * 获取明天的日期字符串 - 本地时间
 */
export function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

/**
 * 格式化时长为中文显示
 */
export function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}分钟`;
  const hours = Math.floor(mins / 60);
  const remaining = mins % 60;
  return remaining > 0 ? `${hours}小时${remaining}分` : `${hours}小时`;
}
