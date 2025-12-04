/**
 * @file UnscheduledList.tsx
 * @description 未排期任务列表 - 优化版
 * 
 * 设计参考:
 * - Linear: 拖拽磁吸效果
 * - Notion: 清晰的拖拽提示
 * 
 * 特性:
 * - 可拖拽任务卡片
 * - 拖拽时的视觉反馈
 * - 优雅的空状态
 */

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDraggable } from "@dnd-kit/core";
import { GripVertical, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

// ============ 类型 ============

interface UnscheduledListProps {
  tasks: Task[];
  isDark: boolean;
}

interface DraggableCardProps {
  task: Task;
  isDark: boolean;
}

// ============ 可拖拽卡片 ============

const DraggableCard = memo(function DraggableCard({ task, isDark }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `unscheduled-${task.id}`,
    data: { task },
  });

  const transformStyle = transform
    ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
    : undefined;

  return (
    <motion.div
      ref={setNodeRef}
      style={{ transform: transformStyle }}
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ 
        opacity: isDragging ? 0.6 : 1, 
        x: 0,
        scale: isDragging ? 1.02 : 1,
        rotate: isDragging ? 2 : 0,
      }}
      exit={{ opacity: 0, x: 20, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "group relative px-3 py-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing",
        isDark 
          ? "bg-white/[0.04] border-white/10 hover:bg-white/[0.06] hover:border-white/15" 
          : "bg-white border-gray-200 hover:shadow-md hover:border-gray-300",
        isDragging && cn(
          "shadow-2xl z-50",
          isDark 
            ? "border-[var(--neon-cyan)] bg-[#1a1a24]" 
            : "border-blue-400 bg-white"
        )
      )}
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start gap-3">
        {/* 拖拽手柄 */}
        <GripVertical
          className={cn(
            "w-4 h-4 mt-0.5 flex-shrink-0 transition-opacity",
            isDragging
              ? isDark ? "text-[var(--neon-cyan)]" : "text-blue-500"
              : "opacity-30 group-hover:opacity-60",
            isDark ? "text-white" : "text-gray-500"
          )}
        />

        {/* 任务内容 */}
        <p
          className={cn(
            "flex-1 text-sm leading-relaxed",
            isDark ? "text-white/85" : "text-gray-800"
          )}
        >
          {task.content}
        </p>

      </div>

      {/* 拖拽时的光晕 */}
      {isDragging && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            "absolute inset-0 rounded-xl pointer-events-none",
            isDark 
              ? "shadow-[0_0_30px_rgba(0,255,255,0.3)]" 
              : "shadow-[0_0_30px_rgba(59,130,246,0.3)]"
          )}
        />
      )}
    </motion.div>
  );
});

// ============ 空状态 ============

function EmptyState({ isDark }: { isDark: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      <motion.div
        animate={{ 
          y: [0, -5, 0],
          rotate: [0, -5, 5, 0]
        }}
        transition={{ duration: 3, repeat: Infinity }}
        className={cn(
          "w-14 h-14 rounded-xl flex items-center justify-center mb-4",
          isDark 
            ? "bg-gradient-to-br from-green-500/10 to-emerald-500/10" 
            : "bg-gradient-to-br from-green-50 to-emerald-50"
        )}
      >
        <PartyPopper
          className={cn(
            "w-7 h-7",
            isDark ? "text-green-400/60" : "text-green-500"
          )}
        />
      </motion.div>
      
      <p className={cn(
        "text-sm font-medium mb-1",
        isDark ? "text-white/50" : "text-gray-600"
      )}>
        所有任务已排期
      </p>
      
      <p className={cn(
        "text-xs",
        isDark ? "text-white/30" : "text-gray-400"
      )}>
        干得漂亮！
      </p>
    </motion.div>
  );
}

// ============ 主组件 ============

export const UnscheduledList = memo(function UnscheduledList({
  tasks,
  isDark,
}: UnscheduledListProps) {
  if (tasks.length === 0) {
    return <EmptyState isDark={isDark} />;
  }

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {tasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <DraggableCard task={task} isDark={isDark} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});

export default UnscheduledList;
