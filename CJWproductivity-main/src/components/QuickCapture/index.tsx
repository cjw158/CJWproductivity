/**
 * @file QuickCapture/index.tsx
 * @description 全局快速捕获组件 - Shift+F+J
 * 
 * 功能:
 * - 快速创建任务或笔记
 * - NLP 自然语言日期解析
 * - 时间/时长选择
 * - 支持追加到现有笔记
 */

import { useReducer, useEffect, useRef, useCallback, memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb,
  ListTodo,
  Send,
  Sparkles,
  Calendar,
  Clock,
  ChevronDown,
  Timer,
  FileText,
  Plus,
} from "lucide-react";
import { useCreateTask } from "@/hooks/useTasks";
import { useCreateNote, useUpdateNote, useNotes } from "@/hooks/useNotes";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { zh } from "chrono-node";
import { logger } from "@/lib/logger";

import type { QuickCaptureProps, ModeConfig } from "./types";
import { quickCaptureReducer, initialState } from "./reducer";
import { stripHtml, formatDate, getToday, getTomorrow, formatDuration } from "./utils";
import {
  SuccessAnimation,
  TimeWheelPicker,
  DurationWheelPicker,
} from "./components";

export const QuickCapture = memo(function QuickCapture({
  isOpen,
  onClose,
  onSaveAndClose,
  onCreated,
}: QuickCaptureProps) {
  const [state, dispatch] = useReducer(quickCaptureReducer, initialState);
  const inputRef = useRef<HTMLInputElement>(null);
  const saveCallbackRef = useRef<(() => void) | null>(null);

  const createTask = useCreateTask();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const { data: notes = [] } = useNotes("all");
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // 最近的笔记
  const recentNotes = useMemo(
    () =>
      [...notes]
        .sort(
          (a, b) =>
            new Date(b.updated_at || b.created_at).getTime() -
            new Date(a.updated_at || a.created_at).getTime()
        )
        .slice(0, 5),
    [notes]
  );
  const latestNote = recentNotes[0];
  const latestNoteTitle = useMemo(
    () => (latestNote ? stripHtml(latestNote.content).slice(0, 15) : null),
    [latestNote]
  );

  // 模式配置
  const modeConfig: Record<"task" | "note", ModeConfig> = useMemo(
    () => ({
      task: {
        icon: ListTodo,
        label: "任务",
        placeholder: "添加任务...",
        color: isDark ? "#60A5FA" : "#3B82F6",
        bgColor: isDark ? "rgba(96, 165, 250, 0.15)" : "rgba(59, 130, 246, 0.1)",
      },
      note: {
        icon: Lightbulb,
        label: "笔记",
        placeholder: latestNoteTitle
          ? `追加到「${latestNoteTitle}...」`
          : "记录想法...",
        color: isDark ? "#FBBF24" : "#F59E0B",
        bgColor: isDark ? "rgba(251, 191, 36, 0.15)" : "rgba(245, 158, 11, 0.1)",
      },
    }),
    [isDark, latestNoteTitle]
  );

  const config = modeConfig[state.mode];
  const Icon = config.icon;

  // 打开时聚焦输入框
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // 关闭时重置状态
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => dispatch({ type: "RESET" }), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // NLP 日期解析
  useEffect(() => {
    if (state.mode !== "task" || !state.content.trim()) {
      dispatch({ type: "SET_PARSED", payload: { date: null, text: "" } });
      return;
    }

    const timer = setTimeout(() => {
      try {
        const result = zh.parse(state.content);
        if (result.length > 0) {
          dispatch({
            type: "SET_PARSED",
            payload: { date: result[0].start.date(), text: result[0].text },
          });
        } else {
          dispatch({ type: "SET_PARSED", payload: { date: null, text: "" } });
        }
      } catch {
        dispatch({ type: "SET_PARSED", payload: { date: null, text: "" } });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [state.content, state.mode]);

  // 保存逻辑
  const handleSave = useCallback(async () => {
    if (!state.content.trim() || state.saveStatus === "saving") return;

    dispatch({ type: "SET_SAVE_STATUS", payload: "saving" });

    try {
      let finalContent = state.content.trim();
      let dueDate = state.dueDate;
      let scheduledTime = state.scheduledTime;

      // 应用 NLP 解析的日期（使用本地时间）
      if (state.mode === "task" && state.parsedDate && !state.dueDate) {
        const pd = state.parsedDate;
        dueDate = `${pd.getFullYear()}-${(pd.getMonth() + 1).toString().padStart(2, "0")}-${pd.getDate().toString().padStart(2, "0")}`;
        const h = pd.getHours();
        const m = pd.getMinutes();
        if (h || m) {
          scheduledTime = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
        }
        finalContent = finalContent.replace(state.parsedText, "").trim();
      }

      if (state.mode === "note") {
        // 笔记模式
        if (state.noteMode === "new") {
          await createNote.mutateAsync({ content: finalContent });
        } else if (state.noteMode === "select" && state.selectedNoteId) {
          const targetNote = notes.find((n) => n.id === state.selectedNoteId);
          if (targetNote) {
            await updateNote.mutateAsync({
              id: state.selectedNoteId,
              input: { content: targetNote.content + "\n\n" + finalContent },
            });
          }
        } else if (latestNote) {
          await updateNote.mutateAsync({
            id: latestNote.id,
            input: { content: latestNote.content + "\n\n" + finalContent },
          });
        } else {
          await createNote.mutateAsync({ content: finalContent });
        }
      } else {
        // 任务模式（使用本地时间）
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
        const finalDueDate = dueDate || todayStr;
        await createTask.mutateAsync({
          content: finalContent,
          status: "INBOX",
          due_date: finalDueDate,
          scheduled_time: scheduledTime,
          duration: state.duration,
        });
      }

      dispatch({ type: "SET_SAVE_STATUS", payload: "success" });
      onCreated?.();
    } catch (error) {
      logger.error("QuickCapture save failed", error);
      dispatch({ type: "SET_SAVE_STATUS", payload: "error" });
      setTimeout(() => dispatch({ type: "SET_SAVE_STATUS", payload: "idle" }), 1500);
    }
  }, [state, latestNote, notes, createTask, createNote, updateNote, onCreated]);

  // 注册保存回调
  useEffect(() => {
    saveCallbackRef.current = () => {
      if (state.content.trim()) handleSave();
      else onClose();
    };
  }, [state.content, handleSave, onClose]);

  // 监听外部保存事件
  useEffect(() => {
    if (!isOpen) return;
    const handler = () => saveCallbackRef.current?.();
    document.addEventListener("quickcapture-save", handler);
    return () => document.removeEventListener("quickcapture-save", handler);
  }, [isOpen]);

  const handleSuccessComplete = useCallback(() => onSaveAndClose(), [onSaveAndClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault();
        dispatch({ type: "TOGGLE_MODE" });
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (state.content.trim()) handleSave();
      }
    },
    [onClose, state.content, handleSave]
  );

  const today = getToday();
  const tomorrow = getTomorrow();
  const selectedNote = state.selectedNoteId
    ? notes.find((n) => n.id === state.selectedNoteId)
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[200]"
            style={{
              backgroundColor: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.25)",
              backdropFilter: "blur(8px)",
            }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[201] w-full max-w-md px-4"
          >
            <motion.div
              className="relative overflow-hidden"
              style={{
                borderRadius: 28,
                backgroundColor: isDark ? "rgba(22, 22, 28, 0.98)" : "rgba(255, 255, 255, 0.98)",
                backdropFilter: "blur(40px) saturate(180%)",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}`,
                boxShadow: isDark
                  ? "0 25px 80px -20px rgba(0,0,0,0.8)"
                  : "0 25px 80px -20px rgba(0,0,0,0.25)",
              }}
            >
              {/* Success Animation */}
              <AnimatePresence>
                {state.saveStatus === "success" && (
                  <SuccessAnimation onComplete={handleSuccessComplete} />
                )}
              </AnimatePresence>

              {/* Top Indicator */}
              <motion.div
                className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full"
                style={{
                  width: "50%",
                  background: `linear-gradient(90deg, transparent, ${config.color}, transparent)`,
                  opacity: state.content ? 1 : 0.5,
                }}
              />

              <div className="p-4">
                {/* Input Area */}
                <div className="flex items-center gap-3">
                  <motion.button
                    onClick={() => dispatch({ type: "TOGGLE_MODE" })}
                    className="flex-shrink-0 p-2.5 rounded-full"
                    style={{ backgroundColor: config.bgColor, color: config.color }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    title="Tab 切换"
                  >
                    <motion.div
                      key={state.mode}
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.div>
                  </motion.button>

                  <input
                    ref={inputRef}
                    type="text"
                    value={state.content}
                    onChange={(e) => dispatch({ type: "SET_CONTENT", payload: e.target.value })}
                    onKeyDown={handleKeyDown}
                    placeholder={config.placeholder}
                    className={cn(
                      "flex-1 bg-transparent border-none outline-none text-[15px] font-medium",
                      isDark ? "text-white placeholder-white/30" : "text-gray-900 placeholder-gray-400"
                    )}
                    style={{ caretColor: config.color }}
                    autoComplete="off"
                    spellCheck={false}
                    disabled={state.saveStatus === "saving"}
                  />

                  <motion.button
                    onClick={handleSave}
                    disabled={!state.content.trim() || state.saveStatus === "saving"}
                    className="flex-shrink-0 p-2.5 rounded-full transition-all disabled:opacity-30"
                    style={{
                      backgroundColor: state.content.trim()
                        ? config.color
                        : isDark
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(0,0,0,0.05)",
                      color: state.content.trim()
                        ? "#fff"
                        : isDark
                          ? "rgba(255,255,255,0.3)"
                          : "rgba(0,0,0,0.3)",
                    }}
                    whileHover={state.content.trim() ? { scale: 1.08 } : {}}
                    whileTap={state.content.trim() ? { scale: 0.92 } : {}}
                  >
                    {state.saveStatus === "saving" ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                      >
                        <Clock className="w-4 h-4" />
                      </motion.div>
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </motion.button>
                </div>

                {/* Note Mode Options */}
                <AnimatePresence>
                  {state.mode === "note" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div
                        className="mt-3 pt-3 border-t border-dashed"
                        style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
                      >
                        <button
                          onClick={() => dispatch({ type: "TOGGLE_NOTE_OPTIONS" })}
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs w-full",
                            isDark ? "text-white/50 hover:text-white/70" : "text-gray-500 hover:text-gray-700"
                          )}
                        >
                          <ChevronDown
                            className={cn("w-3 h-3 transition-transform", state.showNoteOptions && "rotate-180")}
                          />
                          {state.noteMode === "append" && latestNote
                            ? `追加到「${latestNoteTitle}...」`
                            : state.noteMode === "new"
                              ? "新建笔记"
                              : selectedNote
                                ? `追加到「${stripHtml(selectedNote.content).slice(0, 12)}...」`
                                : "选择笔记"}
                        </button>

                        <AnimatePresence>
                          {state.showNoteOptions && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-2 space-y-1">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      dispatch({ type: "SET_NOTE_MODE", payload: "append" });
                                      dispatch({ type: "TOGGLE_NOTE_OPTIONS" });
                                    }}
                                    className={cn(
                                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs",
                                      state.noteMode === "append"
                                        ? "text-white"
                                        : isDark
                                          ? "bg-white/5 text-white/50"
                                          : "bg-gray-100 text-gray-500"
                                    )}
                                    style={state.noteMode === "append" ? { backgroundColor: config.color } : undefined}
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    追加到最近
                                  </button>
                                  <button
                                    onClick={() => {
                                      dispatch({ type: "SET_NOTE_MODE", payload: "new" });
                                      dispatch({ type: "TOGGLE_NOTE_OPTIONS" });
                                    }}
                                    className={cn(
                                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs",
                                      state.noteMode === "new"
                                        ? "text-white"
                                        : isDark
                                          ? "bg-white/5 text-white/50"
                                          : "bg-gray-100 text-gray-500"
                                    )}
                                    style={state.noteMode === "new" ? { backgroundColor: config.color } : undefined}
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    新建笔记
                                  </button>
                                </div>

                                {recentNotes.length > 0 && (
                                  <div
                                    className={cn(
                                      "rounded-xl border max-h-32 overflow-y-auto",
                                      isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"
                                    )}
                                  >
                                    {recentNotes.map((note) => (
                                      <button
                                        key={note.id}
                                        onClick={() => {
                                          dispatch({ type: "SET_SELECTED_NOTE", payload: note.id });
                                          dispatch({ type: "TOGGLE_NOTE_OPTIONS" });
                                        }}
                                        className={cn(
                                          "w-full px-3 py-2 text-left text-xs truncate",
                                          state.selectedNoteId === note.id && state.noteMode === "select"
                                            ? "text-white"
                                            : isDark
                                              ? "text-white/60 hover:bg-white/5"
                                              : "text-gray-600 hover:bg-gray-100"
                                        )}
                                        style={
                                          state.selectedNoteId === note.id && state.noteMode === "select"
                                            ? { backgroundColor: config.color }
                                            : undefined
                                        }
                                      >
                                        {stripHtml(note.content).slice(0, 40)}...
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Task Mode Options */}
                <AnimatePresence>
                  {state.mode === "task" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      {/* Date Selection */}
                      <div
                        className="flex items-center gap-2 mt-3 pt-3 border-t border-dashed"
                        style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
                      >
                        <Calendar className={cn("w-3.5 h-3.5", isDark ? "text-white/30" : "text-gray-400")} />
                        {[
                          { label: "今天", value: today },
                          { label: "明天", value: tomorrow },
                        ].map((d) => (
                          <motion.button
                            key={d.value}
                            onClick={() =>
                              dispatch({
                                type: "SET_DUE_DATE",
                                payload: state.dueDate === d.value ? null : d.value,
                              })
                            }
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-medium",
                              state.dueDate === d.value
                                ? "text-white"
                                : isDark
                                  ? "text-white/50 bg-white/5"
                                  : "text-gray-500 bg-gray-100"
                            )}
                            style={state.dueDate === d.value ? { backgroundColor: config.color } : undefined}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {d.label}
                          </motion.button>
                        ))}
                        <input
                          type="date"
                          value={state.dueDate || ""}
                          onChange={(e) =>
                            dispatch({ type: "SET_DUE_DATE", payload: e.target.value || null })
                          }
                          className={cn(
                            "ml-auto text-xs bg-transparent border-none outline-none cursor-pointer opacity-50 hover:opacity-100",
                            isDark ? "text-white/50" : "text-gray-500"
                          )}
                        />
                      </div>

                      {/* Time Toggle */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => dispatch({ type: "TOGGLE_TIME_PANEL" })}
                          className={cn(
                            "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs",
                            state.showTimePanel || state.scheduledTime
                              ? "text-blue-500"
                              : isDark
                                ? "text-white/40"
                                : "text-gray-400"
                          )}
                        >
                          <Timer className="w-3 h-3" />
                          {state.scheduledTime ? state.scheduledTime : "设置时间"}
                          {state.showTimePanel ? "" : `  ${formatDuration(state.duration)}`}
                        </button>
                      </div>

                      {/* Time Panel */}
                      <AnimatePresence>
                        {state.showTimePanel && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div
                              className="flex items-start justify-between gap-4 mt-3 pt-3 border-t"
                              style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}
                            >
                              <div>
                                <div
                                  className={cn(
                                    "text-xs mb-2 flex items-center gap-1.5",
                                    isDark ? "text-white/40" : "text-gray-400"
                                  )}
                                >
                                  <Clock className="w-3 h-3" />
                                  开始时间
                                </div>
                                <TimeWheelPicker
                                  value={state.scheduledTime}
                                  onChange={(v) => dispatch({ type: "SET_SCHEDULED_TIME", payload: v })}
                                  isDark={isDark}
                                  color={config.color}
                                />
                              </div>
                              <div>
                                <div
                                  className={cn(
                                    "text-xs mb-2 flex items-center gap-1.5",
                                    isDark ? "text-white/40" : "text-gray-400"
                                  )}
                                >
                                  <Timer className="w-3 h-3" />
                                  预计时长
                                </div>
                                <DurationWheelPicker
                                  value={state.duration}
                                  onChange={(v) => dispatch({ type: "SET_DURATION", payload: v })}
                                  isDark={isDark}
                                  color={config.color}
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* NLP Parse Hint */}
                <AnimatePresence>
                  {state.parsedDate && state.mode === "task" && !state.dueDate && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="overflow-hidden"
                    >
                      <div
                        className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-xl text-xs",
                          isDark ? "bg-blue-500/10" : "bg-blue-50"
                        )}
                      >
                        <div className="flex items-center gap-2 text-blue-500">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>
                            识别到: <strong>{formatDate(state.parsedDate)}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => dispatch({ type: "APPLY_PARSED_DATE" })}
                            className="px-2 py-1 rounded-md bg-blue-500 text-white hover:bg-blue-600"
                          >
                            应用
                          </button>
                          <button
                            onClick={() => dispatch({ type: "SET_PARSED", payload: { date: null, text: "" } })}
                            className={cn("px-2 py-1 rounded-md", isDark ? "text-white/40" : "text-gray-400")}
                          >
                            忽略
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Keyboard Hints */}
                <div
                  className={cn(
                    "flex items-center justify-center gap-4 mt-4 text-[10px]",
                    isDark ? "text-white/20" : "text-gray-400"
                  )}
                >
                  <span className="flex items-center gap-1">
                    <kbd className={cn("px-1.5 py-0.5 rounded font-mono", isDark ? "bg-white/5" : "bg-gray-100")}>
                      Tab
                    </kbd>
                    {state.mode === "task" ? "笔记" : "任务"}
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className={cn("px-1.5 py-0.5 rounded font-mono", isDark ? "bg-white/5" : "bg-gray-100")}>
                      ↵
                    </kbd>
                    保存
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className={cn("px-1.5 py-0.5 rounded font-mono", isDark ? "bg-white/5" : "bg-gray-100")}>
                      Esc
                    </kbd>
                    关闭
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

export default QuickCapture;
