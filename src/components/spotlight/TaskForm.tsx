/**
 * @file TaskForm.tsx
 * @description 任务属性表单（日期、时间、时长）
 */

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { DurationSlider } from "./DurationSlider";

interface TaskFormProps {
  dueDate: string;
  scheduledTime: string;
  duration: number;
  showDuration: boolean;
  isDark: boolean;
  onDueDateChange: (v: string) => void;
  onScheduledTimeChange: (v: string) => void;
  onDurationChange: (v: number) => void;
  onShowDurationChange: (v: boolean) => void;
}

export const TaskForm = memo(function TaskForm({
  dueDate,
  scheduledTime,
  duration,
  showDuration,
  isDark,
  onDueDateChange,
  onScheduledTimeChange,
  onDurationChange,
  onShowDurationChange,
}: TaskFormProps) {
  const now = new Date();
  const today = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
  const tom = new Date(Date.now() + 86400000);
  const tomorrow = `${tom.getFullYear()}-${(tom.getMonth() + 1).toString().padStart(2, "0")}-${tom.getDate().toString().padStart(2, "0")}`;

  return (
    <div className="space-y-3">
      {/* 日期快捷按钮 */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => onDueDateChange(today)}
          className={cn(
            "px-2.5 py-1 rounded-md text-xs transition-all",
            dueDate === today
              ? "bg-[var(--neon-green)]/20 text-[var(--neon-green)] border border-[var(--neon-green)]/30"
              : isDark
                ? "bg-white/5 text-white/50 hover:bg-white/10"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          )}
        >
          今天
        </button>
        <button
          onClick={() => onDueDateChange(tomorrow)}
          className={cn(
            "px-2.5 py-1 rounded-md text-xs transition-all",
            dueDate === tomorrow
              ? "bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] border border-[var(--neon-cyan)]/30"
              : isDark
                ? "bg-white/5 text-white/50 hover:bg-white/10"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          )}
        >
          明天
        </button>
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs",
          dueDate && dueDate !== today && dueDate !== tomorrow
            ? "bg-[var(--neon-purple)]/20 text-[var(--neon-purple)] border border-[var(--neon-purple)]/30"
            : isDark ? "bg-white/5" : "bg-gray-100"
        )}>
          <Calendar className={cn("w-3 h-3", isDark ? "text-white/40" : "text-gray-400")} />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
            className={cn(
              "bg-transparent border-none outline-none text-xs w-24",
              isDark ? "text-white/70" : "text-gray-600"
            )}
          />
        </div>
        {dueDate && (
          <button
            onClick={() => onDueDateChange("")}
            className={cn(
              "px-2 py-1 rounded-md text-xs transition-all",
              isDark
                ? "text-white/30 hover:text-white/60 hover:bg-white/5"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            )}
          >
            清除
          </button>
        )}
      </div>

      {/* 时间选择 */}
      <div className="flex items-center gap-2">
        <Clock className={cn("w-4 h-4", isDark ? "text-white/40" : "text-gray-400")} />
        <input
          type="time"
          value={scheduledTime}
          onChange={(e) => onScheduledTimeChange(e.target.value)}
          className={cn(
            "flex-1 px-3 py-2 rounded-xl text-sm border-none outline-none",
            isDark ? "bg-white/5 text-white/70" : "bg-gray-100 text-gray-600"
          )}
          placeholder="开始时间"
        />
      </div>

      {/* 时长选择 */}
      <div className="space-y-2">
        <button
          onClick={() => onShowDurationChange(!showDuration)}
          className={cn(
            "flex items-center gap-1.5 text-sm",
            showDuration ? "text-[var(--neon-cyan)]" : isDark ? "text-white/40" : "text-gray-400"
          )}
        >
          <div className={cn(
            "w-4 h-4 rounded border-2 flex items-center justify-center transition-colors",
            showDuration
              ? "border-[var(--neon-cyan)] bg-[var(--neon-cyan)]"
              : isDark ? "border-white/20" : "border-gray-300"
          )}>
            {showDuration && <div className="w-2 h-2 rounded-sm bg-white" />}
          </div>
          设置时长
        </button>

        <AnimatePresence>
          {showDuration && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <DurationSlider value={duration} onChange={onDurationChange} isDark={isDark} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});
