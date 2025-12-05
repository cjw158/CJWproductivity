/**
 * @file DayTaskList.tsx
 * @description 日任务列表组件 - 优化版
 * 
 * 设计参考:
 * - Things 3: 完成动画、优雅的空状态
 * - Todoist: 分组显示、清晰的层次
 * 
 * 特性:
 * - 任务完成时的庆祝动画
 * - 按时间分组显示
 * - 优雅的空状态
 */

import { memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, Calendar, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { sortByScheduledTime } from "@/utils/task";
import type { Task } from "@/types";

// ============ 类型 ============

interface DayTaskListProps {
  tasks: Task[];
  isDark: boolean;
  onToggleTask: (task: Task) => void;
}

interface TaskCardProps {
  task: Task;
  isDark: boolean;
  onToggle: () => void;
}

// ============ 任务卡片 ============

const TaskCard = memo(function TaskCard({ task, isDark, onToggle }: TaskCardProps) {
  const isCompleted = task.status === "DONE";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -50, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(
        "group relative p-4 rounded-xl border transition-all duration-300",
        isCompleted
          ? isDark 
            ? "bg-white/[0.02] border-white/5" 
            : "bg-gray-50/50 border-gray-100"
          : isDark 
            ? "bg-white/[0.04] border-white/10 hover:bg-white/[0.06] hover:border-white/15" 
            : "bg-white border-gray-200 hover:shadow-md hover:border-gray-300"
      )}
    >
      <div className="flex items-start gap-4">
        {/* 复选框 - Things 3 风格 */}
        <button
          onClick={onToggle}
          className={cn(
            "relative w-6 h-6 rounded-full border-2 flex-shrink-0 mt-0.5",
            "flex items-center justify-center transition-all duration-300",
            isCompleted
              ? "bg-green-500 border-green-500 scale-100"
              : cn(
                  "hover:scale-110",
                  isDark
                    ? "border-white/30 hover:border-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/10"
                    : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                )
          )}
        >
          <AnimatePresence>
            {isCompleted && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              >
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* 完成时的光环效果 */}
          {isCompleted && (
            <motion.div
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 rounded-full bg-green-500"
            />
          )}
        </button>

        {/* 任务内容 */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm leading-relaxed transition-all duration-300",
              isCompleted
                ? cn("line-through", isDark ? "text-white/30" : "text-gray-400")
                : isDark ? "text-white/90" : "text-gray-800"
            )}
          >
            {task.content}
          </p>

          {/* 时间信息 */}
          {(task.scheduled_time || task.duration) && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex items-center gap-3 mt-2 text-xs",
                isDark ? "text-white/40" : "text-gray-500"
              )}
            >
              {task.scheduled_time && (
                <span className={cn(
                  "flex items-center gap-1.5 px-2 py-1 rounded-md",
                  isDark ? "bg-white/5" : "bg-gray-100"
                )}>
                  <Clock className="w-3 h-3" />
                  {task.scheduled_time}
                </span>
              )}
              {task.duration && (
                <span className={cn(
                  "flex items-center gap-1",
                  isDark ? "text-white/30" : "text-gray-400"
                )}>
                  {task.duration} 分钟
                </span>
              )}
            </motion.div>
          )}
        </div>

      </div>
    </motion.div>
  );
});

// ============ 空状态 ============

function EmptyState({ isDark }: { isDark: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <motion.div
        animate={{ 
          y: [0, -8, 0],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className={cn(
          "w-20 h-20 rounded-2xl flex items-center justify-center mb-6",
          isDark 
            ? "bg-gradient-to-br from-[var(--neon-cyan)]/10 to-[var(--neon-purple)]/10" 
            : "bg-gradient-to-br from-blue-50 to-purple-50"
        )}
      >
        <Calendar 
          className={cn(
            "w-10 h-10",
            isDark ? "text-[var(--neon-cyan)]/50" : "text-blue-300"
          )} 
        />
      </motion.div>
      
      <h3 className={cn(
        "text-base font-medium mb-2",
        isDark ? "text-white/60" : "text-gray-600"
      )}>
        今日无任务
      </h3>
      
      <p className={cn(
        "text-sm text-center max-w-[200px]",
        isDark ? "text-white/30" : "text-gray-400"
      )}>
        点击右上角添加任务，或从未排期列表拖拽
      </p>
    </motion.div>
  );
}

// ============ 完成提示 ============

function AllDoneState({ count, isDark }: { count: number; isDark: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 px-4"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center mb-4",
          "bg-gradient-to-br from-green-400 to-emerald-500"
        )}
      >
        <Sparkles className="w-8 h-8 text-white" />
      </motion.div>
      
      <h3 className={cn(
        "text-base font-medium mb-1",
        isDark ? "text-white/80" : "text-gray-700"
      )}>
        全部完成！
      </h3>
      
      <p className={cn(
        "text-sm",
        isDark ? "text-white/40" : "text-gray-500"
      )}>
        今日已完成 {count} 项任务
      </p>
    </motion.div>
  );
}

// ============ 主组件 ============

export const DayTaskList = memo(function DayTaskList({
  tasks,
  isDark,
  onToggleTask,
}: DayTaskListProps) {
  const { pending, completed } = useMemo(() => {
    const pendingTasks = sortByScheduledTime(tasks.filter(t => t.status !== "DONE"));
    const completedTasks = tasks.filter(t => t.status === "DONE");
    return { pending: pendingTasks, completed: completedTasks };
  }, [tasks]);

  // 空状态
  if (tasks.length === 0) {
    return <EmptyState isDark={isDark} />;
  }

  // 全部完成
  if (pending.length === 0 && completed.length > 0) {
    return (
      <div>
        <AllDoneState count={completed.length} isDark={isDark} />
        <div className="px-1">
          <div className={cn(
            "text-xs font-medium px-3 py-2 mb-2",
            isDark ? "text-white/30" : "text-gray-400"
          )}>
            已完成
          </div>
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {completed.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isDark={isDark}
                  onToggle={() => onToggleTask(task)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 待办任务 */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {pending.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                isDark={isDark}
                onToggle={() => onToggleTask(task)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* 已完成任务 */}
      {completed.length > 0 && (
        <div>
          <div className={cn(
            "text-xs font-medium px-3 py-2",
            isDark ? "text-white/30" : "text-gray-400"
          )}>
            已完成 · {completed.length}
          </div>
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {completed.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isDark={isDark}
                  onToggle={() => onToggleTask(task)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
});

export default DayTaskList;
