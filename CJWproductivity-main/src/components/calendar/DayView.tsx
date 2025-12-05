/**
 * @file DayView.tsx
 * @description 日视图组件
 */

import { memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowLeft, Plus, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { sortByScheduledTime } from "@/utils/task";
import { isToday as checkIsToday } from "@/utils/date";
import type { Task } from "@/lib/tasks";

interface DayViewProps {
  date: Date;
  tasks: Task[];
  unscheduledTasks?: Task[];
  isDark: boolean;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  onAddTask: () => void;
  onToggleTask: (task: Task) => void;
  onDeleteTask?: (taskId: number) => void;
  onScheduleTask?: (taskId: number, time: string, duration: number) => void;
  onUpdateTask?: (taskId: number, updates: Partial<Task>) => void;
}

function TaskCard({ task, isDark, onToggle, showTime = true }: { task: Task; isDark: boolean; onToggle: (task: Task) => void; showTime?: boolean; }) {
  const done = task.status === "DONE";
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={cn("group flex items-start gap-3 px-4 py-3", done && "opacity-40")}>
      <button onClick={() => onToggle(task)} className={cn("w-5 h-5 mt-0.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all", done ? "bg-green-500 border-green-500" : isDark ? "border-white/30" : "border-gray-300")}>
        {done && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm leading-relaxed", done && "line-through", isDark ? "text-white/90" : "text-gray-800")}>{task.content}</p>
        {showTime && (task.scheduled_time || task.duration) && (
          <div className={cn("flex items-center gap-2 mt-1 text-xs", isDark ? "text-white/40" : "text-gray-400")}>
            {task.scheduled_time && <span className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded", isDark ? "bg-white/5" : "bg-gray-100")}><Clock className="w-3 h-3" />{task.scheduled_time}</span>}
            {task.duration && <span>{task.duration}分钟</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SectionHeader({ title, count, isDark }: { title: string; count: number; isDark: boolean }) {
  return <div className={cn("px-4 py-2 text-xs font-medium sticky top-0 z-10", isDark ? "text-white/50 bg-[#0d0d12]" : "text-gray-500 bg-gray-50")}>{title}  {count}</div>;
}

export const DayView = memo(function DayView({ date, tasks, isDark, onBack, onPrev, onNext, onAddTask, onToggleTask }: DayViewProps) {
  const isToday = checkIsToday(date);
  const { unscheduled, scheduled, completed } = useMemo(() => {
    const pending = tasks.filter(t => t.status !== "DONE");
    return { unscheduled: pending.filter(t => !t.scheduled_time), scheduled: sortByScheduledTime(pending.filter(t => t.scheduled_time)), completed: tasks.filter(t => t.status === "DONE") };
  }, [tasks]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-2 pb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className={cn("p-2 -ml-2 rounded-xl transition", isDark ? "hover:bg-white/10 text-white/60" : "hover:bg-gray-100 text-gray-500")}><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex items-center gap-2">
            <button onClick={onPrev} className={cn("p-1.5 rounded-lg transition", isDark ? "hover:bg-white/10 text-white/40" : "hover:bg-gray-100 text-gray-400")}><ChevronLeft className="w-4 h-4" /></button>
            <h2 className={cn("text-base font-semibold min-w-[100px] text-center", isDark ? "text-white" : "text-gray-900")}>{date.getMonth() + 1}月{date.getDate()}日<span className={cn("ml-1.5 font-normal text-sm", isDark ? "text-white/40" : "text-gray-400")}>{date.toLocaleDateString("zh-CN", { weekday: "short" })}</span></h2>
            <button onClick={onNext} className={cn("p-1.5 rounded-lg transition", isDark ? "hover:bg-white/10 text-white/40" : "hover:bg-gray-100 text-gray-400")}><ChevronRight className="w-4 h-4" /></button>
          </div>
          {isToday && <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500 text-white font-medium">今天</span>}
        </div>
        <div className={cn("text-xs tabular-nums", isDark ? "text-white/40" : "text-gray-400")}>{completed.length}/{tasks.length} 已完成</div>
      </div>
      <div className={cn("flex-1 overflow-y-auto custom-scrollbar rounded-xl", isDark ? "bg-white/[0.02]" : "bg-white border border-gray-100")}>
        {tasks.length === 0 ? <div className={cn("flex flex-col items-center justify-center h-full", isDark ? "text-white/20" : "text-gray-300")}><Check className="w-12 h-12 mb-3" /><p className="text-sm">今日暂无任务</p></div> : (
          <>
            {unscheduled.length > 0 && <div><SectionHeader title="待安排时间" count={unscheduled.length} isDark={isDark} /><AnimatePresence>{unscheduled.map(t => <TaskCard key={t.id} task={t} isDark={isDark} onToggle={onToggleTask} showTime={false} />)}</AnimatePresence></div>}
            {scheduled.length > 0 && <div className={unscheduled.length > 0 ? "mt-1" : ""}><SectionHeader title="已安排时间" count={scheduled.length} isDark={isDark} /><AnimatePresence>{scheduled.map(t => <TaskCard key={t.id} task={t} isDark={isDark} onToggle={onToggleTask} />)}</AnimatePresence></div>}
            {completed.length > 0 && <div className="mt-1"><SectionHeader title="已完成" count={completed.length} isDark={isDark} /><AnimatePresence>{completed.map(t => <TaskCard key={t.id} task={t} isDark={isDark} onToggle={onToggleTask} />)}</AnimatePresence></div>}
          </>
        )}
      </div>
      <div className="pt-3 flex-shrink-0"><motion.button onClick={onAddTask} whileTap={{ scale: 0.98 }} className={cn("w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-colors", isDark ? "bg-white/5 hover:bg-white/10 text-white/80" : "bg-gray-100 hover:bg-gray-200 text-gray-700")}><Plus className="w-4 h-4" />添加任务</motion.button></div>
    </div>
  );
});

export default DayView;
