/**
 * @file PlanImageRepository.ts
 * @description 计划图片仓储实现（Tauri + SQLite + 本地文件系统）
 * 
 * 架构设计：
 * 1. 图片文件存储在应用数据目录下的 plan_images/ 文件夹
 * 2. SQLite 存储元数据（路径、标题、创建时间）
 * 3. 支持 Mock 模式用于浏览器开发环境
 * 
 * 文件命名策略：{timestamp}_{random}.{ext}
 * - 避免文件名冲突
 * - 保留原始扩展名
 */

import Database from "@tauri-apps/plugin-sql";
import { IPlanImageRepository } from "./IPlanImageRepository";
import type { PlanImage, CreatePlanImageInput } from "@/types";

// ============ 内部类型 ============

interface PlanImageRow {
  id: number;
  title: string;
  image_path: string;
  thumbnail_path: string | null;
  file_size: number;
  width: number | null;
  height: number | null;
  created_at: string;
}

// ============ 工具函数 ============

/**
 * 生成唯一文件名
 */
function generateFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split(".").pop() || "png";
  return `${timestamp}_${random}.${ext}`;
}

/**
 * 数据库行转领域对象
 */
function rowToModel(row: PlanImageRow): PlanImage {
  return {
    id: row.id,
    title: row.title,
    imagePath: row.image_path,
    thumbnailPath: row.thumbnail_path,
    fileSize: row.file_size,
    width: row.width,
    height: row.height,
    createdAt: row.created_at,
  };
}

// ============ 仓储实现 ============

export class PlanImageRepository implements IPlanImageRepository {
  private db: Database | null = null;
  private isMock = false;
  private mockData: PlanImage[] = [];
  private mockIdCounter = 1;
  private basePath = "";

  /**
   * 初始化数据库和文件存储目录
   */
  async initialize(): Promise<void> {
    if (this.db || this.isMock) return;

    try {
      // 环境检测
      if (typeof window !== "undefined" && 
          !("__TAURI__" in window) && 
          !("__TAURI_INTERNALS__" in window)) {
        console.warn("[PlanImageRepository] Browser environment, using Mock");
        this.isMock = true;
        return;
      }

      // 初始化数据库
      this.db = await Database.load("sqlite:cjwproductivity.db");
      
      // 创建表
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS plan_images (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          image_path TEXT NOT NULL,
          thumbnail_path TEXT,
          file_size INTEGER NOT NULL DEFAULT 0,
          width INTEGER,
          height INTEGER,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `);

      // 获取应用数据目录
      const { appDataDir, sep } = await import("@tauri-apps/api/path");
      let dataDir = await appDataDir();
      const separator = await sep();
      // 确保路径以分隔符结尾
      if (!dataDir.endsWith(separator) && !dataDir.endsWith("/") && !dataDir.endsWith("\\")) {
        dataDir += separator;
      }
      this.basePath = dataDir;
      console.log("[PlanImageRepository] Base path:", this.basePath);

      // 确保图片目录存在
      const { mkdir, exists } = await import("@tauri-apps/plugin-fs");
      const imagesDir = `${this.basePath}plan_images`;
      if (!(await exists(imagesDir))) {
        await mkdir(imagesDir, { recursive: true });
      }

    } catch (error) {
      console.error("[PlanImageRepository] Init failed, falling back to Mock:", error);
      this.isMock = true;
    }
  }

  /**
   * 获取所有图片，按创建时间倒序
   */
  async getAll(): Promise<PlanImage[]> {
    await this.initialize();

    if (this.isMock) {
      return [...this.mockData].reverse();
    }

    const rows = await this.db!.select<PlanImageRow[]>(
      "SELECT * FROM plan_images ORDER BY created_at DESC"
    );
    return rows.map(rowToModel);
  }

  /**
   * 根据 ID 获取图片
   */
  async getById(id: number): Promise<PlanImage | null> {
    await this.initialize();

    if (this.isMock) {
      return this.mockData.find((img) => img.id === id) || null;
    }

    const rows = await this.db!.select<PlanImageRow[]>(
      "SELECT * FROM plan_images WHERE id = ?",
      [id]
    );
    return rows.length > 0 ? rowToModel(rows[0]) : null;
  }

  /**
   * 创建图片记录并保存文件
   */
  async create(input: CreatePlanImageInput, imageData: Uint8Array): Promise<PlanImage> {
    await this.initialize();

    const fileName = generateFileName(input.fileName);
    const now = new Date().toISOString();

    if (this.isMock) {
      // Mock 模式：使用 Blob URL
      const blob = new Blob([new Uint8Array(imageData)], { type: "image/png" });
      const blobUrl = URL.createObjectURL(blob);
      
      const newImage: PlanImage = {
        id: this.mockIdCounter++,
        title: input.title,
        imagePath: blobUrl,
        thumbnailPath: null,
        fileSize: imageData.length,
        width: null,
        height: null,
        createdAt: now,
      };
      this.mockData.push(newImage);
      return newImage;
    }

    // 保存文件
    const { writeFile, mkdir, exists } = await import("@tauri-apps/plugin-fs");
    const { sep } = await import("@tauri-apps/api/path");
    const separator = await sep();
    // 使用系统分隔符确保路径一致
    const relativePath = `plan_images${separator}${fileName}`;
    const fullPath = `${this.basePath}${relativePath}`;
    
    // 确保目录存在
    const imagesDir = `${this.basePath}plan_images`;
    try {
      if (!(await exists(imagesDir))) {
        await mkdir(imagesDir, { recursive: true });
        console.log("[PlanImageRepository] Created directory:", imagesDir);
      }
    } catch (e) {
      console.error("[PlanImageRepository] Failed to create directory:", e);
    }
    
    console.log("[PlanImageRepository] Writing file to:", fullPath);
    await writeFile(fullPath, imageData);
    console.log("[PlanImageRepository] File written successfully");

    // 插入数据库记录
    const result = await this.db!.execute(
      `INSERT INTO plan_images (title, image_path, file_size, created_at) 
       VALUES (?, ?, ?, ?)`,
      [input.title, relativePath, imageData.length, now]
    );

    const image = await this.getById(result.lastInsertId!);
    if (!image) throw new Error("Failed to create plan image");
    
    return image;
  }

  /**
   * 更新图片标题
   */
  async updateTitle(id: number, title: string): Promise<PlanImage> {
    await this.initialize();

    if (this.isMock) {
      const image = this.mockData.find((img) => img.id === id);
      if (image) image.title = title;
      return image!;
    }

    await this.db!.execute(
      "UPDATE plan_images SET title = ? WHERE id = ?",
      [title, id]
    );

    const image = await this.getById(id);
    if (!image) throw new Error("Image not found");
    return image;
  }

  /**
   * 删除图片（数据库记录 + 文件）
   */
  async delete(id: number): Promise<void> {
    await this.initialize();

    if (this.isMock) {
      const index = this.mockData.findIndex((img) => img.id === id);
      if (index >= 0) {
        const img = this.mockData[index];
        if (img.imagePath.startsWith("blob:")) {
          URL.revokeObjectURL(img.imagePath);
        }
        this.mockData.splice(index, 1);
      }
      return;
    }

    // 获取文件路径
    const image = await this.getById(id);
    if (!image) return;

    // 删除文件
    try {
      const { remove } = await import("@tauri-apps/plugin-fs");
      await remove(`${this.basePath}${image.imagePath}`);
    } catch (e) {
      console.warn("[PlanImageRepository] Failed to delete file:", e);
    }

    // 删除数据库记录
    await this.db!.execute("DELETE FROM plan_images WHERE id = ?", [id]);
  }

  /**
   * 获取图片完整访问路径
   */
  async getFullPath(imagePath: string): Promise<string> {
    await this.initialize();

    if (this.isMock || imagePath.startsWith("blob:") || imagePath.startsWith("http")) {
      return imagePath;
    }

    // 检查文件是否存在
    try {
      const { exists } = await import("@tauri-apps/plugin-fs");
      const fullPath = `${this.basePath}${imagePath}`;
      const fileExists = await exists(fullPath);
      
      if (!fileExists) {
        console.warn(`[PlanImageRepository] Image file not found: ${fullPath}`);
        return ""; // 返回空字符串，UI 层可以显示占位符
      }

      // Tauri 需要使用 asset 协议访问本地文件
      const { convertFileSrc } = await import("@tauri-apps/api/core");
      return convertFileSrc(fullPath);
    } catch (error) {
      console.error("[PlanImageRepository] Failed to check file:", error);
      return "";
    }
  }

  /**
   * 清理孤立记录（文件已丢失的数据库记录）
   */
  async cleanupOrphanedRecords(): Promise<number> {
    await this.initialize();

    if (this.isMock) return 0;

    let cleanedCount = 0;
    const images = await this.getAll();
    const { exists } = await import("@tauri-apps/plugin-fs");

    for (const image of images) {
      const fullPath = `${this.basePath}${image.imagePath}`;
      try {
        if (!(await exists(fullPath))) {
          await this.db!.execute("DELETE FROM plan_images WHERE id = ?", [image.id]);
          cleanedCount++;
          console.info(`[PlanImageRepository] Cleaned orphaned record: ${image.id}`);
        }
      } catch (e) {
        // 忽略单个文件检查错误
      }
    }

    return cleanedCount;
  }
}
