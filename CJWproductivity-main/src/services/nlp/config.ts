/**
 * @file services/nlp/config.ts
 * @description NLP 服务配置 - 关键词和规则
 * 
 * 设计原则:
 * - 配置与逻辑分离
 * - 方便后续国际化
 * - 易于扩展和维护
 */

import type { TaskCategory } from "./types";

// ============ 优先级关键词 ============

/** 重要性关键词 */
export const IMPORTANT_KEYWORDS = [
  "重要", "关键", "必须", "一定要", "核心", "主要", "优先",
  "重点", "紧要", "要紧", "首要", "vital", "important", "key",
  "老板", "领导", "客户", "合同", "deadline", "截止",
];

/** 紧急性关键词 */
export const URGENT_KEYWORDS = [
  "紧急", "立即", "马上", "尽快", "急", "赶紧", "火速",
  "今天", "现在", "立刻", "urgent", "asap", "immediately",
  "加急", "催", "等不及", "来不及",
];

// ============ 分类关键词 ============

/** 任务分类关键词映射 */
export const CATEGORY_KEYWORDS: Record<TaskCategory, string[]> = {
  work: [
    "工作", "项目", "会议", "报告", "邮件", "汇报", "方案", "文档",
    "需求", "开发", "测试", "上线", "部署", "review", "code",
    "ppt", "excel", "word", "客户", "合同", "提案", "周报",
  ],
  study: [
    "学习", "看书", "阅读", "课程", "培训", "考试", "作业",
    "论文", "研究", "笔记", "复习", "预习", "教程", "视频",
    "英语", "编程", "算法", "背单词",
  ],
  life: [
    "买", "购物", "超市", "快递", "取件", "寄", "洗", "打扫",
    "整理", "收拾", "修", "换", "交", "缴费", "水电", "房租",
  ],
  health: [
    "运动", "健身", "跑步", "锻炼", "gym", "瑜伽", "游泳",
    "医院", "体检", "看病", "吃药", "睡觉", "休息", "早起",
  ],
  social: [
    "聚会", "约", "见面", "吃饭", "聚餐", "生日", "礼物",
    "朋友", "同学", "家人", "电话", "联系", "拜访",
  ],
  finance: [
    "理财", "投资", "股票", "基金", "记账", "报销", "转账",
    "还款", "信用卡", "贷款", "工资", "预算",
  ],
  creative: [
    "设计", "画", "写", "创作", "拍", "剪辑", "音乐",
    "视频", "博客", "文章", "小说", "idea", "灵感",
  ],
  other: [],
};

/** 分类显示名称 */
export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  work: "工作",
  study: "学习",
  life: "生活",
  health: "健康",
  social: "社交",
  finance: "财务",
  creative: "创意",
  other: "其他",
};

/** 分类颜色 */
export const CATEGORY_COLORS: Record<TaskCategory, string> = {
  work: "#3B82F6",    // 蓝色
  study: "#8B5CF6",   // 紫色
  life: "#10B981",    // 绿色
  health: "#F59E0B",  // 橙色
  social: "#EC4899",  // 粉色
  finance: "#6366F1", // 靛蓝
  creative: "#F97316",// 橙红
  other: "#6B7280",   // 灰色
};

// ============ 时长估算规则 ============

export interface DurationRule {
  keywords: string[];
  duration: number;
  reason: string;
}

/** 时长估算规则 */
export const DURATION_RULES: DurationRule[] = [
  { keywords: ["会议", "开会", "meeting"], duration: 60, reason: "会议通常1小时" },
  { keywords: ["电话", "call", "打电话"], duration: 15, reason: "电话通常15分钟" },
  { keywords: ["邮件", "email", "回复"], duration: 15, reason: "邮件处理约15分钟" },
  { keywords: ["报告", "汇报", "ppt"], duration: 120, reason: "报告准备约2小时" },
  { keywords: ["买", "购物"], duration: 30, reason: "购物约30分钟" },
  { keywords: ["运动", "健身", "跑步", "锻炼"], duration: 45, reason: "运动约45分钟" },
  { keywords: ["看书", "阅读", "学习"], duration: 60, reason: "学习约1小时" },
  { keywords: ["吃饭", "聚餐", "约饭"], duration: 90, reason: "聚餐约1.5小时" },
  { keywords: ["整理", "打扫", "收拾"], duration: 30, reason: "整理约30分钟" },
  { keywords: ["写", "文章", "文档"], duration: 90, reason: "写作约1.5小时" },
  { keywords: ["review", "code review"], duration: 30, reason: "代码审查约30分钟" },
  { keywords: ["面试"], duration: 60, reason: "面试约1小时" },
];

/** 默认时长 */
export const DEFAULT_DURATION = 30;

// ============ 额外日期模式 ============

export interface ExtraDatePattern {
  pattern: RegExp;
  getDate: () => Date;
  text: string;
}

/** chrono-node 可能不支持的额外日期表达式 */
export const EXTRA_DATE_PATTERNS: ExtraDatePattern[] = [
  {
    pattern: /这?周末/,
    getDate: () => {
      const d = new Date();
      const day = d.getDay();
      const diff = day === 0 ? 0 : 6 - day;
      d.setDate(d.getDate() + diff);
      return d;
    },
    text: "周末",
  },
  {
    pattern: /下周一/,
    getDate: () => {
      const d = new Date();
      const day = d.getDay();
      const diff = day === 0 ? 1 : 8 - day;
      d.setDate(d.getDate() + diff);
      return d;
    },
    text: "下周一",
  },
  {
    pattern: /月底/,
    getDate: () => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1, 0);
      return d;
    },
    text: "月底",
  },
  {
    pattern: /下个?月初/,
    getDate: () => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1, 1);
      return d;
    },
    text: "下月初",
  },
];
