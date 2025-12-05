/**
 * @file CalendarGrid.tsx
 * @description 月历网格组件 - 优化版
 * 
 * 设计参考:
 * - Apple Calendar: 今日实心圆、周末淡化
 * - Things 3: 极简美学、流畅动画
 * - Linear: 任务密度热力图
 * 
 * 功能:
 * - 6 周 × 7 天网格
 * - 今日高亮指示
 * - 周末视觉区分
 * - 任务密度热力指示
 * - 拖拽放置支持
 */

import { memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDroppable } from "@dnd-kit/core";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, isToday, isSameDay } from "@/utils/date";
import type { Task } from "@/types";

// ============ 类型 ============

interface CalendarGridProps {
  year: number;
  month: number;
  selectedDate: Date;
  tasksByDate: Record<string, Task[]>;
  isDark: boolean;
  onSelectDate: (date: Date) => void;
}

interface DayCellProps {
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  isWeekend: boolean;
  tasks: Task[];
  isDark: boolean;
  onSelect: () => void;
}

// ============ 工具函数 ============

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // 填充上月
  const startDayOfWeek = firstDay.getDay();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  
  // 本月
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  
  // 填充下月 (固定 6 周)
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(year, month + 1, i));
  }
  
  return days;
}

// ============ 日期格子 ============

const DayCell = memo(function DayCell({
  date,
  dateStr,
  isCurrentMonth,
  isSelected,
  isToday: isTodayDate,
  isWeekend,
  tasks,
  isDark,
  onSelect,
}: DayCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dateStr}`,
    data: { date: dateStr },
  });

  const pendingTasks = tasks.filter(t => t.status !== "DONE");
  const completedTasks = tasks.filter(t => t.status === "DONE");

  // 任务密度等级 (用于热力图效果)
  const density = Math.min(pendingTasks.length, 5);

  return (
    <motion.div
      ref={setNodeRef}
      onClick={onSelect}
      className={cn(
        "relative aspect-square flex flex-col items-center justify-center",
        "rounded-xl cursor-pointer transition-all duration-200",
        // 基础样式
        !isCurrentMonth && "opacity-25",
        // 周末淡化 (Apple Calendar 风格)
        isWeekend && isCurrentMonth && !isSelected && (isDark ? "bg-white/[0.02]" : "bg-gray-50/50"),
        // 选中态
        isSelected && (isDark 
          ? "bg-[var(--neon-cyan)]/15 ring-2 ring-[var(--neon-cyan)]/50" 
          : "bg-blue-50 ring-2 ring-blue-400"),
        // 拖拽悬停态
        isOver && (isDark 
          ? "bg-[var(--neon-cyan)]/25 ring-2 ring-[var(--neon-cyan)] scale-105" 
          : "bg-blue-100 ring-2 ring-blue-500 scale-105"),
        // 默认悬停
        !isSelected && !isOver && (isDark ? "hover:bg-white/5" : "hover:bg-gray-50")
      )}
      whileHover={{ scale: isSelected || isOver ? 1.05 : 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* 今日指示器 - Apple 风格实心圆 */}
      {isTodayDate && (
        <motion.div
          layoutId="today-indicator"
          className={cn(
            "absolute inset-1 rounded-lg",
            isDark 
              ? "bg-gradient-to-br from-[var(--neon-cyan)]/20 to-[var(--neon-purple)]/20" 
              : "bg-gradient-to-br from-blue-100 to-purple-100"
          )}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        />
      )}

      {/* 日期数字 */}
      <span
        className={cn(
          "relative z-10 text-sm font-semibold leading-none",
          "w-7 h-7 flex items-center justify-center rounded-full",
          // 今日特殊样式
          isTodayDate && (isDark 
            ? "bg-[var(--neon-cyan)] text-black font-bold" 
            : "bg-blue-500 text-white font-bold"),
          // 非今日
          !isTodayDate && isCurrentMonth && (isDark ? "text-white/80" : "text-gray-700"),
          !isTodayDate && !isCurrentMonth && (isDark ? "text-white/20" : "text-gray-300"),
          // 周末
          isWeekend && !isTodayDate && isCurrentMonth && (isDark ? "text-white/50" : "text-gray-400")
        )}
      >
        {date.getDate()}
      </span>

      {/* 任务指示器 - 热力图风格 */}
      {tasks.length > 0 && (
        <div className="relative z-10 flex items-center gap-0.5 mt-1">
          {/* 任务数量 - 仅当有待办时显示 */}
          {pendingTasks.length > 0 ? (
            <span
              className={cn(
                "text-[10px] font-medium leading-none px-1 rounded",
                isDark ? "text-[var(--neon-cyan)]" : "text-blue-600",
                // 密度热力效果
                density >= 4 && (isDark ? "bg-[var(--neon-cyan)]/20" : "bg-blue-100"),
                density >= 3 && density < 4 && (isDark ? "bg-[var(--neon-cyan)]/10" : "bg-blue-50")
              )}
            >
              {pendingTasks.length}
            </span>
          ) : completedTasks.length > 0 ? (
            // 全部完成 - 显示勾号
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              className={cn(
                "w-3.5 h-3.5 rounded-full flex items-center justify-center",
                isDark ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-600"
              )}
            >
              <Check className="w-2 h-2" strokeWidth={3} />
            </motion.div>
          ) : null}
        </div>
      )}

      {/* 拖拽放置提示 */}
      <AnimatePresence>
        {isOver && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className={cn(
              "absolute -bottom-1 left-1/2 -translate-x-1/2",
              "px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap",
              isDark 
                ? "bg-[var(--neon-cyan)] text-black" 
                : "bg-blue-500 text-white"
            )}
          >
            放置
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// ============ 主组件 ============

export const CalendarGrid = memo(function CalendarGrid({
  year,
  month,
  selectedDate,
  tasksByDate,
  isDark,
  onSelectDate,
}: CalendarGridProps) {
  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <div className="flex flex-col h-full">
      {/* 星期标题 */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((day, i) => (
          <div
            key={day}
            className={cn(
              "text-center text-xs font-medium py-2",
              // 周末颜色区分
              i === 0 || i === 6
                ? isDark ? "text-red-400/60" : "text-red-400"
                : isDark ? "text-white/40" : "text-gray-500"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* 日期网格 - 带月份切换动画 */}
      <motion.div
        key={`${year}-${month}`}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="grid grid-cols-7 gap-1 flex-1"
      >
        {days.map((date) => {
          const dateStr = formatDate(date);
          const dayOfWeek = date.getDay();
          
          return (
            <DayCell
              key={dateStr}
              date={date}
              dateStr={dateStr}
              isCurrentMonth={date.getMonth() === month}
              isSelected={isSameDay(date, selectedDate)}
              isToday={isToday(date)}
              isWeekend={dayOfWeek === 0 || dayOfWeek === 6}
              tasks={tasksByDate[dateStr] || []}
              isDark={isDark}
              onSelect={() => onSelectDate(date)}
            />
          );
        })}
      </motion.div>
    </div>
  );
});

export default CalendarGrid;
