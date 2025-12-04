/**
 * @file TaskInputService.ts
 * @description 任务输入处理服务
 * 
 * 统一处理自然语言输入的解析和任务创建
 * 被 Spotlight 和 QuickCapture 共享
 */

import { parseTaskText, type NLPParseResult } from "@/lib/nlp";
import type { CreateTaskInput } from "@/types";

// ============ 类型定义 ============

export interface ParsedTaskInput {
  /** 清理后的任务内容 */
  content: string;
  /** 日期 (YYYY-MM-DD) */
  dueDate: string | null;
  /** 时间 (HH:mm) */
  scheduledTime: string | null;
  /** 是否重要 */
  isImportant: boolean;
  /** 是否紧急 */
  isUrgent: boolean;
  /** 推荐时长 */
  suggestedDuration: number;
  /** 完整的 NLP 解析结果 */
  nlpResult: NLPParseResult;
}

export interface TaskInputOptions {
  /** 是否自动应用 NLP 解析的日期 */
  autoApplyDate?: boolean;
  /** 是否自动应用 NLP 解析的优先级 */
  autoApplyPriority?: boolean;
  /** 是否自动应用 NLP 解析的时长 */
  autoApplyDuration?: boolean;
}

const DEFAULT_OPTIONS: TaskInputOptions = {
  autoApplyDate: true,
  autoApplyPriority: true,
  autoApplyDuration: false,
};

// ============ 服务类 ============

export class TaskInputService {
  private options: TaskInputOptions;

  constructor(options: Partial<TaskInputOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * 解析用户输入
   * @param rawInput - 原始输入文本
   * @returns 解析后的任务输入
   */
  parse(rawInput: string): ParsedTaskInput {
    const nlpResult = parseTaskText(rawInput);

    let dueDate: string | null = null;
    let scheduledTime: string | null = null;

    // 提取日期时间（使用本地时间）
    if (nlpResult.datetime?.date) {
      const date = nlpResult.datetime.date;
      dueDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
      
      if (nlpResult.datetime.hasTime) {
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        scheduledTime = `${hours}:${minutes}`;
      }
    }

    return {
      content: nlpResult.cleanContent || rawInput.trim(),
      dueDate,
      scheduledTime,
      isImportant: nlpResult.priority.isImportant,
      isUrgent: nlpResult.priority.isUrgent,
      suggestedDuration: nlpResult.duration.suggested,
      nlpResult,
    };
  }

  /**
   * 构建任务创建输入
   * @param parsed - 解析后的输入
   * @param overrides - 用户手动设置的覆盖值
   * @returns CreateTaskInput
   */
  buildCreateInput(
    parsed: ParsedTaskInput,
    overrides: Partial<{
      content: string;
      dueDate: string | null;
      scheduledTime: string | null;
      duration: number | null;
    }> = {}
  ): CreateTaskInput {
    const { autoApplyDate, autoApplyDuration } = this.options;

    return {
      content: overrides.content ?? parsed.content,
      status: "INBOX",
      due_date: overrides.dueDate !== undefined 
        ? overrides.dueDate 
        : (autoApplyDate ? parsed.dueDate : null),
      scheduled_time: overrides.scheduledTime !== undefined
        ? overrides.scheduledTime
        : (autoApplyDate ? parsed.scheduledTime : null),
      duration: overrides.duration !== undefined
        ? overrides.duration
        : (autoApplyDuration ? parsed.suggestedDuration : null),
    };
  }

  /**
   * 格式化日期时间显示
   * @param dueDate - 日期字符串
   * @param scheduledTime - 时间字符串
   * @returns 友好的显示文本
   */
  formatDateTime(dueDate: string | null, scheduledTime: string | null): string {
    if (!dueDate) return "";

    const date = new Date(dueDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dateStr: string;
    if (date.toDateString() === today.toDateString()) {
      dateStr = "今天";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dateStr = "明天";
    } else {
      dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
    }

    if (scheduledTime) {
      return `${dateStr} ${scheduledTime}`;
    }
    return dateStr;
  }

  /**
   * 获取 NLP 提示信息
   * @param parsed - 解析结果
   * @returns 提示数组
   */
  getHints(parsed: ParsedTaskInput): string[] {
    const hints: string[] = [];
    const { nlpResult } = parsed;

    if (nlpResult.datetime) {
      hints.push(`时间: ${nlpResult.datetime.originalText}`);
    }

    if (nlpResult.priority.isImportant || nlpResult.priority.isUrgent) {
      const labels: string[] = [];
      if (nlpResult.priority.isImportant) labels.push("重要");
      if (nlpResult.priority.isUrgent) labels.push("紧急");
      hints.push(`优先级: ${labels.join("+")}`);
    }

    if (nlpResult.category.type !== "other" && nlpResult.category.confidence > 0.3) {
      const categoryLabels: Record<string, string> = {
        work: "工作", study: "学习", life: "生活",
        health: "健康", social: "社交", finance: "财务", creative: "创意",
      };
      hints.push(`分类: ${categoryLabels[nlpResult.category.type]}`);
    }

    if (nlpResult.duration.confidence !== "low") {
      hints.push(`时长: ${nlpResult.duration.suggested}分钟`);
    }

    return hints;
  }
}

// ============ 单例导出 ============

let instance: TaskInputService | null = null;

export function getTaskInputService(): TaskInputService {
  if (!instance) {
    instance = new TaskInputService();
  }
  return instance;
}
