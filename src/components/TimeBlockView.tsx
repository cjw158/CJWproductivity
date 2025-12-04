import { memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft, 
  Plus, 
  Clock, 
  Check,
  GripVertical,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UnifiedTaskCard } from "./UnifiedTaskCard";
import { TIME_CONFIG } from "@/config/constants";
import type { Task } from "@/lib/tasks";

// 从配置常量解构
const { START_HOUR, END_HOUR, HOUR_HEIGHT } = TIME_CONFIG;

// 时间槽组件 - 可放置区域
function TimeSlot({ hour, isDark }: { hour: number; isDark: boolean }) {
  const id = `slot-${hour}`;
  const { setNodeRef, isOver } = useDroppable({ id });
  
  const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
  
  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "relative flex border-t transition-colors",
        isDark ? "border-white/5" : "border-gray-100",
        isOver && (isDark ? "bg-[var(--neon-cyan)]/10" : "bg-blue-50")
      )}
      style={{ height: HOUR_HEIGHT }}
    >
      {/* 时间标签 */}
      <div className={cn(
        "w-16 flex-shrink-0 text-xs text-right pr-3 pt-1",
        isDark ? "text-white/30" : "text-gray-400"
      )}>
        {timeLabel}
      </div>
      
      {/* 时间线区域 */}
      <div className="flex-1 relative">
        {isOver && (
          <div className={cn(
            "absolute inset-0 rounded-lg border-2 border-dashed",
            isDark ? "border-[var(--neon-cyan)]/50 bg-[var(--neon-cyan)]/5" : "border-blue-300 bg-blue-50/50"
          )} />
        )}
      </div>
    </div>
  );
}

// 时间块任务组件
function TimeBlockTask({ 
  task, 
  isDark,
  onDelete,
  onToggle
}: { 
  task: Task; 
  isDark: boolean;
  onDelete: (id: number) => void;
  onToggle: (task: Task) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task }
  });

  const duration = task.duration || 30; // 默认30分钟
  const heightPx = (duration / 60) * HOUR_HEIGHT;
  
  // 解析开始时间
  const [startHour, startMinute] = (task.scheduled_time || "09:00").split(":").map(Number);
  const topPx = ((startHour - START_HOUR) * HOUR_HEIGHT) + ((startMinute / 60) * HOUR_HEIGHT);

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    height: heightPx,
    top: topPx,
  };

  // 边框颜色
  const borderColor = "border-l-[var(--neon-cyan)]";

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isDragging ? 0.5 : 1, scale: 1 }}
      className={cn(
        "absolute left-0 right-2 ml-16 group",
        "rounded-lg border-l-4 px-3 py-2 cursor-grab active:cursor-grabbing",
        isDark 
          ? "bg-white/10 border border-white/10 hover:bg-white/15" 
          : "bg-white border border-gray-200 shadow-sm hover:shadow",
        borderColor,
        isDragging && "z-50 shadow-xl"
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start gap-2 h-full">
        <GripVertical className={cn(
          "w-4 h-4 mt-0.5 flex-shrink-0 opacity-30 group-hover:opacity-60",
          isDark ? "text-white" : "text-gray-500"
        )} />
        
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className={cn(
            "text-sm font-medium truncate",
            task.status === "DONE" && "line-through opacity-50",
            isDark ? "text-white" : "text-gray-900"
          )}>
            {task.content}
          </p>
          {heightPx >= 50 && (
            <div className={cn(
              "flex items-center gap-2 mt-1 text-xs",
              isDark ? "text-white/40" : "text-gray-400"
            )}>
              <Clock className="w-3 h-3" />
              <span>{duration}分钟</span>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(task); }}
            className={cn(
              "p-1 rounded transition-colors",
              isDark ? "hover:bg-white/10" : "hover:bg-gray-100"
            )}
          >
            <Check className={cn(
              "w-3.5 h-3.5",
              task.status === "DONE" ? "text-green-500" : (isDark ? "text-white/40" : "text-gray-400")
            )} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className={cn(
              "p-1 rounded transition-colors",
              isDark ? "hover:bg-white/10 text-white/40 hover:text-red-400" : "hover:bg-gray-100 text-gray-400 hover:text-red-500"
            )}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// 主组件
interface TimeBlockViewProps {
  date: Date;
  scheduledTasks: Task[];  // 已排期任务
  unscheduledTasks: Task[]; // 未排期任务
  isDark: boolean;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
  onAddTask: () => void;
  onToggleTask: (task: Task) => void;
  onDeleteTask: (taskId: number) => void;
  onScheduleTask: (taskId: number, time: string, duration: number) => void;
}

export const TimeBlockView = memo(function TimeBlockView({
  date,
  scheduledTasks,
  unscheduledTasks,
  isDark,
  onBack,
  onPrev,
  onNext,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  // onScheduleTask 由 TasksView 的 DND 处理
}: TimeBlockViewProps) {
  const hours = useMemo(() => 
    Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i), 
    []
  );

  const isTodayDate = date.toDateString() === new Date().toDateString();

  // 当前时间指示器
  const now = new Date();
  const currentTimeTop = now.toDateString() === date.toDateString()
    ? ((now.getHours() - START_HOUR) * HOUR_HEIGHT) + ((now.getMinutes() / 60) * HOUR_HEIGHT)
    : null;

  return (
    <div className="h-full flex flex-col">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className={cn(
              "p-2 rounded-lg transition-all",
              isDark ? "hover:bg-white/10 text-white/60" : "hover:bg-gray-100 text-gray-600"
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <h2 className={cn(
              "text-2xl font-bold flex items-center gap-2",
              isDark ? "text-white" : "text-gray-900"
            )}>
              {date.getMonth() + 1}月{date.getDate()}日
              {isTodayDate && (
                <span className="text-sm font-normal px-2 py-0.5 rounded-full bg-[var(--neon-cyan)] text-white">
                  今天
                </span>
              )}
            </h2>
            <span className={cn("text-sm", isDark ? "text-white/40" : "text-gray-500")}>
              {date.toLocaleDateString("zh-CN", { weekday: "long" })} • 时间块规划
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={onPrev}
              className={cn(
                "p-2 rounded-lg transition-all",
                isDark ? "hover:bg-white/10 text-white/60" : "hover:bg-gray-100 text-gray-600"
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={onNext}
              className={cn(
                "p-2 rounded-lg transition-all",
                isDark ? "hover:bg-white/10 text-white/60" : "hover:bg-gray-100 text-gray-600"
              )}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={onAddTask}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
              "bg-[var(--neon-cyan)] text-white hover:opacity-90"
            )}
          >
            <Plus className="w-4 h-4" />
            添加任务
          </button>
        </div>
      </div>

      {/* 主体区域 */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        {/* 左侧：时间轴 */}
        <div className={cn(
          "flex-1 rounded-2xl border overflow-y-auto custom-scrollbar relative",
          isDark ? "bg-white/[0.02] border-white/10" : "bg-white border-gray-200"
        )}>
          <div className="relative" style={{ minHeight: (END_HOUR - START_HOUR) * HOUR_HEIGHT }}>
            {/* 时间槽 */}
            {hours.map(hour => (
              <TimeSlot key={hour} hour={hour} isDark={isDark} />
            ))}

            {/* 已排期的任务 */}
            {scheduledTasks.map(task => (
              <TimeBlockTask
                key={task.id}
                task={task}
                isDark={isDark}
                onDelete={onDeleteTask}
                onToggle={onToggleTask}
              />
            ))}

            {/* 当前时间指示器 */}
            {currentTimeTop !== null && currentTimeTop >= 0 && (
              <div 
                className="absolute left-0 right-0 flex items-center z-20 pointer-events-none"
                style={{ top: currentTimeTop }}
              >
                <div className="w-16 text-right pr-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 ml-auto animate-pulse" />
                </div>
                <div className="flex-1 h-0.5 bg-red-500" />
              </div>
            )}
          </div>
        </div>

        {/* 右侧：待排期任务池 */}
        <div className={cn(
          "w-72 flex-shrink-0 rounded-2xl border p-4 flex flex-col",
          isDark ? "bg-white/[0.02] border-white/10" : "bg-gray-50 border-gray-200"
        )}>
          <h3 className={cn(
            "text-sm font-semibold mb-3 flex items-center gap-2",
            isDark ? "text-white/60" : "text-gray-600"
          )}>
            <Clock className="w-4 h-4" />
            待排期 ({unscheduledTasks.length})
          </h3>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
            <AnimatePresence>
              {unscheduledTasks.length === 0 ? (
                <div className={cn(
                  "text-center py-8 text-sm",
                  isDark ? "text-white/30" : "text-gray-400"
                )}>
                  所有任务已排期 ✓
                </div>
              ) : (
                unscheduledTasks.map(task => (
                  <UnifiedTaskCard
                    key={task.id}
                    task={task}
                    variant="compact"
                    showDragHandle={false}
                    showTimeTags={true}
                  />
                ))
              )}
            </AnimatePresence>
          </div>

          {/* 时长快捷设置提示 */}
          <div className={cn(
            "mt-4 p-3 rounded-lg text-xs",
            isDark ? "bg-white/5 text-white/40" : "bg-white text-gray-500"
          )}>
            💡 拖拽任务到左侧时间轴进行排期
          </div>
        </div>
      </div>
    </div>
  );
});
