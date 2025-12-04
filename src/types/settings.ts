/**
 * @file settings.ts
 * @description 设置相关类型定义
 * 
 * 设计原则：
 * 1. 所有设置项都有默认值
 * 2. 支持版本迁移
 * 3. 类型安全
 */

// ============ 主题设置 ============

export type ThemeMode = "light" | "dark" | "system";

export interface ThemeSettings {
  /** 主题模式 */
  mode: ThemeMode;
  /** 强调色（十六进制） */
  accentColor: string;
  /** 是否启用动画 */
  enableAnimations: boolean;
  /** 是否启用毛玻璃效果 */
  enableGlassEffect: boolean;
}

// ============ 灵动岛设置 ============

export type IslandPosition = "top-left" | "top-center" | "top-right";

export interface IslandSettings {
  /** 是否启用灵动岛 */
  enabled: boolean;
  /** 开机自动显示 */
  autoShow: boolean;
  /** 位置 */
  position: IslandPosition;
  /** 透明度 (0-100) */
  opacity: number;
}

// ============ 快捷键设置 ============

export interface ShortcutSettings {
  /** 全局：打开快速捕获 */
  globalQuickCapture: string;
  /** 全局：切换灵动岛 */
  globalToggleIsland: string;
  /** 全局：显示主窗口 */
  globalShowMain: string;
  /** 窗口内：快速捕获 */
  quickCapture: string;
  /** 窗口内：切换主题 */
  toggleTheme: string;
  /** 窗口内：新建任务 */
  newTask: string;
  /** 窗口内：新建笔记 */
  newNote: string;
}

// ============ 通用设置 ============

export type Language = "zh-CN" | "en-US";
/** 字体大小：12-24px 范围 */
export type FontSize = number;
export type StartPage = "tasks" | "plans" | "notes";

export interface GeneralSettings {
  /** 界面语言 */
  language: Language;
  /** 字体大小 */
  fontSize: FontSize;
  /** 启动时显示的页面 */
  startPage: StartPage;
  /** 是否开机自启 */
  launchAtLogin: boolean;
  /** 是否最小化到托盘 */
  minimizeToTray: boolean;
  /** 是否显示系统托盘图标 */
  showTrayIcon: boolean;
}

// ============ 数据设置 ============

export interface DataSettings {
  /** 数据存储路径（留空使用默认） */
  dataPath: string;
  /** 是否自动备份 */
  autoBackup: boolean;
  /** 备份间隔（天） */
  backupInterval: number;
  /** 保留备份数量 */
  backupRetention: number;
}

// ============ 通知设置 ============

export interface NotificationSettings {
  /** 是否启用通知 */
  enabled: boolean;
  /** 任务提醒 */
  taskReminder: boolean;
  /** 提前提醒时间（分钟） */
  reminderMinutes: number;
  /** 声音提醒 */
  soundEnabled: boolean;
}

// ============ 开发者设置 ============

export type LiveWallpaperType = "none" | "nebula" | "matrix" | "particles" | "waves";

export interface DeveloperSettings {
  /** 是否启用动态壁纸 */
  enableLiveWallpaper: boolean;
  /** 动态壁纸类型 */
  liveWallpaperType: LiveWallpaperType;
  /** 动态壁纸不透明度 (0-100) */
  liveWallpaperOpacity: number;
  /** 动态壁纸速度 (0.1-2.0) */
  liveWallpaperSpeed: number;
  /** 是否显示 FPS */
  showFps: boolean;
}

// ============ 完整设置类型 ============

export interface AppSettings {
  /** 设置版本号（用于迁移） */
  version: number;
  /** 主题设置 */
  theme: ThemeSettings;
  /** 灵动岛设置 */
  island: IslandSettings;
  /** 快捷键设置 */
  shortcuts: ShortcutSettings;
  /** 通用设置 */
  general: GeneralSettings;
  /** 数据设置 */
  data: DataSettings;
  /** 通知设置 */
  notifications: NotificationSettings;
  /** 开发者设置 */
  developer: DeveloperSettings;
}

// ============ 设置分组（用于 UI 展示） ============

export type SettingsCategory = 
  | "general"
  | "theme"
  | "island"
  | "shortcuts"
  | "data"
  | "notifications"
  | "developer"
  | "about";

export interface SettingsCategoryMeta {
  id: SettingsCategory;
  label: string;
  icon: string;
  description: string;
}

// ============ 默认设置 ============

export const DEFAULT_SETTINGS: AppSettings = {
  version: 1,
  theme: {
    mode: "dark",
    accentColor: "#00FFFF",
    enableAnimations: true,
    enableGlassEffect: true,
  },
  island: {
    enabled: false,
    autoShow: false,
    position: "top-center",
    opacity: 90,
  },
  shortcuts: {
    globalQuickCapture: "Alt+J",
    globalToggleIsland: "Alt+I",
    globalShowMain: "Alt+M",
    quickCapture: "Alt+J",
    toggleTheme: "Ctrl+Shift+T",
    newTask: "Ctrl+N",
    newNote: "Ctrl+Shift+N",
  },
  general: {
    language: "zh-CN",
    fontSize: 16,
    startPage: "tasks",
    launchAtLogin: false,
    minimizeToTray: true,
    showTrayIcon: true,
  },
  data: {
    dataPath: "",
    autoBackup: true,
    backupInterval: 7,
    backupRetention: 5,
  },
  notifications: {
    enabled: true,
    taskReminder: true,
    reminderMinutes: 15,
    soundEnabled: true,
  },
  developer: {
    enableLiveWallpaper: false,
    liveWallpaperType: "nebula",
    liveWallpaperOpacity: 30,
    liveWallpaperSpeed: 1.0,
    showFps: false,
  },
};

// ============ 设置更新类型 ============

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type SettingsUpdate = DeepPartial<Omit<AppSettings, "version">>;
