import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Check, Trash2, GripVertical, Clock, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompleteTask, useDeleteTask } from "@/hooks/useTasks";
import { useTheme } from "@/contexts/ThemeContext";
import { useFocus } from "@/contexts/FocusContext";
import { useTaskSelection } from "@/contexts/TaskSelectionContext";
import { SpotlightCard, Explosion, LivelyIcon } from "@/components/ui/visual-effects";
import type { Task } from "@/lib/tasks";
import { useState } from "react";

type TaskCardVariant = "standard" | "compact" | "timeblock";

interface UnifiedTaskCardProps {
  task: Task;
  variant?: TaskCardVariant;
  isDragging?: boolean;
  showDragHandle?: boolean;
  showTimeTags?: boolean;
  onComplete?: () => void;
  onDelete?: () => void;
}

export const UnifiedTaskCard = memo(function UnifiedTaskCard({
  task,
  variant = "standard",
  isDragging: externalDragging,
  showDragHandle = true,
  showTimeTags = true,
}: UnifiedTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();
  const { startFocus } = useFocus();
  const { selectedTaskIds, toggleTaskSelection, openContextMenu } = useTaskSelection();

  const { theme } = useTheme();
  const isDark = theme === "dark";
  const isSelected = selectedTaskIds.has(task.id);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isCurrentlyDragging = externalDragging || isSortableDragging;
  const isDone = task.status === "DONE";

  const [explosion, setExplosion] = useState<{ show: boolean; x: number; y: number }>({ show: false, x: 0, y: 0 });

  const handleComplete = (e: React.MouseEvent) => {
    if (!isDone) {
      setExplosion({ show: true, x: e.clientX, y: e.clientY });
      setTimeout(() => setExplosion(prev => ({ ...prev, show: false })), 800);
      completeTask.mutate(task.id);
    }
  };

  // 右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    openContextMenu(e.clientX, e.clientY, task);
  };

  // Shift+Click 批量选择
  const handleCardClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      toggleTaskSelection(task.id, true);
    }
  };


  // 紧凑模式（矩阵/日历任务池）
  if (variant === "compact") {
    return (
      <motion.div
        ref={setNodeRef}
        style={style}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: isCurrentlyDragging ? 0.5 : 1, scale: 1 }}
        onContextMenu={handleContextMenu}
        onClick={handleCardClick}
        className={cn(
          "group p-2.5 rounded-lg border-l-3 cursor-grab active:cursor-grabbing transition-all",
          isDark 
            ? "bg-white/5 border border-white/10 hover:bg-white/10" 
            : "bg-white border border-gray-200 hover:shadow-sm",
            isCurrentlyDragging && "shadow-lg z-50",
          isDone && "opacity-50",
          isSelected && (isDark ? "ring-2 ring-[var(--neon-cyan)] bg-[var(--neon-cyan)]/10" : "ring-2 ring-blue-500 bg-blue-50")
        )}
        {...listeners}
        {...attributes}
      >
        <div className="flex items-start gap-2">
          {/* 完成按钮 */}
          <button
            onClick={handleComplete}
            className={cn(
              "mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 transition-all",
              "flex items-center justify-center",
              isDone
                ? "bg-green-500 border-green-500"
                : isDark ? "border-white/30 hover:border-white/50" : "border-gray-300 hover:border-gray-400"
            )}
          >
            {isDone && <Check className="w-2.5 h-2.5 text-white" />}
          </button>

          {/* 内容 */}
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-sm leading-snug line-clamp-2",
              isDark ? "text-white/90" : "text-gray-800",
              isDone && "line-through opacity-50"
            )}>
              {task.content}
            </p>
            
            {/* 标签行 */}
            {showTimeTags && (task.duration || task.scheduled_time) && (
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {task.duration && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5",
                    isDark ? "bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)]" : "bg-sky-100 text-sky-600"
                  )}>
                    <Clock className="w-2.5 h-2.5" />
                    {task.duration >= 60 ? `${task.duration / 60}h` : `${task.duration}m`}
                  </span>
                )}
                {task.scheduled_time && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded",
                    isDark ? "bg-[var(--neon-green)]/10 text-[var(--neon-green)]" : "bg-green-100 text-green-600"
                  )}>
                    {task.scheduled_time}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 删除按钮 */}
          <button
            onClick={() => deleteTask.mutate(task.id)}
            className={cn(
              "p-1 rounded opacity-0 group-hover:opacity-100 transition-all",
              isDark 
                ? "text-white/30 hover:text-red-400 hover:bg-white/10" 
                : "text-gray-400 hover:text-red-500 hover:bg-gray-100"
            )}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    );
  }

  // 标准模式（看板）- 使用 SpotlightCard
  return (
    <motion.div
      ref={setNodeRef}
      style={{
        ...style,
        zIndex: isCurrentlyDragging ? 999 : "auto",
      }}
      initial={false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      onContextMenu={handleContextMenu}
      onClick={handleCardClick}
      className={cn(
        "relative rounded-xl",
        isCurrentlyDragging && "opacity-50 scale-105 shadow-xl",
        isDone && "opacity-40",
        isSelected && (isDark ? "ring-2 ring-[var(--neon-cyan)]" : "ring-2 ring-blue-500")
      )}
    >
      <SpotlightCard
        className={cn(
          "p-3 transition-all duration-200 h-full",
          isDark 
            ? "bg-black/40 border-white/5" 
            : "bg-white border-gray-200 shadow-sm",
        )}
        enableTilt={!isCurrentlyDragging}
      >
        <div className="flex items-start gap-2">
          {/* 拖拽手柄 */}
          {showDragHandle && (
            <button
              className={cn(
                "mt-1 p-0.5 cursor-grab active:cursor-grabbing transition-colors touch-none",
                isDark ? "text-white/20 hover:text-white/40" : "text-gray-300 hover:text-gray-400"
              )}
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-4 h-4" />
            </button>
          )}

          {/* 完成按钮 */}
          <button
            onClick={handleComplete}
            className={cn(
              "mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all duration-200",
              "flex items-center justify-center group/check",
              isDone
                ? "bg-[var(--neon-green)] border-[var(--neon-green)]"
                : isDark 
                  ? "border-white/20 hover:border-[var(--neon-green)]" 
                  : "border-gray-300 hover:border-green-500"
            )}
          >
            <LivelyIcon animation="pulse">
              <Check className={cn(
                "w-3 h-3",
                isDone ? "text-white" : "text-transparent group-hover/check:text-[var(--neon-green)]"
              )} />
            </LivelyIcon>
          </button>

          {/* 内容区域 */}
          <div className="flex-1 min-w-0">
            <p className={cn(
              "text-sm leading-relaxed break-words transition-colors",
              isDark ? "text-white/90" : "text-gray-800",
              isDone && (isDark ? "line-through text-white/40" : "line-through text-gray-400")
            )}>
              {task.content}
            </p>
            
            {/* 标签 */}
            {showTimeTags && (task.duration || task.scheduled_time) && (
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {task.duration && (
                  <span 
                    className="text-xs flex items-center gap-1 px-1.5 py-0.5 rounded"
                    style={{
                      color: isDark ? "var(--neon-cyan)" : "#0ea5e9",
                      background: isDark ? "rgba(0, 255, 255, 0.1)" : "rgba(14, 165, 233, 0.1)",
                      border: `1px solid ${isDark ? "rgba(0, 255, 255, 0.2)" : "rgba(14, 165, 233, 0.2)"}`,
                    }}
                  >
                    <Clock className="w-3 h-3" /> 
                    {task.duration >= 60 ? `${task.duration / 60}h` : `${task.duration}m`}
                  </span>
                )}
                {task.scheduled_time && (
                  <span 
                    className="text-xs flex items-center gap-1 px-1.5 py-0.5 rounded"
                    style={{
                      color: isDark ? "var(--neon-green)" : "#22c55e",
                      background: isDark ? "rgba(0, 255, 136, 0.1)" : "rgba(34, 197, 94, 0.1)",
                      border: `1px solid ${isDark ? "rgba(0, 255, 136, 0.2)" : "rgba(34, 197, 94, 0.2)"}`,
                    }}
                  >
                    {task.scheduled_time}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isDone && (
              <button
                onClick={() => startFocus(task)}
                className={cn(
                  "h-7 w-7 rounded-lg flex items-center justify-center transition-all",
                  isDark 
                    ? "text-white/30 hover:text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/10"
                    : "text-gray-400 hover:text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/10"
                )}
                title="专注模式"
              >
                <LivelyIcon animation="pulse">
                  <Play className="w-3.5 h-3.5" />
                </LivelyIcon>
              </button>
            )}
            <button
              onClick={() => deleteTask.mutate(task.id)}
              className={cn(
                "h-7 w-7 rounded-lg flex items-center justify-center transition-all",
                isDark 
                  ? "text-white/30 hover:text-[var(--neon-red)] hover:bg-[var(--neon-red)]/10"
                  : "text-gray-400 hover:text-[var(--neon-red)] hover:bg-[var(--neon-red)]/10"
              )}
            >
              <LivelyIcon animation="shake">
                <Trash2 className="w-3.5 h-3.5" />
              </LivelyIcon>
            </button>
          </div>
        </div>
      </SpotlightCard>
      <Explosion active={explosion.show} x={explosion.x} y={explosion.y} />
    </motion.div>
  );
});

// 静态版本（用于壁纸渲染）
export const UnifiedTaskCardStatic = memo(function UnifiedTaskCardStatic({ task }: { task: Task }) {
  const isDone = task.status === "DONE";
  
  return (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-lg",
      isDone && "opacity-50"
    )}>
      <div className={cn(
        "flex-shrink-0 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center",
        isDone ? "bg-green-500 border-green-500" : "border-white/40"
      )}>
        {isDone && <Check className="w-2 h-2 text-white" />}
      </div>
      <p className={cn(
        "text-white text-sm truncate",
        isDone && "line-through text-white/50"
      )}>
        {task.content}
      </p>
    </div>
  );
});
