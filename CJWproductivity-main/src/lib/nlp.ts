/**
 * @file nlp.ts
 * @description NLP 兼容层 - 重导出 services/nlp
 * 
 * @deprecated 请直接从 '@/services/nlp' 导入
 * 此文件保留用于向后兼容
 */

export {
  parseTaskText,
  getCategoryLabel,
  getCategoryColor,
  getNlpService,
} from "@/services/nlp";

export type {
  NLPParseResult,
  TaskCategory,
  DatetimeResult,
  PriorityResult,
  DurationResult,
  CategoryResult,
  INlpService,
} from "@/services/nlp";
