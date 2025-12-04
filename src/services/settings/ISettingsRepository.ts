/**
 * @file ISettingsRepository.ts
 * @description 设置仓储接口定义
 * 
 * 遵循 Repository Pattern，定义设置数据的存取契约。
 * 支持多种存储后端（SQLite、LocalStorage、内存等）。
 */

import type { AppSettings, SettingsUpdate } from "@/types/settings";

/**
 * 设置仓储接口
 * 
 * @description
 * 定义了设置数据的 CRUD 操作。所有实现类必须遵循此接口，
 * 以确保业务层与存储层的解耦。
 * 
 * @example
 * ```typescript
 * const repo: ISettingsRepository = new SettingsRepository();
 * await repo.initialize();
 * const settings = await repo.get();
 * await repo.update({ theme: { mode: "light" } });
 * ```
 */
export interface ISettingsRepository {
  /**
   * 初始化仓储
   * 
   * @description 
   * 执行必要的初始化操作，如创建数据库表、加载缓存等。
   * 必须在其他操作之前调用。
   * 
   * @returns Promise<void>
   * @throws Error 初始化失败时抛出
   */
  initialize(): Promise<void>;

  /**
   * 获取完整设置
   * 
   * @description
   * 返回合并了默认值的完整设置对象。
   * 即使存储中只有部分设置，也会返回完整结构。
   * 
   * @returns Promise<AppSettings> 完整设置对象
   */
  get(): Promise<AppSettings>;

  /**
   * 更新设置
   * 
   * @description
   * 支持深度合并的部分更新。
   * 只需传入需要更新的字段，其他字段保持不变。
   * 
   * @param update - 需要更新的设置项（深度部分类型）
   * @returns Promise<AppSettings> 更新后的完整设置
   * @throws Error 验证失败或存储失败时抛出
   * 
   * @example
   * ```typescript
   * // 只更新主题模式
   * await repo.update({ theme: { mode: "light" } });
   * 
   * // 更新多个设置
   * await repo.update({
   *   theme: { mode: "dark" },
   *   general: { fontSize: "large" }
   * });
   * ```
   */
  update(update: SettingsUpdate): Promise<AppSettings>;

  /**
   * 重置为默认设置
   * 
   * @description
   * 清除所有用户自定义设置，恢复为默认值。
   * 
   * @returns Promise<AppSettings> 默认设置对象
   */
  reset(): Promise<AppSettings>;

  /**
   * 导出设置
   * 
   * @description
   * 将当前设置导出为 JSON 字符串，用于备份或分享。
   * 
   * @returns Promise<string> JSON 格式的设置字符串
   */
  export(): Promise<string>;

  /**
   * 导入设置
   * 
   * @description
   * 从 JSON 字符串导入设置。会进行版本兼容性检查和数据验证。
   * 
   * @param json - JSON 格式的设置字符串
   * @returns Promise<AppSettings> 导入后的完整设置
   * @throws Error JSON 解析失败或验证失败时抛出
   */
  import(json: string): Promise<AppSettings>;
}
