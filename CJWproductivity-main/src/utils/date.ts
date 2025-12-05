/**
 * @file date.ts
 * @description 日期工具函数
 * 
 * 统一日期处理逻辑，避免各组件重复实现
 */

/**
 * 格式化日期为 YYYY-MM-DD 字符串（本地时间）
 * @param date - Date 对象
 * @returns YYYY-MM-DD 格式字符串
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 获取今天的日期字符串（本地时间）
 */
export function getToday(): string {
  return formatDate(new Date());
}

/**
 * 获取明天的日期字符串（本地时间）
 */
export function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatDate(d);
}

/**
 * 格式化时间为 HH:mm 字符串
 * @param hours - 小时
 * @param minutes - 分钟
 * @returns HH:mm 格式字符串
 */
export function formatTime(hours: number, minutes: number = 0): string {
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

/**
 * 解析时间字符串为分钟数
 * @param time - HH:mm 格式的时间字符串
 * @returns 相对于 00:00 的分钟数
 */
export function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * 将分钟数转换为时间字符串
 * @param totalMinutes - 总分钟数
 * @returns HH:mm 格式字符串
 */
export function minutesToTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return formatTime(hours, minutes);
}

/**
 * 判断两个日期是否是同一天
 * @param d1 - 日期1
 * @param d2 - 日期2
 * @returns 是否同一天
 */
export function isSameDay(d1: Date, d2: Date): boolean {
  return formatDate(d1) === formatDate(d2);
}

/**
 * 判断日期是否是今天
 * @param date - 目标日期
 * @returns 是否今天
 */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/**
 * 获取指定月份的所有天数（包含前后月份填充）
 * @param year - 年份
 * @param month - 月份 (0-11)
 * @returns 42 天的日期数组（6周）
 */
export function getMonthDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // 填充上月日期
  const startDayOfWeek = firstDay.getDay();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  
  // 本月日期
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  
  // 填充下月日期
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push(new Date(year, month + 1, i));
  }
  
  return days;
}

/**
 * 格式化日期为中文显示
 * @param date - 日期对象
 * @param options - 格式化选项
 * @returns 格式化后的字符串
 */
export function formatDateCN(
  date: Date,
  options: { showYear?: boolean; showWeekday?: boolean } = {}
): string {
  const { showYear = false, showWeekday = false } = options;
  
  const parts: Intl.DateTimeFormatOptions = {
    month: "long",
    day: "numeric",
  };
  
  if (showYear) parts.year = "numeric";
  if (showWeekday) parts.weekday = "short";
  
  return date.toLocaleDateString("zh-CN", parts);
}

/**
 * 格式化剩余时间为可读字符串
 * @param totalSeconds - 剩余秒数
 * @returns 格式化后的时间字符串 (如 "1:30:00" 或 "25:30")
 */
export function formatRemaining(totalSeconds: number): string {
  if (totalSeconds <= 0) return "已结束";
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * 解析时间字符串 (HH:mm) 为今日 Date 对象
 * @param timeStr - HH:mm 格式的时间字符串
 * @returns Date 对象，或 null（如果解析失败）
 */
export function parseScheduledTime(timeStr: string): Date | null {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(":").map(Number);
  const now = new Date();
  now.setHours(hours, minutes, 0, 0);
  return now;
}
