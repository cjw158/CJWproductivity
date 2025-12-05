/**
 * 简体中文翻译
 */
export const zhCN = {
  // 通用
  common: {
    save: "保存",
    cancel: "取消",
    confirm: "确认",
    delete: "删除",
    edit: "编辑",
    create: "创建",
    search: "搜索",
    loading: "加载中...",
    noData: "暂无数据",
    success: "成功",
    error: "错误",
    warning: "警告",
    info: "提示",
  },

  // 导航
  nav: {
    tasks: "待办",
    plans: "计划",
    notes: "笔记",
    calendar: "日历",
    settings: "设置",
  },

  // 设置页面
  settings: {
    title: "设置",
    categories: {
      general: "通用",
      theme: "外观",
      island: "灵动岛",
      shortcuts: "快捷键",
      data: "数据",
      notifications: "通知",
      developer: "开发者",
      about: "关于",
    },

    // 通用设置
    general: {
      language: "界面语言",
      languageDesc: "选择应用显示语言",
      fontSize: "字体大小",
      fontSizeDesc: "当前: {size}px（范围 {min}-{max}px）",
      startPage: "启动页面",
      startPageDesc: "应用启动时显示的页面",
      minimizeToTray: "最小化到托盘",
      minimizeToTrayDesc: "关闭窗口时最小化到系统托盘",
    },

    // 外观设置
    theme: {
      mode: "主题模式",
      modeDesc: "选择界面主题",
      light: "浅色",
      dark: "深色",
      system: "跟随系统",
      accentColor: "强调色",
      accentColorDesc: "自定义主题强调色",
      animations: "动画效果",
      animationsDesc: "启用界面动画",
      glassEffect: "毛玻璃效果",
      glassEffectDesc: "启用背景模糊效果",
    },

    // 灵动岛设置
    island: {
      enabled: "启用灵动岛",
      enabledDesc: "在桌面显示悬浮待办窗口",
      autoShow: "开机自动显示",
      autoShowDesc: "启动应用时自动显示灵动岛",
      position: "位置",
      positionDesc: "直接拖拽灵动岛移动到任意位置",
      freeDrag: "自由拖拽",
      opacity: "透明度",
      opacityDesc: "调整灵动岛背景透明度",
    },

    // 快捷键设置
    shortcuts: {
      globalShortcuts: "全局快捷键（后台可用）",
      globalQuickCapture: "快速捕获",
      globalToggleIsland: "切换灵动岛",
      globalShowMain: "显示主窗口",
      recording: "按下快捷键...",
      hint: "点击快捷键框，然后按下新的组合键来修改",
    },

    // 数据设置
    data: {
      autoBackup: "自动备份",
      autoBackupDesc: "定期自动备份数据",
      fullBackup: "完整数据备份",
      fullBackupDesc: "导出或导入所有数据，包括任务、计划、笔记和设置",
      exportAll: "导出所有数据",
      importAll: "导入数据恢复",
      exporting: "导出中...",
      importing: "导入中...",
      settingsOnly: "仅设置",
      settingsOnlyDesc: "只导出或导入应用设置，不包括任务等数据",
      exportSettings: "导出设置",
      importSettings: "导入设置",
      resetSettings: "重置设置",
      exportSuccess: "导出成功",
      exportSuccessDesc: "所有数据已保存",
      exportFailed: "导出失败",
      importSuccess: "导入成功",
      importSuccessDesc: "已导入 {tasks} 任务、{plans} 计划、{notes} 笔记",
      importFailed: "导入失败",
      importFailedDesc: "请检查文件格式",
      importConfirm: "导入将覆盖现有的所有数据（任务、计划、笔记、设置）。\n\n确定要继续吗？",
      resetConfirm: "确定要重置所有设置吗？此操作不可撤销。",
      resetSuccess: "已重置为默认设置",
      settingsExportSuccess: "设置导出成功",
      settingsImportSuccess: "设置导入成功",
    },

    // 通知设置
    notifications: {
      enabled: "启用通知",
      enabledDesc: "允许应用发送系统通知",
      taskReminder: "任务提醒",
      taskReminderDesc: "任务截止前发送提醒",
      reminderTime: "提前提醒时间",
      reminderTimeDesc: "任务截止前多久提醒",
      sound: "声音提醒",
      soundDesc: "通知时播放提示音",
      minutes: "{n} 分钟",
      hour: "1 小时",
    },

    // 开发者设置
    developer: {
      liveWallpaper: "动态壁纸",
      liveWallpaperDesc: "启用实验性动态壁纸功能",
      wallpaperType: "壁纸类型",
      wallpaperTypeDesc: "选择动态壁纸的视觉效果",
      wallpaperOpacity: "壁纸透明度",
      wallpaperSpeed: "动画速度",
      showFps: "显示 FPS",
      showFpsDesc: "在角落显示帧率",
      wallpaperTypes: {
        none: "无",
        nebula: "星云",
        matrix: "矩阵",
        particles: "粒子",
        waves: "波浪",
      },
    },

    // 关于
    about: {
      version: "版本",
      description: "一款优雅的个人效率工具",
      author: "作者",
      github: "GitHub",
      feedback: "反馈",
    },
  },

  // 任务页面
  tasks: {
    title: "待办事项",
    newTask: "新建任务",
    placeholder: "添加新任务...",
    completed: "已完成",
    pending: "待处理",
    overdue: "已过期",
    today: "今天",
    tomorrow: "明天",
    thisWeek: "本周",
    noTasks: "暂无任务",
    addFirst: "添加你的第一个任务",
  },

  // 计划页面
  plans: {
    title: "计划",
    newPlan: "新建计划",
    progress: "进度",
    deadline: "截止日期",
    noPlans: "暂无计划",
    unsupportedFormat: "不支持的图片格式",
    imageTooLarge: "图片过大（最大20MB）",
    uploadSuccess: "上传成功",
    uploadFailed: "上传失败",
    deleted: "已删除",
    deleteFailed: "删除失败",
    uploadingPasted: "正在上传粘贴的图片...",
    titleUpdated: "标题已更新",
    updateFailed: "更新失败",
    zoomOut: "缩小 (-)",
    zoomIn: "放大 (+)",
    rotate: "旋转 (R)",
    fullscreen: "全屏 (F)",
    info: "信息 (I)",
    dropToUpload: "拖放图片上传",
    clickOrDrop: "点击或拖放上传",
    supportedFormats: "支持 JPG、PNG、GIF、WebP",
    uploading: "上传中...",
    noImages: "还没有计划图片",
    uploadFirst: "上传你的第一张计划图片",
    editTitle: "编辑标题",
    delete: "删除图片",
  },

  // 笔记页面
  notes: {
    title: "笔记",
    newNote: "新建笔记",
    untitled: "无标题笔记",
    lastEdited: "最近编辑",
    noNotes: "暂无笔记",
    searchPlaceholder: "搜索笔记...",
    allNotes: "全部笔记",
    recentlyDeleted: "最近删除",
    folders: "文件夹",
    newFolder: "新建文件夹",
    folderName: "文件夹名称...",
    notesCount: "{count} 条笔记",
    pinned: "置顶",
    unpin: "取消置顶",
    pin: "置顶笔记",
    moveTo: "移动到",
    deleteNote: "删除笔记",
    selectOrCreate: "选择或创建一个笔记",
    lastEditTime: "上次编辑：{time}",
    editMode: "切换至编辑模式",
    viewMode: "切换至浏览模式",
    fullscreen: "全屏编辑",
    exitFullscreen: "退出全屏",
    loadingEditor: "加载编辑器...",
    export: "导出",
    exportAs: "导出为",
    exportSuccess: "导出成功",
    exportFailed: "导出失败",
    downloadFolder: "下载文件夹",
    view: "浏览",
    edit: "编辑",
    words: "字",
  },

  // 灵动岛
  island: {
    quickCapture: "快速捕获",
    inputPlaceholder: "记录想法...",
    inputPlaceholderNew: "记录新想法...",
    inputPlaceholderAppend: "追加到「{title}」",
    addTask: "添加任务",
    addNote: "添加笔记",
    pasteImage: "Ctrl+V 粘贴图片",
    newNote: "新建",
    selectNote: "选择",
    appendNote: "追加",
    appendToRecent: "追加到最近",
    newNoteBtn: "新建笔记",
    todayTasks: "今日任务",
    noTasksToday: "今日暂无任务",
    noActiveTask: "暂无进行中任务",
    upcomingTask: "即将开始:",
    screenshot: "截图",
  },

  // 日历
  calendar: {
    today: "今天",
    month: "月",
    week: "周",
    day: "日",
    tasksCount: "{total} 个任务，{pending} 个待完成",
    noTasksToday: "今日无任务",
    quickAdd: "快速添加",
    minutes: "{n}分钟",
  },

  // 编辑器
  editor: {
    bold: "粗体",
    italic: "斜体",
    underline: "下划线",
    strikethrough: "删除线",
    code: "代码",
    heading1: "一级标题",
    heading2: "二级标题",
    heading3: "三级标题",
    bulletList: "无序列表",
    numberedList: "有序列表",
    taskList: "任务列表",
    quote: "引用",
    codeBlock: "代码块",
    link: "链接",
    image: "图片",
    undo: "撤销",
    redo: "重做",
  },
};

// 定义翻译结构类型（不使用字面量类型）
type DeepStringify<T> = {
  [K in keyof T]: T[K] extends object ? DeepStringify<T[K]> : string;
};

export type TranslationKeys = DeepStringify<typeof zhCN>;
