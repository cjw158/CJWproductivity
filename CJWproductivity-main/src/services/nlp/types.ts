/**
 * @file services/nlp/types.ts
 * @description NLP 服务类型定义
 */

export type TaskCategory =
  | "work"     // 工作
  | "study"    // 学习
  | "life"     // 生活
  | "health"   // 健康
  | "social"   // 社交
  | "finance"  // 财务
  | "creative" // 创意
  | "other";   // 其他

export interface DatetimeResult {
  date: Date | null;
  hasTime: boolean;
  originalText: string;
}

export interface PriorityResult {
  isImportant: boolean;
  isUrgent: boolean;
  keywords: string[];
}

export interface DurationResult {
  suggested: number;
  confidence: "high" | "medium" | "low";
  reason: string;
}

export interface CategoryResult {
  type: TaskCategory;
  confidence: number;
  keywords: string[];
}

export interface NLPParseResult {
  /** 清理后的任务内容 */
  cleanContent: string;
  /** 日期时间解析 */
  datetime: DatetimeResult | null;
  /** 优先级识别 */
  priority: PriorityResult;
  /** 时长推荐 */
  duration: DurationResult;
  /** 任务分类 */
  category: CategoryResult;
  /** 提取的标签 */
  tags: string[];
}

/**
 * NLP 服务接口
 */
export interface INlpService {
  /**
   * 解析任务文本
   * @param text 输入的任务文本
   * @returns 解析结果
   */
  parseTaskText(text: string): NLPParseResult;

  /**
   * 获取分类的显示名称
   */
  getCategoryLabel(category: TaskCategory): string;

  /**
   * 获取分类的颜色
   */
  getCategoryColor(category: TaskCategory): string;
}
