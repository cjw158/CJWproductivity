/**
 * @file IPlanImageRepository.ts
 * @description 计划图片仓储接口定义
 * 
 * 设计原则：
 * 1. 接口隔离 - 只暴露必要的方法
 * 2. 依赖倒置 - 上层依赖抽象而非实现
 * 3. 单一职责 - 仅处理图片存储相关操作
 */

import type { PlanImage, CreatePlanImageInput } from "@/types";

/**
 * 计划图片仓储接口
 * 
 * @interface IPlanImageRepository
 * @description 定义计划图片的 CRUD 操作契约
 */
export interface IPlanImageRepository {
  /**
   * 初始化仓储（创建表/目录等）
   */
  initialize(): Promise<void>;

  /**
   * 获取所有计划图片
   * @returns 按创建时间倒序的图片列表
   */
  getAll(): Promise<PlanImage[]>;

  /**
   * 根据 ID 获取单个图片
   * @param id - 图片 ID
   */
  getById(id: number): Promise<PlanImage | null>;

  /**
   * 创建新的计划图片记录
   * @param input - 创建输入
   * @param imageData - 图片二进制数据
   */
  create(input: CreatePlanImageInput, imageData: Uint8Array): Promise<PlanImage>;

  /**
   * 更新图片标题
   * @param id - 图片 ID
   * @param title - 新标题
   */
  updateTitle(id: number, title: string): Promise<PlanImage>;

  /**
   * 删除图片（同时删除文件）
   * @param id - 图片 ID
   */
  delete(id: number): Promise<void>;

  /**
   * 获取图片的完整访问路径
   * @param imagePath - 数据库中存储的相对路径
   * @returns 完整路径，如果文件不存在则返回空字符串
   */
  getFullPath(imagePath: string): Promise<string>;

  /**
   * 清理孤立记录（文件已丢失的数据库记录）
   * @returns 清理的记录数量
   */
  cleanupOrphanedRecords(): Promise<number>;
}
