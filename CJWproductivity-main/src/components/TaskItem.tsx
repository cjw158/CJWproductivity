import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Check, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCompleteTask, useDeleteTask } from "@/hooks/useTasks";
import type { Task } from "@/lib/tasks";

interface TaskItemProps {
  task: Task;
  isDragging?: boolean;
}

export function TaskItem({ task, isDragging }: TaskItemProps) {
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isCurrentlyDragging = isDragging || isSortableDragging;
  const isDone = task.status === "DONE";

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      className={cn(
        "task-item group",
        isCurrentlyDragging && "task-item-dragging opacity-90",
        isDone && "opacity-60"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <button
          className="mt-1 p-1 cursor-grab active:cursor-grabbing text-white/30 hover:text-white/60 transition-colors touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Complete Button */}
        <button
          onClick={() => !isDone && completeTask.mutate(task.id)}
          className={cn(
            "mt-1 flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all duration-200",
            "flex items-center justify-center",
            isDone
              ? "bg-green-500 border-green-500"
              : "border-white/30 hover:border-white/60"
          )}
        >
          {isDone && <Check className="w-3 h-3 text-white" />}
        </button>

        {/* Task Text */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-white text-sm leading-relaxed break-words",
              isDone && "line-through text-white/50"
            )}
          >
            {task.content}
          </p>
        </div>

        {/* Delete Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 text-white/30 hover:text-red-400 hover:bg-red-500/20 transition-all"
          onClick={() => deleteTask.mutate(task.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// Non-draggable version for wallpaper rendering
export function TaskItemStatic({ task }: { task: Task }) {
  const isDone = task.status === "DONE";
  
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg",
        isDone && "opacity-60"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-4 h-4 rounded-full border-2",
          "flex items-center justify-center",
          isDone
            ? "bg-green-500 border-green-500"
            : "border-white/40"
        )}
      >
        {isDone && <Check className="w-2.5 h-2.5 text-white" />}
      </div>
      <p
        className={cn(
          "text-white text-sm",
          isDone && "line-through text-white/50"
        )}
      >
        {task.content}
      </p>
    </div>
  );
}
