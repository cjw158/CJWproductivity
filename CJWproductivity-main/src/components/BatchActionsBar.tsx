import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Trash2, type LucideIcon } from "lucide-react";
import { useTaskSelection } from "@/contexts/TaskSelectionContext";
import { useDeleteTask, useCompleteTask } from "@/hooks/useTasks";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/useToast";

export const BatchActionsBar = memo(function BatchActionsBar() {
  const { selectedTaskIds, isSelecting, clearSelection } = useTaskSelection();
  const deleteTask = useDeleteTask();
  const completeTask = useCompleteTask();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const selectedCount = selectedTaskIds.size;

  const handleBatchComplete = () => {
    selectedTaskIds.forEach(id => {
      completeTask.mutate(id);
    });
    clearSelection();
    toast({ title: `已完成 ${selectedCount} 项任务`, variant: "success" });
  };

  const handleBatchDelete = () => {
    selectedTaskIds.forEach(id => {
      deleteTask.mutate(id);
    });
    clearSelection();
    toast({ title: `已删除 ${selectedCount} 项任务`, variant: "default" });
  };

  return (
    <AnimatePresence>
      {isSelecting && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={cn(
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]",
            "flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl",
            isDark 
              ? "bg-gray-900/90 border-white/10" 
              : "bg-white/90 border-gray-200"
          )}
        >
          {/* 选中数量 */}
          <div className={cn(
            "flex items-center gap-2 pr-3 border-r",
            isDark ? "border-white/10" : "border-gray-200"
          )}>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-bold",
              isDark ? "bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)]" : "bg-blue-100 text-blue-600"
            )}>
              {selectedCount}
            </span>
            <span className={cn("text-sm", isDark ? "text-white/60" : "text-gray-600")}>
              已选中
            </span>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-1">
            <ActionButton 
              icon={Check} 
              label="完成" 
              onClick={handleBatchComplete}
              isDark={isDark}
              color="green"
            />
            <ActionButton 
              icon={Trash2} 
              label="删除" 
              onClick={handleBatchDelete}
              isDark={isDark}
              color="red"
            />
          </div>

          {/* 取消按钮 */}
          <button
            onClick={clearSelection}
            className={cn(
              "ml-2 p-2 rounded-lg transition-colors",
              isDark 
                ? "text-white/40 hover:text-white hover:bg-white/10" 
                : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            )}
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// 操作按钮组件
function ActionButton({ 
  icon: Icon, 
  label, 
  onClick, 
  isDark,
  color 
}: { 
  icon: LucideIcon; 
  label: string; 
  onClick: () => void;
  isDark: boolean;
  color?: "green" | "cyan" | "yellow" | "red";
}) {
  const colorClasses = {
    green: isDark ? "hover:bg-green-500/20 hover:text-green-400" : "hover:bg-green-100 hover:text-green-600",
    cyan: isDark ? "hover:bg-[var(--neon-cyan)]/20 hover:text-[var(--neon-cyan)]" : "hover:bg-blue-100 hover:text-blue-600",
    yellow: isDark ? "hover:bg-[var(--neon-yellow)]/20 hover:text-[var(--neon-yellow)]" : "hover:bg-amber-100 hover:text-amber-600",
    red: isDark ? "hover:bg-red-500/20 hover:text-red-400" : "hover:bg-red-100 hover:text-red-600",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        isDark ? "text-white/60" : "text-gray-600",
        color ? colorClasses[color] : (isDark ? "hover:bg-white/10" : "hover:bg-gray-100")
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
