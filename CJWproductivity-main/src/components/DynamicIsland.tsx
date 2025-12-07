/**
 * @file DynamicIsland.tsx
 * @description 桌面灵动岛 - 显示当前任务和今日任务列表
 */

import { memo, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAllTasks, type Task } from "@/lib/tasks";
import { useNotes, useCreateNote, useUpdateNote } from "@/hooks/useNotes";
import { useMoveTaskStatus } from "@/hooks/useTasks";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, FileText, Plus, Zap, Send, Scissors, Timer, Play, Pause, RotateCcw } from "lucide-react";
import { formatRemaining, getTaskRemaining, stripHtml, parseScheduledTime, extractH1Title } from "@/utils";
import { ISLAND_CONFIG } from "@/config/constants";
import { logger } from "@/lib/logger";

// Apple 风格系统字体
const SYSTEM_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif';

// 从配置常量解构
const {
  COLLAPSED_HEIGHT,
  EXPANDED_WIDTH,
  MIN_COLLAPSED_WIDTH,
  CAPTURE_HEIGHT,
} = ISLAND_CONFIG;

// 测量文本宽度的辅助函数（缓存 canvas 提升性能）
let textMeasureCanvas: HTMLCanvasElement | null = null;
let textMeasureCtx: CanvasRenderingContext2D | null = null;

const measureTextWidth = (text: string, font: string): number => {
  if (!textMeasureCanvas) {
    textMeasureCanvas = document.createElement("canvas");
    textMeasureCtx = textMeasureCanvas.getContext("2d");
  }
  if (textMeasureCtx) {
    textMeasureCtx.font = font;
    return textMeasureCtx.measureText(text).width;
  }
  return 0;
};

// 脉冲动画指示器（替代播放图标）
const PulseIndicator = ({ color, size = 8 }: { color: string; size?: number }) => (
  <div style={{ position: "relative", width: size, height: size }}>
    <motion.div
      animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
      }}
    />
    <div style={{
      position: "absolute",
      width: size,
      height: size,
      borderRadius: "50%",
      background: color,
    }} />
  </div>
);

// 完成勾选图标
const CheckIcon = ({ color, size = 14 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" fill={color} fillOpacity="0.15" />
    <path d="M8 12.5L10.5 15L16 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 空心圆图标
const CircleIcon = ({ color, size = 14 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
  </svg>
);

// 环形进度条
const CircularProgress = ({ progress, size = 16, color, strokeWidth = 2 }: { progress: number, size?: number, color: string, strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(Math.max(progress, 0), 100) / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeOpacity={0.2}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
    </div>
  );
};

export const DynamicIsland = memo(function DynamicIsland() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isCaptureMode, setIsCaptureMode] = useState(false);
  const [captureText, setCaptureText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showNoteSelector, setShowNoteSelector] = useState(false);
  const [noteMode, setNoteMode] = useState<"append" | "new" | "select">("append");
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [now, setNow] = useState(new Date());
  const [capturedImage, setCapturedImage] = useState<string | null>(null); // 粘贴的图片 Base64
  
  // 番茄钟状态
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25); // 设定时长（分钟）
  const [pomodoroRemaining, setPomodoroRemaining] = useState(0); // 剩余秒数
  const [isPomodoroActive, setIsPomodoroActive] = useState(false); // 是否运行中
  const [, setIsPomodoroHovered] = useState(false); // 悬停状态（保留用于未来扩展）
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === "dark";
  
  // 主题色
  const colors = useMemo(() => ({
    bg: isDark ? "#0a0a0a" : "#ffffff",
    text: isDark ? "#ffffff" : "#1a1a1a",
    textMuted: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
    accent: isDark ? "#22d3ee" : "#0ea5e9",
    success: "#22c55e",
    border: isDark ? "rgba(34,211,238,0.3)" : "rgba(14,165,233,0.3)",
    borderGlow: isDark ? "rgba(34,211,238,0.5)" : "rgba(14,165,233,0.5)",
    cardBg: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
  }), [isDark]);
  
  // 灵动岛窗口需要独立获取任务数据，启用实时刷新
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: getAllTasks,
    refetchOnMount: true,
    refetchInterval: 5000, // 每5秒刷新任务状态
    staleTime: 0,
  });

  // 获取笔记数据
  const { data: notes = [] } = useNotes("all");
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const moveTaskStatus = useMoveTaskStatus();
  
  // 最近的笔记（按更新时间排序）
  const recentNotes = useMemo(() => 
    [...notes]
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
      .slice(0, 5),
    [notes]
  );
  const latestNote = recentNotes[0];
  
  // 获取笔记标题（提取 h1 标题）
  const latestNoteTitle = useMemo(() => {
    if (!latestNote) return null;
    const title = extractH1Title(latestNote.content);
    // 截取前12个字符显示
    return title === "未命名笔记" ? title : title.slice(0, 12);
  }, [latestNote]);

  // 启动动画延迟
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // 监听快速捕获事件（来自 Tauri 和 window）
  useEffect(() => {
    const handleCapture = () => {
      logger.debug("[DynamicIsland] Capture event received, switching to capture mode");
      setIsCaptureMode(true);
      setIsExpanded(false);
      setCaptureText("");
      setCapturedImage(null); // 清除之前的图片
      setShowNoteSelector(false);
      setNoteMode("append");
      setSelectedNoteId(null);
      // 延迟聚焦
      setTimeout(() => inputRef.current?.focus(), 100);
    };

    window.addEventListener("island-capture", handleCapture);
    
    let unlisten: (() => void) | undefined;
    const setupTauriListener = async () => {
      try {
        const { listen } = await import("@tauri-apps/api/event");
        unlisten = await listen("island-capture-trigger", () => handleCapture());
      } catch (e) {
        console.error("[DynamicIsland] Failed to setup Tauri listener:", e);
      }
    };
    setupTauriListener();
    
    return () => {
      window.removeEventListener("island-capture", handleCapture);
      unlisten?.();
    };
  }, []);

  // 保存笔记
  const handleSave = useCallback(async () => {
    // 至少需要有文字或图片
    if (!captureText.trim() && !capturedImage) return;
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      const text = captureText.trim();
      // 构建 HTML 内容：文字 + 图片
      let htmlContent = "";
      if (text) {
        htmlContent += `<p>${text}</p>`;
      }
      if (capturedImage) {
        htmlContent += `<img src="${capturedImage}" alt="captured" />`;
      }
      
      if (noteMode === "new") {
        // 创建新笔记
        await createNote.mutateAsync({ content: htmlContent });
      } else if (noteMode === "select" && selectedNoteId) {
        // 追加到选中的笔记
        const targetNote = notes.find(n => n.id === selectedNoteId);
        if (targetNote) {
          const newContent = targetNote.content + htmlContent;
          await updateNote.mutateAsync({
            id: selectedNoteId,
            input: { content: newContent },
          });
        }
      } else if (latestNote) {
        // 默认追加到最近笔记
        const newContent = latestNote.content + htmlContent;
        await updateNote.mutateAsync({
          id: latestNote.id,
          input: { content: newContent },
        });
      } else {
        // 没有笔记时创建新的
        await createNote.mutateAsync({ content: htmlContent });
      }
      
      // 刷新笔记列表
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      
      // 成功后关闭
      setTimeout(() => {
        setIsCaptureMode(false);
        setCaptureText("");
        setCapturedImage(null);
        setIsSaving(false);
        setShowNoteSelector(false);
      }, 200);
    } catch (error) {
      console.error("Failed to save note:", error);
      setIsSaving(false);
    }
  }, [captureText, capturedImage, isSaving, noteMode, selectedNoteId, notes, latestNote, createNote, updateNote, queryClient]);

  // 处理键盘事件 - Shift+Enter 保存，Enter 换行
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      if (showNoteSelector) {
        setShowNoteSelector(false);
      } else {
        setIsCaptureMode(false);
        setCaptureText("");
        setCapturedImage(null);
      }
    }
  }, [handleSave, showNoteSelector]);

  // 处理粘贴事件 - 支持粘贴图片
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setCapturedImage(base64);
          };
          reader.readAsDataURL(file);
        }
        return;
      }
    }
  }, []);

  // 截图处理 - 隐藏窗口 → 触发系统截图 → 自动粘贴
  const handleScreenshot = useCallback(async () => {
    const win = getCurrentWindow();
    
    try {
      // 隐藏窗口 → 启动截图工具
      await win.hide();
      await new Promise(r => setTimeout(r, 150));
      
      const { Command } = await import("@tauri-apps/plugin-shell");
      await Command.create("cmd", ["/c", "start", "ms-screenclip:"]).execute();
      
      // 恢复窗口
      await new Promise(r => setTimeout(r, 1000));
      await win.show();
      await win.setFocus();
      setIsCaptureMode(true);
      inputRef.current?.focus();
      
      // 后台轮询剪贴板（15秒超时）
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 500));
        try {
          const items = await navigator.clipboard.read();
          for (const item of items) {
            const imageType = item.types.find(t => t.startsWith("image/"));
            if (imageType) {
              const blob = await item.getType(imageType);
              const base64 = await new Promise<string>(resolve => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
              setCapturedImage(base64);
              return;
            }
          }
        } catch { /* 继续等待 */ }
      }
    } catch (error) {
      logger.error("Screenshot failed:", error);
      await win.show().catch(() => {});
      setIsCaptureMode(true);
    }
  }, []);

  // 计算文本行数（限制 1-6 行）
  const lineCount = useMemo(() => 
    Math.min(Math.max(captureText.split("\n").length, 1), 6)
  , [captureText]);

  // 拖动处理
  const handleMouseDown = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    getCurrentWindow().startDragging().catch(() => {});
  }, []);

  // 时间更新 - 每秒更新以显示实时剩余时间
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 番茄钟倒计时
  useEffect(() => {
    if (!isPomodoroActive || pomodoroRemaining <= 0) return;
    
    const timer = setInterval(() => {
      setPomodoroRemaining(prev => {
        if (prev <= 1) {
          setIsPomodoroActive(false);
          // 播放提示音或通知
          try {
            const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleVJFnNzmxoFYOFOz8N62dFVZrPnpxIBfXqru4bl4X12p7+G3dV5cpO7ftXNdW6Lr3bNxW1mi6duxcFpYoOfZr25ZVp/l169tWFWd49WtbFdUnOHTq2tWUpri0alqVVGY4M+oaVRQl97NpmhTT5XdzKVnUk6U3MqjZlFNk9rJomVQTJLZyKBkT0uR2MefY05KkNbGnmJNSY/VxZ1hTEiO1MSbYEtHjdPDmmBKRozSwpleSkaL0cGYXUlFitDAl1xIRInPv5ZbR0OIzr6VWkZCh829lFlFQYbMvJNYRECFy7uSV0M/hMq6kVZCPoTJuZBVQT2DyLiPVEA8gsC3j1M/O4G/to5SPjqAvbWNUj05gLy0i1E8OIC7s4pQOzeAurKJUDo2f7mxiFQ3NYC4sIdTNjSAt6+GUjUzgLauhlE0MoC1rYVRMzGAs6yEUDIwgLKrgk8xL4CxqoFPMC6AsKmATy8tgK+of04uLICupn5OLSuArKV9TSsqgKukfE0qKYCqo3tMKSiAqaJ6TCgngKiheks=");
            audio.volume = 0.5;
            audio.play().catch(() => {});
          } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isPomodoroActive, pomodoroRemaining]);

  // 番茄钟控制函数
  const handlePomodoroStart = useCallback(() => {
    if (isPomodoroActive) {
      // 暂停
      setIsPomodoroActive(false);
    } else {
      // 开始/继续
      if (pomodoroRemaining === 0) {
        setPomodoroRemaining(pomodoroMinutes * 60);
      }
      setIsPomodoroActive(true);
    }
  }, [isPomodoroActive, pomodoroRemaining, pomodoroMinutes]);

  const handlePomodoroReset = useCallback(() => {
    setIsPomodoroActive(false);
    setPomodoroRemaining(0);
  }, []);

  // 滚轮调节番茄钟时长
  const handlePomodoroWheel = useCallback((e: React.WheelEvent) => {
    if (isPomodoroActive) return; // 运行中不允许调节
    e.preventDefault();
    e.stopPropagation();
    
    setPomodoroMinutes(prev => {
      const delta = e.deltaY < 0 ? 1 : -1;
      return Math.max(1, Math.min(60, prev + delta));
    });
  }, [isPomodoroActive]);

  // 格式化番茄钟时间显示
  const formatPomodoroTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // 番茄钟进度百分比
  const pomodoroProgress = useMemo(() => {
    if (pomodoroRemaining === 0) return 0;
    const total = pomodoroMinutes * 60;
    return ((total - pomodoroRemaining) / total) * 100;
  }, [pomodoroRemaining, pomodoroMinutes]);

  // 今日日期字符串 (YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [now.getFullYear(), now.getMonth(), now.getDate()]);
  
  const todayTasks = useMemo(() => 
    tasks.filter(t => t.due_date === todayStr).sort((a, b) => {
      // DOING 优先，然后按时间排序
      if (a.status === "DOING" && b.status !== "DOING") return -1;
      if (b.status === "DOING" && a.status !== "DOING") return 1;
      if (a.status === "DONE" && b.status !== "DONE") return 1;
      if (b.status === "DONE" && a.status !== "DONE") return -1;
      return (a.scheduled_time || "").localeCompare(b.scheduled_time || "");
    }),
  [tasks, todayStr]);

  // 当前正在进行的任务（可能多个）
  const activeTasks = useMemo(() => {
    const nowTime = now.getTime();
    return todayTasks.filter(t => {
      if (t.status === "DONE") return false;
      if (t.status === "DOING") return true;
      if (!t.scheduled_time) return false;
      const start = parseScheduledTime(t.scheduled_time);
      if (!start) return false;
      const duration = t.duration || 30;
      const end = new Date(start.getTime() + duration * 60000);
      return nowTime >= start.getTime() && nowTime <= end.getTime();
    });
  }, [todayTasks, now]);

  // 计算下一个任务（即将开始的）
  const nextTask = useMemo(() => {
    if (activeTasks.length > 0) return null;
    // 找一个今天还没开始，且有计划时间的任务
    return todayTasks.find(t => t.status === "TODO" && t.scheduled_time && parseScheduledTime(t.scheduled_time)!.getTime() > now.getTime());
  }, [activeTasks, todayTasks, now]);

  // 处理任务点击
  const handleToggleTask = useCallback(async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation(); // 阻止展开/收起
    const newStatus = task.status === "DONE" ? "TODO" : "DONE";
    await moveTaskStatus.mutateAsync({ id: task.id, status: newStatus });
  }, [moveTaskStatus]);

  const handleStartTask = useCallback(async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    if (task.status !== "DOING") {
        await moveTaskStatus.mutateAsync({ id: task.id, status: "DOING" });
    } else {
        await moveTaskStatus.mutateAsync({ id: task.id, status: "TODO" });
    }
  }, [moveTaskStatus]);

  // 计算收起状态的宽度
  const collapsedWidth = useMemo(() => {
    const padding = 40;
    const iconWidth = 22;
    const timeWidth = 40;
    
    // 番茄钟运行中时的宽度计算
    if (isPomodoroActive || pomodoroRemaining > 0) {
      // 番茄钟固定宽度：图标 + 时间 + padding
      const pomodoroWidth = padding + 24 + 60; // 图标24 + 时间文本60
      
      if (activeTasks.length > 0) {
        // 有任务时取较大值
        let taskWidth = padding;
        activeTasks.forEach((task, idx) => {
          if (idx > 0) taskWidth += 9;
          taskWidth += iconWidth;
          taskWidth += measureTextWidth(task.content, "600 14px " + SYSTEM_FONT);
          if (getTaskRemaining(task, now)) taskWidth += timeWidth;
          taskWidth += 8;
        });
        return Math.min(Math.max(pomodoroWidth, taskWidth, MIN_COLLAPSED_WIDTH), 800);
      }
      return Math.max(pomodoroWidth, MIN_COLLAPSED_WIDTH);
    }
    
    // 没有进行中任务且没有下一个任务，显示最小宽度
    if (activeTasks.length === 0 && !nextTask) return MIN_COLLAPSED_WIDTH;
    
    if (activeTasks.length > 0) {
      let totalWidth = padding;
      activeTasks.forEach((task, idx) => {
        if (idx > 0) totalWidth += 9;
        totalWidth += iconWidth;
        totalWidth += measureTextWidth(task.content, "600 14px " + SYSTEM_FONT);
        if (getTaskRemaining(task, now)) totalWidth += timeWidth;
        totalWidth += 8;
      });
      
      return Math.min(Math.max(totalWidth, MIN_COLLAPSED_WIDTH), 800);
    } else if (nextTask) {
       let width = padding;
       width += measureTextWidth("即将开始:", "12px " + SYSTEM_FONT) + 8;
       width += measureTextWidth(nextTask.content, "600 13px " + SYSTEM_FONT) + 8;
       width += measureTextWidth(nextTask.scheduled_time || "", "500 12px " + SYSTEM_FONT);
       return Math.min(Math.max(width, MIN_COLLAPSED_WIDTH), 400);
    }
    
    return MIN_COLLAPSED_WIDTH;
  }, [activeTasks, nextTask, now, isPomodoroActive, pomodoroRemaining]);

  // 计算捕获模式的宽度
  const captureWidth = useMemo(() => {
    const padding = 40; // 左右 padding
    const iconWidth = 38; // 图标区域宽度
    const buttonWidth = 60; // 下拉按钮宽度
    const imageWidth = capturedImage ? 44 : 0; // 图片预览宽度
    const gap = 20; // 间距
    
    // 根据 placeholder 或输入内容计算宽度
    let textContent = captureText;
    if (!textContent) {
      // 使用 placeholder 文本
      textContent = noteMode === "new" 
        ? "记录新想法... (Ctrl+V 粘贴图片)" 
        : latestNoteTitle 
          ? `追加到「${latestNoteTitle}...」(Ctrl+V 粘贴图片)` 
          : "记录想法... (Ctrl+V 粘贴图片)";
    }
    
    const textWidth = measureTextWidth(textContent, "500 14px " + SYSTEM_FONT);
    const totalWidth = padding + iconWidth + textWidth + imageWidth + buttonWidth + gap;
    
    // 最小 280，最大 600
    return Math.min(Math.max(totalWidth, 280), 600);
  }, [captureText, capturedImage, noteMode, latestNoteTitle]);

  // 计算展开状态的高度
  const expandedHeight = useMemo(() => {
    // 头部高度 (含 padding 和 border)
    const headerHeight = 50;
    // 每个任务项的高度 (padding + line height + border)
    const itemHeight = 45;
    // 容器 padding (上下各 16)
    const containerPadding = 32;
    // 空状态高度
    const emptyHeight = 60;
    
    if (todayTasks.length === 0) {
      return headerHeight + emptyHeight + containerPadding;
    }
    
    const listHeight = todayTasks.length * itemHeight;
    // 限制最大高度，避免超出屏幕太多，比如 600px
    return Math.min(headerHeight + listHeight + containerPadding, 600);
  }, [todayTasks.length]);

  // 动态调整窗口尺寸
  useEffect(() => {
    const resize = async () => {
      try {
        const win = getCurrentWindow();
        let width: number;
        let height: number;
        
        if (isCaptureMode) {
          width = captureWidth;
          // 基础高度 + 每行增加的高度
          const baseHeight = 52;
          const lineHeight = 22;
          const textHeight = baseHeight + (lineCount - 1) * lineHeight;
          height = showNoteSelector ? Math.max(textHeight, CAPTURE_HEIGHT) + 128 : textHeight;
        } else if (isExpanded) {
          width = EXPANDED_WIDTH;
          height = expandedHeight;
        } else {
          width = collapsedWidth;
          // 番茄钟运行中且有任务时显示两行
          const hasPomodoroWithTask = (isPomodoroActive || pomodoroRemaining > 0) && activeTasks.length > 0;
          height = hasPomodoroWithTask ? COLLAPSED_HEIGHT * 2 : COLLAPSED_HEIGHT;
        }
        
        await win.setSize(new LogicalSize(width, height));
      } catch (e) {
        // 忽略
      }
    };
    resize();
  }, [isExpanded, collapsedWidth, expandedHeight, isCaptureMode, captureWidth, showNoteSelector, lineCount, isPomodoroActive, pomodoroRemaining, activeTasks.length]);

  if (!isVisible) return null;

  return (
    <>
      {/* 强制隐藏滚动条 + 流光边框动画 */}
      <style>{`
        *::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; }
        * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
        
        @keyframes rotate {
          from { --gradient-angle: 0deg; }
          to { --gradient-angle: 360deg; }
        }
        
        @property --gradient-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        
        .island-streaming {
          position: relative;
          padding: 3px;
          background: conic-gradient(
            from var(--gradient-angle),
            #22d3ee,
            #3b82f6,
            #a855f7,
            #ec4899,
            #f97316,
            #22d3ee
          );
          animation: rotate 2s linear infinite;
        }
        
        .island-content {
          width: 100%;
          height: 100%;
          background: ${colors.bg};
          position: relative;
          z-index: 1;
        }
      `}</style>
    <motion.div
      className="island-streaming"
      initial={{ scaleX: 0.5, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 1 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.8 }}
      style={{
        width: "100%",
        height: "100%",
        cursor: "grab",
        userSelect: "none",
        overflow: "hidden",
        fontFamily: SYSTEM_FONT,
      }}
    >
      <div 
        className="island-content"
        onMouseDown={isCaptureMode ? undefined : handleMouseDown}
        onMouseEnter={() => !isCaptureMode && setIsExpanded(true)}
        onMouseLeave={() => !isCaptureMode && setIsExpanded(false)}
      >
      <AnimatePresence mode="wait">
        {isCaptureMode ? (
          // 快速捕获模式（笔记）
          <motion.div
            key="capture"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              padding: "10px 14px",
            }}
          >
            {/* 输入行 */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* 笔记图标 - 透明底 */}
              <motion.div
                animate={isSaving ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
                style={{
                  width: 24,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {isSaving ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5L20 7" stroke={colors.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <Zap size={16} color="#FBBF24" fill="#FBBF24" />
                )}
              </motion.div>
              
              {/* 输入框 */}
              <textarea
                ref={inputRef}
                value={captureText}
                onChange={(e) => setCaptureText(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={
                  noteMode === "new" 
                    ? t("island.inputPlaceholderNew")
                    : latestNoteTitle 
                      ? t("island.inputPlaceholderAppend", { title: latestNoteTitle })
                      : t("island.inputPlaceholder")
                }
                disabled={isSaving}
                rows={lineCount}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: colors.text,
                  fontSize: 14,
                  fontWeight: 500,
                  fontFamily: SYSTEM_FONT,
                  resize: "none",
                  lineHeight: "22px",
                }}
              />
              
              {/* 图片预览 */}
              {capturedImage && (
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <img
                    src={capturedImage}
                    alt="preview"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      objectFit: "cover",
                      border: `2px solid ${colors.success}`,
                    }}
                  />
                  <button
                    onClick={() => setCapturedImage(null)}
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: "#ef4444",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 0,
                    }}
                  >
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              )}
              
              {/* 下拉按钮 */}
              <button
                onClick={() => setShowNoteSelector(!showNoteSelector)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 8px",
                  background: colors.cardBg,
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  color: colors.textMuted,
                  fontSize: 11,
                }}
              >
                <span>{noteMode === "new" ? t("island.newNote") : noteMode === "select" ? t("island.selectNote") : t("island.appendNote")}</span>
                <ChevronDown size={12} style={{ transform: showNoteSelector ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </button>

              {/* 截图按钮 */}
              <button
                onClick={handleScreenshot}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: colors.cardBg,
                  border: "none",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "all 0.2s",
                }}
                title={t("island.screenshot")}
              >
                <Scissors size={14} color={colors.textMuted} />
              </button>

              {/* 保存按钮 */}
              <button
                onClick={handleSave}
                disabled={isSaving || (!captureText.trim() && !capturedImage)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: (captureText.trim() || capturedImage) ? colors.accent : colors.cardBg,
                  border: "none",
                  cursor: (captureText.trim() || capturedImage) ? "pointer" : "not-allowed",
                  opacity: (captureText.trim() || capturedImage) ? 1 : 0.5,
                  flexShrink: 0,
                  transition: "all 0.2s",
                }}
              >
                <Send size={14} color={(captureText.trim() || capturedImage) ? "#fff" : colors.textMuted} />
              </button>
            </div>

            {/* 下拉选择器 */}
            <AnimatePresence>
              {showNoteSelector && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    marginTop: 8,
                    overflow: "hidden",
                  }}
                >
                  <div style={{
                    display: "flex",
                    gap: 6,
                    marginBottom: 8,
                  }}>
                    <button
                      onClick={() => { setNoteMode("append"); setShowNoteSelector(false); }}
                      style={{
                        flex: 1,
                        padding: "6px 10px",
                        background: noteMode === "append" ? "#FBBF24" : colors.cardBg,
                        color: noteMode === "append" ? "#fff" : colors.textMuted,
                        border: "none",
                        borderRadius: 6,
                        fontSize: 11,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                      }}
                    >
                      <FileText size={11} /> {t("island.appendToRecent")}
                    </button>
                    <button
                      onClick={() => { setNoteMode("new"); setShowNoteSelector(false); }}
                      style={{
                        flex: 1,
                        padding: "6px 10px",
                        background: noteMode === "new" ? "#FBBF24" : colors.cardBg,
                        color: noteMode === "new" ? "#fff" : colors.textMuted,
                        border: "none",
                        borderRadius: 6,
                        fontSize: 11,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                      }}
                    >
                      <Plus size={11} /> {t("island.newNoteBtn")}
                    </button>
                  </div>
                  
                  {recentNotes.length > 0 && (
                    <div style={{
                      maxHeight: 80,
                      overflowY: "auto",
                      background: colors.cardBg,
                      borderRadius: 6,
                    }}>
                      {recentNotes.map((note) => (
                        <button
                          key={note.id}
                          onClick={() => {
                            setNoteMode("select");
                            setSelectedNoteId(note.id);
                            setShowNoteSelector(false);
                          }}
                          style={{
                            width: "100%",
                            padding: "6px 10px",
                            background: selectedNoteId === note.id && noteMode === "select" ? "#FBBF24" : "transparent",
                            color: selectedNoteId === note.id && noteMode === "select" ? "#fff" : colors.textMuted,
                            border: "none",
                            borderBottom: `1px solid ${colors.cardBg}`,
                            fontSize: 11,
                            cursor: "pointer",
                            textAlign: "left",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {stripHtml(note.content).slice(0, 30)}...
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : !isExpanded ? (
          // 收起状态 - 显示番茄钟和/或当前任务
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: (isPomodoroActive || pomodoroRemaining > 0) && activeTasks.length > 0 ? "column" : "row",
              alignItems: "center",
              justifyContent: "center",
              gap: (isPomodoroActive || pomodoroRemaining > 0) && activeTasks.length > 0 ? 4 : 12,
              padding: "0 16px",
            }}
          >
            {/* 番茄钟显示 */}
            {(isPomodoroActive || pomodoroRemaining > 0) && (
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 8,
                height: activeTasks.length > 0 ? COLLAPSED_HEIGHT - 4 : "100%",
              }}>
                {/* 番茄钟进度环 */}
                <div style={{ position: "relative", width: 20, height: 20 }}>
                  <CircularProgress 
                    progress={pomodoroProgress} 
                    size={20} 
                    color={isDark ? "#f97316" : "#ea580c"} 
                    strokeWidth={2.5} 
                  />
                  {isPomodoroActive && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      style={{
                        position: "absolute",
                        top: 6,
                        left: 6,
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: isDark ? "#f97316" : "#ea580c",
                      }}
                    />
                  )}
                </div>
                
                {/* 时间显示 */}
                <span style={{
                  color: isDark ? "#f97316" : "#ea580c",
                  fontSize: 16,
                  fontWeight: 700,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.5px",
                }}>
                  {formatPomodoroTime(pomodoroRemaining > 0 ? pomodoroRemaining : pomodoroMinutes * 60)}
                </span>
                
                {/* 暂停指示 */}
                {!isPomodoroActive && pomodoroRemaining > 0 && (
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Pause size={12} color={isDark ? "#f97316" : "#ea580c"} />
                  </motion.div>
                )}
              </div>
            )}
            
            {/* 任务显示（原有逻辑） */}
            {!(isPomodoroActive || pomodoroRemaining > 0) || activeTasks.length > 0 ? (
              activeTasks.length > 0 ? (
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 8,
                  height: (isPomodoroActive || pomodoroRemaining > 0) ? COLLAPSED_HEIGHT - 4 : "100%",
                }}>
                  {activeTasks.map((task, idx) => {
                    const remaining = getTaskRemaining(task, now);
                    let progress = 0;
                    if (task.scheduled_time) {
                       const start = parseScheduledTime(task.scheduled_time);
                       const duration = task.duration || 30;
                       if (start) {
                         const totalMs = duration * 60000;
                         const elapsed = now.getTime() - start.getTime();
                         progress = Math.min((elapsed / totalMs) * 100, 100);
                       }
                    }

                    return (
                      <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {idx > 0 && <div style={{ width: 1, height: 16, background: colors.border, marginRight: 8 }} />}
                        <div style={{ position: 'relative', width: 14, height: 14 }}>
                            <div style={{ position: 'absolute', top: -1, left: -1 }}>
                                <CircularProgress progress={progress} size={16} color={colors.success} strokeWidth={2} />
                            </div>
                            <div style={{ position: 'absolute', top: 3, left: 3 }}>
                                <PulseIndicator color={colors.success} size={8} />
                            </div>
                        </div>
                        <span style={{ 
                          color: colors.text, 
                          fontSize: 14, 
                          fontWeight: 600,
                          maxWidth: "none",
                          whiteSpace: "nowrap",
                          letterSpacing: "-0.2px",
                        }}>
                          {task.content}
                        </span>
                        {remaining && (
                          <span style={{ 
                            color: colors.accent, 
                            fontSize: 14, 
                            fontWeight: 700,
                            fontVariantNumeric: "tabular-nums",
                            letterSpacing: "-0.3px",
                          }}>
                            {formatRemaining(remaining)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : nextTask && !(isPomodoroActive || pomodoroRemaining > 0) ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.8 }}>
                  <span style={{ color: colors.textMuted, fontSize: 12 }}>{t("island.upcomingTask")}</span>
                  <span style={{ 
                      color: colors.text, 
                      fontSize: 13, 
                      fontWeight: 600,
                      maxWidth: "none",
                      whiteSpace: "nowrap"
                    }}>
                      {nextTask.content}
                    </span>
                    <span style={{ color: colors.accent, fontSize: 12, fontWeight: 500 }}>
                      {nextTask.scheduled_time}
                    </span>
                </div>
              ) : !(isPomodoroActive || pomodoroRemaining > 0) ? (
                <span style={{ color: colors.textMuted, fontSize: 14, fontWeight: 400 }}>{t("island.noActiveTask")}</span>
              ) : null
            ) : null}
          </motion.div>
        ) : (
          // 展开状态 - 今日任务列表
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            style={{ 
              width: "100%", 
              height: "100%", 
              padding: 16,
              display: "flex", 
              flexDirection: "column",
            }}
          >
            {/* 头部 */}
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between",
              marginBottom: 12,
              paddingBottom: 10,
              borderBottom: `1px solid ${colors.border}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: colors.text, fontSize: 15, fontWeight: 700, letterSpacing: "-0.3px" }}>{t("island.todayTasks")}</span>
                {/* 快速捕获按钮 */}
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCaptureMode(true);
                    setIsExpanded(false);
                    setCaptureText("");
                    setCapturedImage(null);
                    setShowNoteSelector(false);
                    setNoteMode("append");
                    setSelectedNoteId(null);
                    setTimeout(() => inputRef.current?.focus(), 100);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: colors.cardBg,
                    border: "none",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  title={t("island.quickCapture")}
                >
                  <Zap size={12} color="#FBBF24" />
                </button>
                
                {/* 番茄钟按钮组 */}
                <div 
                  style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 4,
                    padding: "2px 6px",
                    borderRadius: 8,
                    background: isPomodoroActive || pomodoroRemaining > 0 
                      ? (isDark ? "rgba(249,115,22,0.15)" : "rgba(234,88,12,0.1)")
                      : colors.cardBg,
                    border: isPomodoroActive 
                      ? `1px solid ${isDark ? "#f97316" : "#ea580c"}` 
                      : "1px solid transparent",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={() => setIsPomodoroHovered(true)}
                  onMouseLeave={() => setIsPomodoroHovered(false)}
                  onWheel={handlePomodoroWheel}
                >
                  {/* 时长显示/调节 */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      cursor: isPomodoroActive ? "default" : "ns-resize",
                      userSelect: "none",
                    }}
                    title={isPomodoroActive ? undefined : "滚轮调节时长"}
                  >
                    <Timer size={12} color={isDark ? "#f97316" : "#ea580c"} />
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: isDark ? "#f97316" : "#ea580c",
                      fontVariantNumeric: "tabular-nums",
                      minWidth: 32,
                      textAlign: "center",
                    }}>
                      {pomodoroRemaining > 0 
                        ? formatPomodoroTime(pomodoroRemaining)
                        : `${pomodoroMinutes}分`
                      }
                    </span>
                  </div>
                  
                  {/* 播放/暂停按钮 */}
                  <button
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePomodoroStart();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 18,
                      height: 18,
                      borderRadius: 4,
                      background: isPomodoroActive 
                        ? (isDark ? "#f97316" : "#ea580c")
                        : "transparent",
                      border: "none",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {isPomodoroActive ? (
                      <Pause size={10} color="#fff" />
                    ) : (
                      <Play size={10} color={isDark ? "#f97316" : "#ea580c"} style={{ marginLeft: 1 }} />
                    )}
                  </button>
                  
                  {/* 重置按钮（仅在有剩余时间时显示） */}
                  {pomodoroRemaining > 0 && (
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePomodoroReset();
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        opacity: 0.6,
                        transition: "all 0.2s",
                      }}
                      title="重置"
                    >
                      <RotateCcw size={10} color={isDark ? "#f97316" : "#ea580c"} />
                    </button>
                  )}
                </div>
              </div>
              <span style={{ 
                color: colors.accent, 
                fontSize: 13, 
                fontWeight: 600,
              }}>
                {todayTasks.filter(task => task.status === "DONE").length}/{todayTasks.length}
              </span>
            </div>
            
            {/* 任务列表 */}
            <div 
              className="hide-scrollbar"
              style={{
                flex: 1,
                overflowY: "auto",
                overflowX: "hidden",
                scrollbarWidth: "none", // Firefox
                msOverflowStyle: "none", // IE/Edge
              }}
            >
              {todayTasks.length > 0 ? (
                todayTasks.map(task => {
                  const isDone = task.status === "DONE";
                  const isDoing = task.status === "DOING" || activeTasks.some(t => t.id === task.id);
                  const remaining = getTaskRemaining(task, now);
                  
                  return (
                    <div
                      key={task.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 0",
                        borderBottom: `1px solid ${colors.cardBg}`,
                        cursor: "pointer" // 添加指针样式
                      }}
                    >
                      <div 
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => isDoing ? handleToggleTask(e, task) : isDone ? handleToggleTask(e, task) : handleStartTask(e, task)}
                        style={{ cursor: "pointer", display: "flex" }}
                      >
                        {isDone ? (
                          <CheckIcon color={colors.success} size={18} />
                        ) : isDoing ? (
                          <PulseIndicator color={colors.success} size={10} />
                        ) : (
                          <CircleIcon color={colors.textMuted} size={18} />
                        )}
                      </div>
                      <span 
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => handleStartTask(e, task)}
                        style={{
                          flex: 1,
                          fontSize: 14,
                          fontWeight: isDoing ? 600 : 500,
                          color: isDone ? colors.textMuted : colors.text,
                          textDecoration: isDone ? "line-through" : "none",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          letterSpacing: "-0.2px",
                          opacity: isDone ? 0.6 : 1
                        }}>
                        {task.content}
                      </span>
                      {isDoing && remaining && (
                        <span style={{ 
                          fontSize: 13, 
                          fontWeight: 700,
                          color: colors.accent,
                          flexShrink: 0,
                          fontVariantNumeric: "tabular-nums",
                          letterSpacing: "-0.3px",
                        }}>
                          {formatRemaining(remaining)}
                        </span>
                      )}
                      {!isDone && !isDoing && task.scheduled_time && (
                        <span style={{ 
                          fontSize: 12, 
                          fontWeight: 500,
                          color: colors.textMuted,
                          flexShrink: 0,
                        }}>
                          {task.scheduled_time}
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ 
                  flex: 1, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  color: colors.textMuted,
                  fontSize: 14,
                }}>
                  {t("island.noTasksToday")}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </motion.div>
    </>
  );
});

export default DynamicIsland;
