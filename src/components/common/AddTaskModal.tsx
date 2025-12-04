/**
 * @file AddTaskModal.tsx
 * @description 通用添加任务弹窗
 * 
 * 可复用于：
 * - 日历视图
 * - 看板视图
 * - 任意需要快速添加任务的场景
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTaskActions } from "@/contexts/TaskActionsContext";
import { formatDate, formatDateCN } from "@/utils/date";
import type { CreateTaskInput } from "@/lib/tasks";

// ============ 类型定义 ============

interface AddTaskModalProps {
  /** 是否显示 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 创建成功回调 */
  onCreated?: () => void;
  /** 预设日期 */
  defaultDate?: Date;
  /** 预设时间 HH:mm */
  defaultTime?: string;
  /** 是否暗色模式 */
  isDark?: boolean;
}

// ============ 组件 ============

export function AddTaskModal({
  isOpen,
  onClose,
  onCreated,
  defaultDate,
  defaultTime,
  isDark = false,
}: AddTaskModalProps) {
  const { createTask } = useTaskActions();
  
  // 表单状态
  const [content, setContent] = useState("");
  const [duration, setDuration] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * 重置表单
   */
  const resetForm = useCallback(() => {
    setContent("");
    setDuration(null);
  }, []);

  /**
   * 提交表单
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);

    const input: CreateTaskInput = {
      content: content.trim(),
      status: "TODO",
      due_date: defaultDate ? formatDate(defaultDate) : null,
      scheduled_time: defaultTime || null,
      duration: duration,
    };

    const result = await createTask(input);
    
    setIsSubmitting(false);

    if (result) {
      resetForm();
      onCreated?.();
      onClose();
    }
  };

  /**
   * 关闭并重置
   */
  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // 日期显示
  const dateDisplay = defaultDate
    ? formatDateCN(defaultDate, { showWeekday: true })
    : "未指定日期";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleClose}
          />

          {/* 弹窗主体 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={cn(
              "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
              "w-full max-w-md p-6 rounded-2xl shadow-xl",
              isDark ? "bg-[#1a1a24] border border-white/10" : "bg-white"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className={cn("w-5 h-5", isDark ? "text-white/60" : "text-gray-500")} />
                <span className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                  {dateDisplay}
                </span>
                {defaultTime && (
                  <span className={cn(
                    "text-sm px-2 py-0.5 rounded",
                    isDark ? "bg-white/10 text-white/70" : "bg-gray-100 text-gray-600"
                  )}>
                    {defaultTime}
                  </span>
                )}
              </div>
              <button
                onClick={handleClose}
                className={cn(
                  "p-1 rounded-lg transition",
                  isDark ? "text-white/40 hover:text-white hover:bg-white/10" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                )}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 表单 */}
            <form onSubmit={handleSubmit}>
              {/* 内容输入 */}
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="输入任务内容..."
                autoFocus
                className={cn(
                  "w-full px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 transition",
                  isDark
                    ? "bg-white/5 text-white placeholder:text-white/30 focus:ring-white/20"
                    : "bg-gray-100 text-gray-900 placeholder:text-gray-400 focus:ring-blue-500/30"
                )}
              />

              {/* 时长选择 */}
              <div className="flex items-center justify-end gap-4 mt-4">
                <div className={cn(
                  "flex items-center gap-1.5",
                  isDark ? "text-white/40" : "text-gray-400"
                )}>
                  <Clock className="w-4 h-4" />
                  <select
                    value={duration || ""}
                    onChange={(e) => setDuration(e.target.value ? Number(e.target.value) : null)}
                    className={cn(
                      "text-sm bg-transparent focus:outline-none cursor-pointer",
                      isDark ? "text-white/70" : "text-gray-600"
                    )}
                  >
                    <option value="">时长</option>
                    <option value="15">15分钟</option>
                    <option value="30">30分钟</option>
                    <option value="45">45分钟</option>
                    <option value="60">1小时</option>
                    <option value="90">1.5小时</option>
                    <option value="120">2小时</option>
                  </select>
                </div>
              </div>

              {/* 按钮 */}
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm transition",
                    isDark ? "text-white/60 hover:bg-white/5" : "text-gray-600 hover:bg-gray-100"
                  )}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!content.trim() || isSubmitting}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    content.trim() && !isSubmitting
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : isDark ? "bg-white/10 text-white/30" : "bg-gray-200 text-gray-400"
                  )}
                >
                  {isSubmitting ? "添加中..." : "添加"}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default AddTaskModal;
