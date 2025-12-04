/**
 * @file services/nlp/NlpService.ts
 * @description NLP 自然语言处理服务实现
 * 
 * 功能:
 * - 日期时间解析 (基于 chrono-node)
 * - 优先级识别
 * - 时长推荐
 * - 任务分类
 * - 标签提取
 */

import { zh } from "chrono-node";
import type {
  INlpService,
  NLPParseResult,
  TaskCategory,
  DatetimeResult,
  PriorityResult,
  DurationResult,
  CategoryResult,
} from "./types";
import {
  IMPORTANT_KEYWORDS,
  URGENT_KEYWORDS,
  CATEGORY_KEYWORDS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  DURATION_RULES,
  DEFAULT_DURATION,
  EXTRA_DATE_PATTERNS,
} from "./config";

/**
 * NLP 服务实现
 */
export class NlpService implements INlpService {
  /**
   * 解析日期时间
   */
  private parseDatetime(text: string): DatetimeResult | null {
    // 先尝试 chrono-node
    const results = zh.parse(text);
    if (results.length > 0) {
      const result = results[0];
      const date = result.start.date();
      const hasTime =
        result.text.includes("点") ||
        result.text.includes(":") ||
        result.text.includes("分") ||
        result.start.isCertain("hour");
      return { date, hasTime, originalText: result.text };
    }

    // 尝试额外的日期模式
    for (const { pattern, getDate, text: matchText } of EXTRA_DATE_PATTERNS) {
      if (pattern.test(text)) {
        return { date: getDate(), hasTime: false, originalText: matchText };
      }
    }

    return null;
  }

  /**
   * 解析优先级
   */
  private parsePriority(text: string): PriorityResult {
    const lowerText = text.toLowerCase();
    const importantMatches = IMPORTANT_KEYWORDS.filter((k) =>
      lowerText.includes(k.toLowerCase())
    );
    const urgentMatches = URGENT_KEYWORDS.filter((k) =>
      lowerText.includes(k.toLowerCase())
    );

    return {
      isImportant: importantMatches.length > 0,
      isUrgent: urgentMatches.length > 0,
      keywords: [...importantMatches, ...urgentMatches],
    };
  }

  /**
   * 推荐时长
   */
  private suggestDuration(text: string): DurationResult {
    const lowerText = text.toLowerCase();

    for (const rule of DURATION_RULES) {
      if (rule.keywords.some((k) => lowerText.includes(k.toLowerCase()))) {
        return {
          suggested: rule.duration,
          confidence: "high",
          reason: rule.reason,
        };
      }
    }

    return {
      suggested: DEFAULT_DURATION,
      confidence: "low",
      reason: "默认时长",
    };
  }

  /**
   * 分类任务
   */
  private categorizeTask(text: string): CategoryResult {
    const lowerText = text.toLowerCase();
    let bestCategory: TaskCategory = "other";
    let bestScore = 0;
    let matchedKeywords: string[] = [];

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [
      TaskCategory,
      string[],
    ][]) {
      const matches = keywords.filter((k) =>
        lowerText.includes(k.toLowerCase())
      );
      if (matches.length > bestScore) {
        bestScore = matches.length;
        bestCategory = category;
        matchedKeywords = matches;
      }
    }

    return {
      type: bestCategory,
      confidence: Math.min(bestScore / 3, 1), // 最多3个关键词就满分
      keywords: matchedKeywords,
    };
  }

  /**
   * 提取标签（#tag 格式）
   */
  private extractTags(text: string): string[] {
    const tagPattern = /#([\u4e00-\u9fa5\w]+)/g;
    const matches = text.match(tagPattern);
    return matches ? matches.map((t) => t.slice(1)) : [];
  }

  /**
   * 清理内容（移除已解析的部分）
   */
  private cleanContent(
    text: string,
    datetime: DatetimeResult | null,
    tags: string[]
  ): string {
    let cleaned = text;

    // 移除日期文本
    if (datetime?.originalText) {
      cleaned = cleaned.replace(datetime.originalText, "");
    }

    // 移除标签
    tags.forEach((tag) => {
      cleaned = cleaned.replace(`#${tag}`, "");
    });

    // 清理多余空格
    return cleaned.trim().replace(/\s+/g, " ");
  }

  /**
   * 完整的 NLP 解析
   */
  parseTaskText(text: string): NLPParseResult {
    const datetime = this.parseDatetime(text);
    const priority = this.parsePriority(text);
    const duration = this.suggestDuration(text);
    const category = this.categorizeTask(text);
    const tags = this.extractTags(text);
    const cleanedContent = this.cleanContent(text, datetime, tags);

    return {
      cleanContent: cleanedContent,
      datetime,
      priority,
      duration,
      category,
      tags,
    };
  }

  /**
   * 获取分类的显示名称
   */
  getCategoryLabel(category: TaskCategory): string {
    return CATEGORY_LABELS[category];
  }

  /**
   * 获取分类的颜色
   */
  getCategoryColor(category: TaskCategory): string {
    return CATEGORY_COLORS[category];
  }
}
