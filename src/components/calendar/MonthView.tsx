/**
 * @file MonthView.tsx
 * @description 生产级月视图组件 - 支持拖拽排期
 * 
 * 功能:
 * 1. 显示月份日历网格
 * 2. 支持从未排期任务池拖拽到某天
 * 3. 如果任务已有 scheduled_time 和 duration，自动在日视图显示
 * 4. 支持日期选择和双击进入日视图
 */

import { useState, useMemo, memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  DragStartEvent,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  rectIntersection,
} from "@dnd-kit/core";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Check,
  Inbox,
  GripVertical,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/tasks";

// ============ 类型定义 ============

interface MonthViewProps {
  /** 当前月份 */
  currentDate: Date;
  /** 选中的日期 */
  selectedDate: Date | null;
  /** 所有任务(按日期分组) */
  tasksByDate: Record<string, Task[]>;
  /** 未排期任务 */
  unscheduledTasks: Task[];
  /** 主题 */
  isDark: boolean;
  /** 切换到上月 */
  onPrevMonth: () => void;
  /** 切换到下月 */
  onNextMonth: () => void;
  /** 跳转到今天 */
  onToday: () => void;
  /** 选择日期 */
  onSelectDate: (date: Date) => void;
  /** 双击进入日视图 */
  onEnterDayView: (date: Date) => void;
  /** 添加任务 */
  onAddTask: () => void;
  /** 切换任务状态 */
  onToggleTask: (task: Task) => void;
  /** 更新任务日期 */
  onScheduleToDate: (taskId: number, date: string) => void;
}

// ============ 工具函数 ============

/**
 * 格式化日期为 YYYY-MM-DD（本地时间）
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 获取月份的所有日期(包括上月末和下月初的填充)
 */
function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // 添加上月的日期来填充第一周
  const startDayOfWeek = firstDay.getDay();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }

  // 添加本月的所有日期
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }

  // 添加下月的日期来填充最后一周
  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
}

/**
 * 判断两个日期是否同一天
 */
function isSameDay(d1: Date, d2: Date): boolean {
  return formatDate(d1) === formatDate(d2);
}

/**
 * 判断是否是今天
 */
function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

// ============ 子组件 ============

/**
 * 任务项 - 日期格子中的任务显示
 */
const TaskItem = memo(function TaskItem({
  task,
  isDark,
  onToggle,
}: {
  task: Task;
  isDark: boolean;
  onToggle: (task: Task) => void;
}) {
  const isCompleted = task.status === "DONE";
  const hasTimeInfo = task.scheduled_time && task.duration;

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-1.5 py-0.5 rounded text-xs truncate cursor-pointer transition-all",
        isCompleted
          ? isDark ? "bg-white/5 text-white/30 line-through" : "bg-gray-100 text-gray-400 line-through"
          : isDark ? "bg-white/10 text-white/80" : "bg-gray-100 text-gray-700"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(task);
      }}
    >
      <div className={cn(
        "w-3 h-3 rounded-sm border flex-shrink-0 flex items-center justify-center",
        isCompleted
          ? "bg-green-500 border-green-500"
          : isDark ? "border-white/30" : "border-gray-300"
      )}>
        {isCompleted && <Check className="w-2 h-2 text-white" />}
      </div>
      <span className="truncate flex-1">{task.content}</span>
      {hasTimeInfo && (
        <Clock className={cn(
          "w-2.5 h-2.5 flex-shrink-0",
          isDark ? "text-white/40" : "text-gray-400"
        )} />
      )}
    </div>
  );
});

/**
 * 日期单元格 - 可接收拖拽的日期格子
 */
const DayCell = memo(function DayCell({
  date,
  isCurrentMonth,
  tasks,
  isSelected,
  isDark,
  onSelect,
  onDoubleClick,
  onToggleTask,
}: {
  date: Date;
  isCurrentMonth: boolean;
  tasks: Task[];
  isSelected: boolean;
  isDark: boolean;
  onSelect: (date: Date) => void;
  onDoubleClick: (date: Date) => void;
  onToggleTask: (task: Task) => void;
}) {
  const dateStr = formatDate(date);
  const { setNodeRef, isOver } = useDroppable({
    id: `day-${dateStr}`,
    data: { date: dateStr },
  });

  const today = isToday(date);
  const dayTasks = tasks.slice(0, 3);
  const moreCount = tasks.length - 3;

  // 统计有时间信息的任务
  const scheduledCount = tasks.filter(t => t.scheduled_time).length;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[100px] p-1.5 border-b border-r cursor-pointer transition-all",
        isDark ? "border-white/5" : "border-gray-100",
        isCurrentMonth
          ? isDark ? "bg-transparent" : "bg-white"
          : isDark ? "bg-white/[0.02]" : "bg-gray-50",
        isSelected && (isDark ? "ring-2 ring-[var(--neon-cyan)] ring-inset" : "ring-2 ring-blue-500 ring-inset"),
        isOver && (isDark ? "bg-[var(--neon-cyan)]/10" : "bg-blue-50"),
        "hover:bg-white/5"
      )}
      onClick={() => onSelect(date)}
      onDoubleClick={() => onDoubleClick(date)}
    >
      {/* 日期数字 */}
      <div className="flex items-center justify-between mb-1">
        <span className={cn(
          "w-6 h-6 flex items-center justify-center rounded-full text-sm font-medium",
          today && "bg-[var(--neon-cyan)] text-white",
          !today && !isCurrentMonth && (isDark ? "text-white/20" : "text-gray-300"),
          !today && isCurrentMonth && (isDark ? "text-white/70" : "text-gray-700")
        )}>
          {date.getDate()}
        </span>
        {scheduledCount > 0 && (
          <span className={cn(
            "text-[10px] px-1.5 py-0.5 rounded-full",
            isDark ? "bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)]" : "bg-blue-100 text-blue-600"
          )}>
            <Clock className="w-2.5 h-2.5 inline mr-0.5" />
            {scheduledCount}
          </span>
        )}
      </div>

      {/* 拖拽放置指示器 */}
      {isOver && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "mb-1 py-1 rounded text-center text-xs font-medium",
            isDark ? "bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)]" : "bg-blue-100 text-blue-600"
          )}
        >
          释放排期到此日
        </motion.div>
      )}

      {/* 任务列表 */}
      <div className="space-y-0.5">
        {dayTasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            isDark={isDark}
            onToggle={onToggleTask}
          />
        ))}
        {moreCount > 0 && (
          <div className={cn(
            "text-xs px-1.5",
            isDark ? "text-white/40" : "text-gray-400"
          )}>
            +{moreCount} 更多
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * 未排期任务卡片 - 可拖拽
 */
const UnscheduledTaskCard = memo(function UnscheduledTaskCard({
  task,
  isDark,
}: {
  task: Task;
  isDark: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `unscheduled-${task.id}`,
    data: { task },
  });

  const hasTimeInfo = task.scheduled_time && task.duration;

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing",
        "border transition-all group",
        isDark
          ? "bg-white/5 border-white/10 hover:bg-white/10"
          : "bg-white border-gray-200 hover:shadow-sm",
        isDragging && "shadow-xl z-50"
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start gap-2">
        <GripVertical className={cn(
          "w-4 h-4 mt-0.5 flex-shrink-0 opacity-30 group-hover:opacity-60",
          isDark ? "text-white" : "text-gray-500"
        )} />
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-sm font-medium truncate",
            isDark ? "text-white/90" : "text-gray-900"
          )}>
            {task.content}
          </p>
          <div className={cn(
            "flex items-center gap-2 mt-1 text-xs",
            isDark ? "text-white/40" : "text-gray-500"
          )}>
            {hasTimeInfo && (
              <span className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded",
                isDark ? "bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)]" : "bg-blue-100 text-blue-600"
              )}>
                <Clock className="w-3 h-3" />
                {task.scheduled_time} • {task.duration}分钟
              </span>
            )}
            {!hasTimeInfo && task.duration && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {task.duration}分钟
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// ============ 动画配置 ============

const viewVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
    scale: 0.95,
  }),
};

const viewTransition = {
  x: { type: "spring", stiffness: 300, damping: 30 },
  opacity: { duration: 0.2 },
  scale: { duration: 0.2 },
};

// ============ 主组件 ============

/**
 * MonthView - 生产级月视图组件
 * 
 * 功能:
 * - 月历网格显示
 * - 拖拽任务到日期排期
 * - 有时间信息的任务标记显示
 */
export const MonthView = memo(function MonthView({
  currentDate,
  selectedDate,
  tasksByDate,
  unscheduledTasks,
  isDark,
  onPrevMonth,
  onNextMonth,
  onToday,
  onSelectDate,
  onEnterDayView,
  onAddTask,
  onToggleTask,
  onScheduleToDate,
}: MonthViewProps) {
  const [direction, setDirection] = useState(0);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  // DnD 传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // 月份切换
  const handlePrevMonth = useCallback(() => {
    setDirection(-1);
    onPrevMonth();
  }, [onPrevMonth]);

  const handleNextMonth = useCallback(() => {
    setDirection(1);
    onNextMonth();
  }, [onNextMonth]);

  // 拖拽处理
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task;
    if (task) setDraggedTask(task);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedTask(null);

    if (!over) return;

    const task = active.data.current?.task as Task;
    const dateStr = over.data.current?.date as string;

    if (task && dateStr) {
      onScheduleToDate(task.id, dateStr);
    }
  }, [onScheduleToDate]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full flex flex-col">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className={cn(
              "text-2xl font-bold",
              isDark ? "text-white" : "text-gray-900"
            )}>
              {year}年{month + 1}月
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  isDark ? "hover:bg-white/10 text-white/60" : "hover:bg-gray-100 text-gray-600"
                )}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextMonth}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  isDark ? "hover:bg-white/10 text-white/60" : "hover:bg-gray-100 text-gray-600"
                )}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={onToday}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                isDark
                  ? "bg-white/10 text-white/80 hover:bg-white/20"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              今天
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

        {/* 主体区域 */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* 日历主体 */}
          <div className={cn(
            "flex-1 rounded-2xl overflow-hidden border relative",
            isDark ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-white"
          )}>
            <div className="absolute inset-0 flex flex-col">
              {/* 星期头部 */}
              <div className="grid grid-cols-7 flex-shrink-0 bg-inherit z-10">
                {weekDays.map((day, i) => (
                  <div
                    key={day}
                    className={cn(
                      "py-3 text-center text-sm font-medium border-b",
                      isDark ? "border-white/10 text-white/50" : "border-gray-100 text-gray-500",
                      (i === 0 || i === 6) && (isDark ? "text-white/30" : "text-gray-400")
                    )}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* 日期网格 */}
              <div className="flex-1 relative overflow-hidden">
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                  <motion.div
                    key={currentDate.toISOString()}
                    custom={direction}
                    variants={viewVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={viewTransition}
                    className="absolute inset-0 grid grid-cols-7"
                  >
                    {days.map((date, i) => {
                      const dateStr = formatDate(date);
                      const isCurrentMonth = date.getMonth() === month;
                      const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
                      const dayTasks = tasksByDate[dateStr] || [];

                      return (
                        <DayCell
                          key={i}
                          date={date}
                          isCurrentMonth={isCurrentMonth}
                          tasks={dayTasks}
                          isSelected={isSelected}
                          isDark={isDark}
                          onSelect={onSelectDate}
                          onDoubleClick={onEnterDayView}
                          onToggleTask={onToggleTask}
                        />
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* 未排期任务侧边栏 */}
          <div className={cn(
            "w-72 flex-shrink-0 rounded-2xl border p-4 flex flex-col",
            isDark ? "bg-white/[0.02] border-white/10" : "bg-gray-50 border-gray-200"
          )}>
            <div className="flex items-center gap-2 mb-3">
              <div className={cn(
                "p-2 rounded-lg",
                isDark ? "bg-white/5" : "bg-gray-100"
              )}>
                <Inbox className={cn("w-4 h-4", isDark ? "text-white/50" : "text-gray-500")} />
              </div>
              <div>
                <h3 className={cn("font-semibold text-sm", isDark ? "text-white/80" : "text-gray-700")}>
                  未排期
                </h3>
                <p className={cn("text-xs", isDark ? "text-white/40" : "text-gray-500")}>
                  {unscheduledTasks.length} 个任务
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              <AnimatePresence mode="popLayout">
                {unscheduledTasks.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "text-center py-8 text-sm",
                      isDark ? "text-white/30" : "text-gray-400"
                    )}
                  >
                    所有任务已排期 ✓
                  </motion.div>
                ) : (
                  unscheduledTasks.map(task => (
                    <UnscheduledTaskCard
                      key={task.id}
                      task={task}
                      isDark={isDark}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>

            <div className={cn(
              "mt-3 p-3 rounded-lg text-xs",
              isDark ? "bg-white/5 text-white/40" : "bg-white text-gray-500"
            )}>
              <div className="flex items-start gap-2">
                <CalendarDays className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">拖拽排期</p>
                  <p>拖拽任务到日历格子进行排期</p>
                  <p className="mt-1 opacity-70">
                    有时间信息的任务会在日视图自动显示
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 选中日期信息 */}
        <AnimatePresence>
          {selectedDate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={cn(
                "mt-4 p-4 rounded-xl",
                isDark ? "bg-white/5" : "bg-gray-50"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className={cn("w-4 h-4", isDark ? "text-white/40" : "text-gray-400")} />
                  <span className={cn("text-sm", isDark ? "text-white/60" : "text-gray-600")}>
                    {selectedDate.toLocaleDateString("zh-CN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      weekday: "long",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={cn("text-sm", isDark ? "text-white/40" : "text-gray-400")}>
                    双击查看详情
                  </span>
                  <span className={cn("text-sm font-medium", isDark ? "text-white/60" : "text-gray-600")}>
                    {tasksByDate[formatDate(selectedDate)]?.length || 0} 个任务
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 拖拽预览 */}
      <DragOverlay>
        {draggedTask && (
          <div className={cn(
            "px-3 py-2 rounded-lg shadow-2xl border max-w-[200px]",
            isDark
              ? "bg-[#1a1a24] border-[var(--neon-cyan)]"
              : "bg-white border-blue-500"
          )}>
            <p className={cn(
              "text-sm font-medium truncate",
              isDark ? "text-white" : "text-gray-900"
            )}>
              {draggedTask.content}
            </p>
            {draggedTask.scheduled_time && (
              <p className={cn(
                "text-xs mt-1",
                isDark ? "text-[var(--neon-cyan)]" : "text-blue-600"
              )}>
                <Clock className="w-3 h-3 inline mr-1" />
                {draggedTask.scheduled_time}
              </p>
            )}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
});

export default MonthView;
