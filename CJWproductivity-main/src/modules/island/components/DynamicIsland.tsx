/**
 * @file components/DynamicIsland.tsx
 * @description 灵动岛主容器 - 组合所有子组件
 */

import { memo, useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { getAllTasks } from "@/lib/tasks";
import { useMoveTaskStatus } from "@/hooks/useTasks";
import { parseScheduledTime } from "@/utils";
import { logger } from "@/lib/logger";

// Import hooks
import { useIslandState } from "../hooks/useIslandState";
import { usePomodoro } from "../hooks/usePomodoro";
import { useCapture } from "../hooks/useCapture";

// Import components
import { IslandCollapsed } from "./IslandCollapsed";
import { IslandExpanded } from "./IslandExpanded";
import { IslandCapture } from "./IslandCapture";

// Import services and constants
import { resizeIslandWindow, startDraggingIsland } from "../services/islandWindow";
import { ISLAND_CONFIG, COLORS, SYSTEM_FONT } from "../constants";
import { measureTextWidth } from "../utils";
import styles from "../styles/island.module.css";

const {
  COLLAPSED_HEIGHT,
  EXPANDED_WIDTH,
  MIN_COLLAPSED_WIDTH,
  CAPTURE_HEIGHT,
} = ISLAND_CONFIG;

/**
 * 灵动岛主组件
 * 统一管理状态和子组件渲染
 */
export const DynamicIsland = memo(function DynamicIsland() {
  // Theme
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const colors = useMemo(() => (isDark ? COLORS.dark : COLORS.light), [isDark]);

  // State management
  const state = useIslandState();
  const pomodoro = usePomodoro(25);
  const capture = useCapture(state);

  // Additional local state
  const [now, setNow] = useState(new Date());
  const queryClient = useQueryClient();

  // Fetch tasks data
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: getAllTasks,
    refetchOnMount: true,
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 0,
  });

  const moveTaskStatus = useMoveTaskStatus();

  // Visibility animation
  useEffect(() => {
    const timer = setTimeout(() => state.setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [state]);

  // Listen for capture events
  useEffect(() => {
    const handleCapture = () => {
      logger.debug("[DynamicIsland] Capture event received, switching to capture mode");
      state.setIsCaptureMode(true);
      state.setIsExpanded(false);
      state.setCaptureText("");
      state.setShowNoteSelector(false);
      state.setNoteMode("append");
      state.setSelectedNoteId(null);
      setTimeout(() => state.inputRef.current?.focus(), 100);
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
  }, [state]);

  // Update time every second
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate today's tasks
  const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
  
  const todayTasks = useMemo(() => 
    tasks.filter(t => t.due_date === todayStr).sort((a, b) => {
      if (a.status === "DOING" && b.status !== "DOING") return -1;
      if (b.status === "DOING" && a.status !== "DOING") return 1;
      if (a.status === "DONE" && b.status !== "DONE") return 1;
      if (b.status === "DONE" && a.status !== "DONE") return -1;
      return (a.scheduled_time || "").localeCompare(b.scheduled_time || "");
    }),
  [tasks, todayStr]);

  // Calculate active tasks
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

  // Calculate next task
  const nextTask = useMemo(() => {
    if (activeTasks.length > 0) return null;
    return todayTasks.find(t => t.status === "TODO" && t.scheduled_time && parseScheduledTime(t.scheduled_time)!.getTime() > now.getTime());
  }, [activeTasks, todayTasks, now]);

  // Task handlers
  const handleToggleTask = useCallback(async (e: React.MouseEvent, task: any) => {
    e.stopPropagation();
    const newStatus = task.status === "DONE" ? "TODO" : "DONE";
    await moveTaskStatus.mutateAsync({ id: task.id, status: newStatus });
  }, [moveTaskStatus]);

  const handleStartTask = useCallback(async (e: React.MouseEvent, task: any) => {
    e.stopPropagation();
    if (task.status !== "DOING") {
      await moveTaskStatus.mutateAsync({ id: task.id, status: "DOING" });
    } else {
      await moveTaskStatus.mutateAsync({ id: task.id, status: "TODO" });
    }
  }, [moveTaskStatus]);

  // Calculate window dimensions
  const collapsedWidth = useMemo(() => {
    if (activeTasks.length === 0 && !nextTask) return MIN_COLLAPSED_WIDTH;
    
    const padding = 40;
    const iconWidth = 22;
    const timeWidth = 40;
    
    if (activeTasks.length > 0) {
      let totalWidth = padding;
      activeTasks.forEach((task, idx) => {
        if (idx > 0) totalWidth += 9;
        totalWidth += iconWidth;
        totalWidth += measureTextWidth(task.content, "600 14px " + SYSTEM_FONT);
        if (task.scheduled_time) totalWidth += timeWidth;
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
  }, [activeTasks, nextTask]);

  const captureWidth = useMemo(() => {
    const padding = 40;
    const iconWidth = 38;
    const buttonWidth = 60;
    const gap = 20;
    
    let textContent = state.captureText;
    if (!textContent) {
      textContent = state.noteMode === "new" 
        ? "记录新想法... (Shift+Enter 保存)" 
        : capture.latestNoteTitle 
          ? `追加到「${capture.latestNoteTitle}...」(Shift+Enter 保存)` 
          : "记录想法... (Shift+Enter 保存)";
    }
    
    const textWidth = measureTextWidth(textContent, "500 14px " + SYSTEM_FONT);
    const totalWidth = padding + iconWidth + textWidth + buttonWidth + gap;
    
    return Math.min(Math.max(totalWidth, 280), 600);
  }, [state.captureText, state.noteMode, capture.latestNoteTitle]);

  const expandedHeight = useMemo(() => {
    const headerHeight = 50;
    const itemHeight = 45;
    const containerPadding = 32;
    const emptyHeight = 60;
    
    if (todayTasks.length === 0) {
      return headerHeight + emptyHeight + containerPadding;
    }
    
    const listHeight = todayTasks.length * itemHeight;
    return Math.min(headerHeight + listHeight + containerPadding, 600);
  }, [todayTasks.length]);

  // Window resize effect
  useEffect(() => {
    const resize = async () => {
      let width: number;
      let height: number;
      
      if (state.isCaptureMode) {
        width = captureWidth;
        const baseHeight = 52;
        const lineHeight = 22;
        const textHeight = baseHeight + (capture.lineCount - 1) * lineHeight;
        height = state.showNoteSelector ? Math.max(textHeight, CAPTURE_HEIGHT) + 128 : textHeight;
      } else if (state.isExpanded) {
        width = EXPANDED_WIDTH;
        height = expandedHeight;
      } else {
        width = collapsedWidth;
        height = COLLAPSED_HEIGHT;
      }
      
      await resizeIslandWindow(width, height);
    };
    resize();
  }, [state.isExpanded, state.isCaptureMode, collapsedWidth, expandedHeight, captureWidth, state.showNoteSelector, capture.lineCount]);

  // Drag handler
  const handleMouseDown = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    await startDraggingIsland();
  }, []);

  if (!state.isVisible) return null;

  return (
    <>
      {/* Global styles */}
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
            #fbbf24,
            #22d3ee
          );
          animation: rotate 3s linear infinite;
          border-radius: 23px;
        }
      `}</style>

      <motion.div
        className={pomodoro.isActive ? "island-streaming" : ""}
        onMouseDown={handleMouseDown}
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          className={styles.container}
          style={{
            background: colors.bg,
            border: `1px solid ${colors.border}`,
            boxShadow: `0 0 20px ${colors.borderGlow}`,
          }}
          onMouseEnter={() => {
            if (!state.isCaptureMode && !state.isExpanded) {
              state.setIsExpanded(true);
            }
          }}
          onMouseLeave={() => {
            if (!state.isCaptureMode && state.isExpanded) {
              state.setIsExpanded(false);
            }
          }}
        >
          <AnimatePresence mode="wait">
            {state.isCaptureMode ? (
              <IslandCapture
                key="capture"
                captureText={state.captureText}
                setCaptureText={state.setCaptureText}
                capturedImage={state.capturedImage}
                setCapturedImage={state.setCapturedImage}
                isSaving={state.isSaving}
                showNoteSelector={state.showNoteSelector}
                setShowNoteSelector={state.setShowNoteSelector}
                noteMode={state.noteMode}
                setNoteMode={state.setNoteMode}
                selectedNoteId={state.selectedNoteId}
                setSelectedNoteId={state.setSelectedNoteId}
                recentNotes={capture.recentNotes}
                latestNoteTitle={capture.latestNoteTitle}
                colors={colors}
                inputRef={state.inputRef}
                onKeyDown={capture.handleKeyDown}
                onPaste={capture.handlePaste}
                onScreenshot={capture.handleScreenshot}
              />
            ) : state.isExpanded ? (
              <IslandExpanded
                key="expanded"
                todayTasks={todayTasks}
                activeTasks={activeTasks}
                colors={colors}
                now={now}
                onToggleTask={handleToggleTask}
                onStartTask={handleStartTask}
              />
            ) : (
              <IslandCollapsed
                key="collapsed"
                activeTasks={activeTasks}
                nextTask={nextTask}
                colors={colors}
                now={now}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
});

export default DynamicIsland;
