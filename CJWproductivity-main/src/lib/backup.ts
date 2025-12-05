/**
 * @file backup.ts
 * @description 数据备份与恢复服务
 * 
 * 支持导出和导入应用数据：任务、计划、笔记、设置
 * 
 * @note 计划图片暂不支持备份（文件系统权限限制）
 */

import { getAllTasks, createTask, deleteTask, initializeDataStore } from "./tasks";
import { getAllPlans, getKeyResultsByPlan, createPlan, createKeyResult, deletePlan, initializePlanStore } from "./plans";
import { getNotes, getFolders, createNote, deleteNote } from "./notes";
import { settingsRepository } from "@/services/settings/SettingsRepository";
import { logger } from "./logger";
import type { Task, Plan, KeyResult, CreateTaskInput, CreatePlanInput, CreateKeyResultInput } from "@/types";
import type { Note, Folder, CreateNoteInput } from "./notes";
import type { AppSettings } from "@/types/settings";

// ============ Types ============

export interface BackupData {
  version: string;
  exportedAt: string;
  appVersion: string;
  data: {
    tasks: Task[];
    plans: Plan[];
    keyResults: KeyResult[];
    notes: Note[];
    folders: Folder[];
    settings: AppSettings;
  };
}

export interface ImportResult {
  success: boolean;
  message: string;
  stats?: {
    tasks: number;
    plans: number;
    keyResults: number;
    notes: number;
  };
}

// ============ Constants ============

const BACKUP_VERSION = "1.0";
const APP_VERSION = "0.1.0";

// ============ Export ============

/**
 * 导出所有数据为 JSON
 */
export async function exportAllData(): Promise<string> {
  try {
    logger.debug("[Backup] Starting data export...");

    // 获取所有任务（带错误处理）
    let tasks: Task[] = [];
    try {
      tasks = await getAllTasks();
    } catch (e) {
      logger.warn("[Backup] Failed to get tasks, using empty array");
    }
    logger.debug(`[Backup] Exported ${tasks.length} tasks`);

    // 获取所有计划和关键结果（带错误处理）
    let plans: Plan[] = [];
    const keyResults: KeyResult[] = [];
    try {
      plans = await getAllPlans();
      for (const plan of plans) {
        const krs = await getKeyResultsByPlan(plan.id);
        keyResults.push(...krs);
      }
    } catch (e) {
      logger.warn("[Backup] Failed to get plans, using empty array");
    }
    logger.debug(`[Backup] Exported ${plans.length} plans, ${keyResults.length} key results`);

    // 获取所有笔记和文件夹（带错误处理）
    let allNotes: Note[] = [];
    let folders: Folder[] = [];
    try {
      const notes = await getNotes("all");
      const trashedNotes = await getNotes("trash");
      allNotes = [...notes, ...trashedNotes];
      folders = await getFolders();
    } catch (e) {
      logger.warn("[Backup] Failed to get notes, using empty array");
    }
    logger.debug(`[Backup] Exported ${allNotes.length} notes, ${folders.length} folders`);

    // 获取设置
    const settings = await settingsRepository.get();
    logger.debug("[Backup] Exported settings");

    // 构建备份数据
    const backup: BackupData = {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      appVersion: APP_VERSION,
      data: {
        tasks,
        plans,
        keyResults,
        notes: allNotes,
        folders,
        settings,
      },
    };

    const json = JSON.stringify(backup, null, 2);
    logger.debug(`[Backup] Export complete, size: ${json.length} bytes`);

    return json;
  } catch (error) {
    logger.error("[Backup] Export failed:", error);
    throw new Error("导出数据失败");
  }
}

/**
 * 下载备份文件（打开文件管理器选择保存位置）
 */
export async function downloadBackup(): Promise<boolean> {
  const json = await exportAllData();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const defaultFilename = `cjw-backup-${timestamp}.json`;

  try {
    // 使用 Tauri 的保存对话框
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeTextFile } = await import("@tauri-apps/plugin-fs");

    const filePath = await save({
      defaultPath: defaultFilename,
      filters: [
        { name: "JSON 文件", extensions: ["json"] },
        { name: "所有文件", extensions: ["*"] },
      ],
      title: "导出数据备份",
    });

    if (filePath) {
      await writeTextFile(filePath, json);
      logger.debug(`[Backup] Saved to: ${filePath}`);
      return true;
    } else {
      // 用户取消了保存
      logger.debug("[Backup] Save cancelled by user");
      return false;
    }
  } catch (error) {
    logger.error("[Backup] Save dialog failed, falling back to download:", error);
    
    // 降级：使用浏览器下载方式
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = defaultFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    logger.debug(`[Backup] Downloaded via browser: ${defaultFilename}`);
    return true;
  }
}

// ============ Import ============

/**
 * 验证备份数据格式
 */
function validateBackupData(data: unknown): data is BackupData {
  if (!data || typeof data !== "object") return false;
  
  const backup = data as BackupData;
  
  if (!backup.version || !backup.data) return false;
  if (!Array.isArray(backup.data.tasks)) return false;
  if (!Array.isArray(backup.data.plans)) return false;
  if (!Array.isArray(backup.data.notes)) return false;
  if (!backup.data.settings) return false;
  
  return true;
}

/**
 * 导入数据（会清空现有数据）
 */
export async function importAllData(json: string, clearExisting: boolean = true): Promise<ImportResult> {
  try {
    logger.debug("[Backup] Starting data import...");

    // 解析 JSON
    let backup: BackupData;
    try {
      backup = JSON.parse(json);
    } catch {
      return { success: false, message: "无效的 JSON 格式" };
    }

    // 验证数据结构
    if (!validateBackupData(backup)) {
      return { success: false, message: "备份文件格式不正确" };
    }

    logger.debug(`[Backup] Backup version: ${backup.version}, exported at: ${backup.exportedAt}`);

    // 初始化数据库连接
    logger.debug("[Backup] Initializing data stores...");
    await initializeDataStore();
    await initializePlanStore();

    // 清空现有数据（如果需要）
    if (clearExisting) {
      logger.debug("[Backup] Clearing existing data...");
      
      // 删除现有任务
      const existingTasks = await getAllTasks();
      for (const task of existingTasks) {
        await deleteTask(task.id);
      }
      
      // 删除现有计划
      const existingPlans = await getAllPlans();
      for (const plan of existingPlans) {
        await deletePlan(plan.id);
      }
      
      // 删除现有笔记
      const existingNotes = await getNotes("all");
      for (const note of existingNotes) {
        await deleteNote(note.id);
      }
    }

    // 导入任务
    let importedTasks = 0;
    for (const task of backup.data.tasks) {
      const input: CreateTaskInput = {
        content: task.content || "未命名任务",
        status: task.status,
        due_date: task.due_date,
        scheduled_time: task.scheduled_time,
        duration: task.duration,
      };
      await createTask(input);
      importedTasks++;
    }
    logger.debug(`[Backup] Imported ${importedTasks} tasks`);

    // 导入计划（需要记录 ID 映射以便导入关键结果）
    let importedPlans = 0;
    let importedKeyResults = 0;
    const planIdMap = new Map<number, number>(); // oldId -> newId

    for (const plan of backup.data.plans) {
      const input: CreatePlanInput = {
        title: plan.title,
        description: plan.description || undefined,
        color: plan.color,
        start_date: plan.start_date || undefined,
        end_date: plan.end_date || undefined,
      };
      const newPlan = await createPlan(input);
      planIdMap.set(plan.id, newPlan.id);
      importedPlans++;
    }

    // 导入关键结果
    if (backup.data.keyResults) {
      for (const kr of backup.data.keyResults) {
        const newPlanId = planIdMap.get(kr.plan_id);
        if (newPlanId) {
          const input: CreateKeyResultInput = {
            plan_id: newPlanId,
            title: kr.title,
            target_value: kr.target_value,
            unit: kr.unit,
          };
          await createKeyResult(input);
          importedKeyResults++;
        }
      }
    }
    logger.debug(`[Backup] Imported ${importedPlans} plans, ${importedKeyResults} key results`);

    // 导入笔记
    let importedNotes = 0;
    for (const note of backup.data.notes) {
      const input: CreateNoteInput = {
        content: note.content,
        folder_id: note.folder_id,
        is_pinned: note.is_pinned,
      };
      await createNote(input);
      importedNotes++;
    }
    logger.debug(`[Backup] Imported ${importedNotes} notes`);

    // 导入设置
    if (backup.data.settings) {
      await settingsRepository.import(JSON.stringify(backup.data.settings));
      logger.debug("[Backup] Imported settings");
    }

    logger.debug("[Backup] Import complete!");

    return {
      success: true,
      message: "数据导入成功",
      stats: {
        tasks: importedTasks,
        plans: importedPlans,
        keyResults: importedKeyResults,
        notes: importedNotes,
      },
    };
  } catch (error) {
    logger.error("[Backup] Import failed:", error);
    return { success: false, message: `导入失败: ${error}` };
  }
}

/**
 * 从文件导入数据
 */
export async function importFromFile(file: File, clearExisting: boolean = true): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const json = e.target?.result as string;
      if (!json) {
        resolve({ success: false, message: "无法读取文件" });
        return;
      }
      const result = await importAllData(json, clearExisting);
      resolve(result);
    };
    
    reader.onerror = () => {
      resolve({ success: false, message: "文件读取错误" });
    };
    
    reader.readAsText(file);
  });
}
