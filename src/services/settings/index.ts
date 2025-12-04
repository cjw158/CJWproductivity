/**
 * @file index.ts
 * @description 设置服务模块导出
 */

export type { ISettingsRepository } from "./ISettingsRepository";
export { 
  SettingsRepository, 
  settingsRepository, 
  initializeSettings 
} from "./SettingsRepository";
