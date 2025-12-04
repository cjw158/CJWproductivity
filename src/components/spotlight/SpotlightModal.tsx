/**
 * @file SpotlightModal.tsx
 * @description 快速任务创建弹窗 - 仅任务模式
 */

import { memo, useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ListTodo, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useCreateTask } from "@/hooks/useTasks";
import { TaskForm } from "./TaskForm";

interface SpotlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const SpotlightModal = memo(function SpotlightModal({
  isOpen,
  onClose,
  onCreated,
}: SpotlightModalProps) {
  const [content, setContent] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [showDuration, setShowDuration] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const createTask = useCreateTask();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // 重置表单
  const reset = useCallback(() => {
    setContent("");
    setDueDate("");
    setScheduledTime("");
    setDuration(30);
    setShowDuration(false);
  }, []);

  // 聚焦输入框
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => textareaRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // 关闭时重置
  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  // 关闭处理
  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  // 提交处理
  const handleSubmit = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed) return;

    try {
      await createTask.mutateAsync({
        content: trimmed,
        status: "INBOX",
        due_date: dueDate || null,
        scheduled_time: scheduledTime || null,
        duration: showDuration ? duration : null,
      });
      reset();
      onCreated?.();
      onClose();
    } catch (error) {
      console.error("创建任务失败:", error);
    }
  }, [content, dueDate, scheduledTime, duration, showDuration, createTask, reset, onCreated, onClose]);

  // 键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      handleClose();
    } else if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleClose, handleSubmit]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
          onClick={handleClose}
        >
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* 主面板 */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden",
              isDark
                ? "bg-[#1a1a1f] border border-white/10"
                : "bg-white border border-gray-200 shadow-2xl"
            )}
          >
            {/* 头部 */}
            <div className={cn(
              "flex items-center gap-3 px-4 py-3 border-b",
              isDark ? "border-white/10" : "border-gray-100"
            )}>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ 
                  background: isDark ? "rgba(96, 165, 250, 0.2)" : "rgba(59, 130, 246, 0.1)",
                  color: isDark ? "#60A5FA" : "#3B82F6"
                }}
              >
                <ListTodo className="w-4 h-4" />
              </div>
              <span className={cn("text-sm font-medium", isDark ? "text-white/80" : "text-gray-700")}>
                新建任务
              </span>
              <span className={cn("ml-auto text-xs", isDark ? "text-white/30" : "text-gray-400")}>
                Ctrl+N 唤起 · Ctrl+Enter 保存
              </span>
            </div>

            {/* 输入区 */}
            <div className="p-4 space-y-4">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入任务内容..."
                rows={3}
                className={cn(
                  "w-full resize-none rounded-xl px-4 py-3 text-sm outline-none transition-all",
                  isDark
                    ? "bg-white/5 text-white/90 placeholder:text-white/30 focus:bg-white/10"
                    : "bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:bg-gray-100"
                )}
              />

              {/* 任务属性表单 */}
              <TaskForm
                dueDate={dueDate}
                scheduledTime={scheduledTime}
                duration={duration}
                showDuration={showDuration}
                isDark={isDark}
                onDueDateChange={setDueDate}
                onScheduledTimeChange={setScheduledTime}
                onDurationChange={setDuration}
                onShowDurationChange={setShowDuration}
              />
            </div>

            {/* 底部按钮 */}
            <div className={cn(
              "flex items-center justify-between px-4 py-3 border-t",
              isDark ? "border-white/10" : "border-gray-100"
            )}>
              <button
                onClick={handleClose}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm transition-colors",
                  isDark
                    ? "text-white/50 hover:text-white/80 hover:bg-white/5"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                )}
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || createTask.isPending}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  content.trim() && !createTask.isPending
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : isDark
                      ? "bg-white/5 text-white/30 cursor-not-allowed"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                )}
              >
                {createTask.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                保存
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// 兼容旧导出
export const Spotlight = SpotlightModal;
