/**
 * @file timeUtils.ts
 * @description 时间处理工具函数
 */

/**
 * 获取相对时间描述
 * @param date 日期对象或时间戳
 * @param locale 语言代码
 * @returns 相对时间字符串
 */
export function getRelativeTime(date: Date | string | number, locale: string = "zh-CN"): string {
  const now = new Date();
  const target = new Date(date);
  const diff = now.getTime() - target.getTime();
  
  // 处理无效日期
  if (isNaN(target.getTime())) return "";

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  // 本地化配置
  const isZh = locale === "zh-CN";
  const isJa = locale === "ja-JP";

  if (seconds < 60) {
    if (isZh) return "刚刚";
    if (isJa) return "たった今";
    return "Just now";
  }

  if (minutes < 60) {
    if (isZh) return `${minutes}分钟前`;
    if (isJa) return `${minutes}分前`;
    return `${minutes}m ago`;
  }

  if (hours < 24) {
    if (isZh) return `${hours}小时前`;
    if (isJa) return `${hours}時間前`;
    return `${hours}h ago`;
  }

  if (days < 7) {
    if (isZh) return `${days}天前`;
    if (isJa) return `${days}日前`;
    return `${days}d ago`;
  }

  // 超过一周显示具体日期
  return target.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: now.getFullYear() === target.getFullYear() ? undefined : "numeric"
  });
}
