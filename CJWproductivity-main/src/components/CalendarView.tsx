/**
 * @file CalendarView.tsx
 * @description 日历视图 - 月视图 + 日视图
 */

import { useState, useMemo, memo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Clock, Check, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTaskActions } from "@/contexts/TaskActionsContext";
import { useTaskSelection } from "@/contexts/TaskSelectionContext";
import { formatDate, isToday, isSameDay } from "@/utils/date";
import { groupTasksByDate, getTasksByDate, sortByScheduledTime } from "@/utils/task";
import type { Task } from "@/lib/tasks";

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  for (let i = startDayOfWeek - 1; i >= 0; i--) days.push(new Date(year, month, -i));
  for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) days.push(new Date(year, month + 1, i));
  return days;
}

function openQuickCapture(dueDate?: string) {
  window.dispatchEvent(new CustomEvent("open-quickcapture", { detail: { dueDate } }));
}

export const CalendarView = memo(function CalendarView() {
  // 实时跟踪系统日期（用于判断"今天"）
  const [systemDate, setSystemDate] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const isDark = theme === "dark";
  const { tasks, toggleTask } = useTaskActions();
  const { openContextMenu } = useTaskSelection();

  // 每分钟检查一次系统日期，确保跨天时正确更新
  useEffect(() => {
    const checkDate = () => {
      const now = new Date();
      // 如果日期变了（跨天），更新系统日期
      if (now.toDateString() !== systemDate.toDateString()) {
        setSystemDate(now);
      }
    };
    
    // 每分钟检查一次
    const timer = setInterval(checkDate, 60000);
    return () => clearInterval(timer);
  }, [systemDate]);
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  // 将 systemDate 加入依赖，确保跨天时日历能正确更新"今天"标记
  const days = useMemo(() => getDaysInMonth(year, month), [year, month, systemDate]);
  const weekDays = language === "en-US" 
    ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    : language === "ja-JP"
      ? ["日", "月", "火", "水", "木", "金", "土"]
      : ["日", "一", "二", "三", "四", "五", "六"];
  const tasksByDate = useMemo(() => groupTasksByDate(tasks), [tasks]);
  const dayTasks = useMemo(() => sortByScheduledTime(getTasksByDate(tasks, formatDate(selectedDate), false)), [tasks, selectedDate]);
  
  const handlePrevMonth = useCallback(() => setCurrentDate(new Date(year, month - 1, 1)), [year, month]);
  const handleNextMonth = useCallback(() => setCurrentDate(new Date(year, month + 1, 1)), [year, month]);
  const getWeekdayName = (d: number) => {
    if (language === "en-US") return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d];
    if (language === "ja-JP") return ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"][d];
    return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][d];
  };

  const handleTaskContextMenu = useCallback((e: React.MouseEvent, task: Task) => {
    e.preventDefault();
    e.stopPropagation();
    openContextMenu(e.clientX, e.clientY, task);
  }, [openContextMenu]);

  return (
    <div className="h-full flex gap-4 p-4">
      {/* 左侧月历 */}
      <div className={cn("w-[380px] flex-shrink-0 rounded-2xl border p-4 flex flex-col", isDark ? "bg-white/[0.02] border-white/10" : "bg-white border-gray-200")}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={cn("text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>
              {language === "en-US" 
                ? new Date(year, month).toLocaleDateString("en-US", { year: "numeric", month: "long" })
                : language === "ja-JP"
                  ? `${year}年${month + 1}月`
                  : `${year}年${month + 1}月`
              }
            </h2>
          <div className="flex items-center gap-1">
            <button onClick={handlePrevMonth} className={cn("p-1.5 rounded-lg", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}><ChevronLeft className={cn("w-4 h-4", isDark ? "text-white/60" : "text-gray-600")} /></button>
            <button onClick={handleNextMonth} className={cn("p-1.5 rounded-lg", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}><ChevronRight className={cn("w-4 h-4", isDark ? "text-white/60" : "text-gray-600")} /></button>
          </div>
        </div>
        <div className="grid grid-cols-7 mb-1">{weekDays.map((day, i) => <div key={day} className={cn("text-center text-xs py-1 font-medium", isDark ? "text-white/40" : "text-gray-500", (i === 0 || i === 6) && "text-red-400/60")}>{day}</div>)}</div>
        <div className="grid grid-cols-7 gap-0.5 flex-1">
          {days.map((date) => {
            const dateStr = formatDate(date);
            const dayTaskList = tasksByDate[dateStr] || [];
            const totalCount = dayTaskList.length;
            const pendingCount = dayTaskList.filter(t => t.status !== "DONE").length;
            const doneCount = totalCount - pendingCount;
            const isCurrentMonth = date.getMonth() === month;
            const isSelected = isSameDay(date, selectedDate);
            const isTodayDate = isToday(date);
            
            return (
              <div
                key={dateStr}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  "aspect-square flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all relative p-1",
                  isCurrentMonth ? "" : "opacity-30",
                  isSelected 
                    ? isDark 
                      ? "bg-[var(--neon-cyan)]/20 ring-1 ring-[var(--neon-cyan)] shadow-[0_0_10px_rgba(0,255,255,0.3)]" 
                      : "bg-blue-600 text-white shadow-md scale-105"
                    : isDark 
                      ? "hover:bg-white/5" 
                      : "hover:bg-gray-100",
                )}
              >
                {/* 日期数字 */}
                <span className={cn(
                  "text-sm font-medium leading-none",
                  isSelected && !isDark ? "text-white" : (
                    isTodayDate && (isDark ? "text-[var(--neon-cyan)]" : "text-blue-600 font-bold")
                  ),
                  !isSelected && !isTodayDate && (isDark ? "text-white/70" : "text-gray-700")
                )}>
                  {date.getDate()}
                </span>
                {/* 任务指示点 - 简洁小点 */}
                {totalCount > 0 && (
                  <div className="flex items-center gap-[2px] mt-1">
                    {/* 待完成点 */}
                    {pendingCount > 0 && (
                      <div className="flex gap-[2px]">
                        {Array.from({ length: Math.min(pendingCount, 3) }).map((_, i) => (
                          <span 
                            key={`p${i}`} 
                            className={cn(
                              "w-1 h-1 rounded-full", 
                              isSelected && !isDark ? "bg-white/70" : (isDark ? "bg-[var(--neon-cyan)]" : "bg-blue-500")
                            )} 
                          />
                        ))}
                        {pendingCount > 3 && (
                          <span className={cn(
                            "text-[8px] leading-none", 
                            isSelected && !isDark ? "text-white/70" : (isDark ? "text-[var(--neon-cyan)]" : "text-blue-500")
                          )}>+</span>
                        )}
                      </div>
                    )}
                    {/* 已完成点 */}
                    {doneCount > 0 && (
                      <div className="flex gap-[2px]">
                        {Array.from({ length: Math.min(doneCount, 2) }).map((_, i) => (
                          <span 
                            key={`d${i}`} 
                            className={cn(
                              "w-1 h-1 rounded-full",
                              isSelected && !isDark ? "bg-white/40" : "bg-green-500/50"
                            )} 
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 右侧日视图 */}
      <div className={cn("flex-1 rounded-2xl border p-4 flex flex-col min-w-0", isDark ? "bg-white/[0.02] border-white/10" : "bg-white border-gray-200")}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className={cn("text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>
                {language === "en-US"
                  ? selectedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  : `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日`
                }
              </h2>
              <span className={cn("text-sm", isDark ? "text-white/40" : "text-gray-500")}>{getWeekdayName(selectedDate.getDay())}</span>
              {isToday(selectedDate) && (
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", isDark ? "border-[var(--neon-cyan)]/50 text-[var(--neon-cyan)]" : "border-blue-400 text-blue-500")}>{t("calendar.today")}</span>
              )}
            </div>
            <p className={cn("text-xs mt-0.5", isDark ? "text-white/40" : "text-gray-500")}>
              {t("calendar.tasksCount", { total: dayTasks.length, pending: dayTasks.filter(task => task.status !== "DONE").length })}
            </p>
          </div>
          <button
            onClick={() => openQuickCapture(formatDate(selectedDate))}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors", isDark ? "border-[var(--neon-cyan)]/50 text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/10" : "border-blue-400 text-blue-500 hover:bg-blue-50")}
          >
            <Plus className="w-4 h-4" />{t("tasks.newTask")}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
          {dayTasks.length === 0 ? (
            <div className={cn("text-center py-16", isDark ? "text-white/30" : "text-gray-400")}>
              <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm mb-3">{t("calendar.noTasksToday")}</p>
              <button onClick={() => openQuickCapture(formatDate(selectedDate))} className={cn("text-sm px-4 py-2 rounded-lg border", isDark ? "border-white/10 hover:bg-white/5 text-white/60" : "border-gray-200 hover:bg-gray-50 text-gray-600")}>
                <Plus className="w-4 h-4 inline mr-1" />{t("calendar.quickAdd")}
              </button>
            </div>
          ) : (
            <AnimatePresence>
              {dayTasks.map(task => (
                <DayTaskCard
                  key={task.id}
                  task={task}
                  isDark={isDark}
                  onToggle={() => toggleTask(task)}
                  onContextMenu={(e) => handleTaskContextMenu(e, task)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
});

function DayTaskCard({ task, isDark, onToggle, onContextMenu }: { task: Task; isDark: boolean; onToggle: () => void; onContextMenu: (e: React.MouseEvent) => void }) {
  const isCompleted = task.status === "DONE";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onContextMenu={onContextMenu}
      className={cn(
        "p-3 rounded-xl border transition-all group cursor-context-menu",
        isCompleted
          ? isDark ? "bg-white/[0.02] border-white/5" : "bg-gray-50 border-gray-100"
          : isDark ? "bg-white/5 border-white/10 hover:bg-white/[0.08]" : "bg-white border-gray-200 hover:shadow-sm"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className={cn(
            "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 transition-all",
            isCompleted
              ? "bg-green-500 border-green-500"
              : isDark ? "border-[var(--neon-cyan)]/50 hover:bg-[var(--neon-cyan)]/20" : "border-blue-400 hover:bg-blue-50"
          )}
        >
          {isCompleted && <Check className="w-3 h-3 text-white" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm", isCompleted ? isDark ? "text-white/30 line-through" : "text-gray-400 line-through" : isDark ? "text-white/90" : "text-gray-900")}>{task.content}</p>
          <div className="flex items-center gap-2 mt-1">
            {task.scheduled_time && <span className={cn("text-xs flex items-center gap-1", isDark ? "text-white/40" : "text-gray-500")}><Clock className="w-3 h-3" />{task.scheduled_time}</span>}
            {task.duration && <span className={cn("text-xs", isDark ? "text-white/30" : "text-gray-400")}>{task.duration}分钟</span>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default CalendarView;