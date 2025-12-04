import { memo, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Copy, Trash2, Edit3, Calendar, Clock, Timer, X, ChevronUp, ChevronDown } from "lucide-react";
import { useTaskSelection } from "@/contexts/TaskSelectionContext";
import { useTaskActions } from "@/contexts/TaskActionsContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/useToast";

// 滚轮数值选择器
const WheelPicker = memo(function WheelPicker({ value, onChange, min, max, step = 1, format, color }: { value: number; onChange: (v: number) => void; min: number; max: number; step?: number; format: (v: number) => string; color: string }) {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -step : step;
      onChange(Math.max(min, Math.min(max, value + delta)));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [value, onChange, min, max, step]);
  
  return (
    <div ref={ref} className="flex flex-col items-center select-none">
      <button onClick={() => onChange(Math.min(max, value + step))} className="p-0.5 rounded opacity-40 hover:opacity-80"><ChevronUp className="w-3.5 h-3.5" /></button>
      <div className="text-lg font-bold tabular-nums cursor-ns-resize" style={{ color }} title="滚动滚轮调整">{format(value)}</div>
      <button onClick={() => onChange(Math.max(min, value - step))} className="p-0.5 rounded opacity-40 hover:opacity-80"><ChevronDown className="w-3.5 h-3.5" /></button>
    </div>
  );
});

export const TaskContextMenu = memo(function TaskContextMenu() {
  const { contextMenu, closeContextMenu } = useTaskSelection();
  const { toggleTask, deleteTask, updateTask } = useTaskActions();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const menuRef = useRef<HTMLDivElement>(null);
  const [editMode, setEditMode] = useState<"content" | "date" | "time" | "duration" | null>(null);
  const [editValue, setEditValue] = useState("");
  // 日期滚轮状态
  const [editYear, setEditYear] = useState(2025);
  const [editMonth, setEditMonth] = useState(1);
  const [editDay, setEditDay] = useState(1);
  // 时间滚轮状态
  const [editHour, setEditHour] = useState(9);
  const [editMinute, setEditMinute] = useState(0);
  // 时长状态（分钟）
  const [editDuration, setEditDuration] = useState(30);

  const color = isDark ? "#22d3ee" : "#3b82f6";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
        setEditMode(null);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") { closeContextMenu(); setEditMode(null); }
    };
    if (contextMenu.isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [contextMenu.isOpen, closeContextMenu]);

  useEffect(() => {
    if (!contextMenu.isOpen) setEditMode(null);
  }, [contextMenu.isOpen]);

  const task = contextMenu.task;
  if (!task) return null;

  const handleComplete = async () => { await toggleTask(task); closeContextMenu(); };
  const handleDelete = async () => { await deleteTask(task.id); closeContextMenu(); };
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(task.content); toast({ title: "已复制", variant: "success" }); }
    catch { toast({ title: "复制失败", variant: "destructive" }); }
    closeContextMenu();
  };

  const handleEditContent = () => { setEditValue(task.content); setEditMode("content"); };
  
  const handleEditDate = () => {
    const d = task.due_date ? new Date(task.due_date) : new Date();
    setEditYear(d.getFullYear());
    setEditMonth(d.getMonth() + 1);
    setEditDay(d.getDate());
    setEditMode("date");
  };
  
  const handleEditTime = () => {
    if (task.scheduled_time) {
      const [h, m] = task.scheduled_time.split(":").map(Number);
      setEditHour(h);
      setEditMinute(m);
    } else {
      setEditHour(9);
      setEditMinute(0);
    }
    setEditMode("time");
  };
  
  const handleEditDuration = () => {
    setEditDuration(task.duration || 30);
    setEditMode("duration");
  };

  const handleSaveEdit = async () => {
    let success = false;
    if (editMode === "content" && editValue.trim()) {
      success = await updateTask(task.id, { content: editValue.trim() });
    } else if (editMode === "date") {
      const dateStr = `${editYear}-${editMonth.toString().padStart(2, "0")}-${editDay.toString().padStart(2, "0")}`;
      success = await updateTask(task.id, { due_date: dateStr });
    } else if (editMode === "time") {
      const timeStr = `${editHour.toString().padStart(2, "0")}:${editMinute.toString().padStart(2, "0")}`;
      success = await updateTask(task.id, { scheduled_time: timeStr });
    } else if (editMode === "duration") {
      success = await updateTask(task.id, { duration: editDuration });
    }
    if (success) { toast({ title: "已更新", variant: "success" }); closeContextMenu(); setEditMode(null); }
  };

  // 获取当月天数
  const daysInMonth = new Date(editYear, editMonth, 0).getDate();
  if (editDay > daysInMonth) setEditDay(daysInMonth);

  let { x, y } = contextMenu;
  const menuWidth = 240;
  const menuHeight = editMode ? 180 : 300;
  if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
  if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 10;

  return (
    <AnimatePresence>
      {contextMenu.isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.1 }}
          className={cn("fixed z-[9999] w-60 py-2 rounded-xl overflow-hidden shadow-2xl border backdrop-blur-xl", isDark ? "bg-gray-900/95 border-white/10" : "bg-white/95 border-gray-200")}
          style={{ left: x, top: y }}
        >
          {editMode ? (
            <div className="px-3 py-2">
              <div className="flex items-center justify-between mb-3">
                <span className={cn("text-xs font-medium", isDark ? "text-white/60" : "text-gray-500")}>
                  {editMode === "content" ? "编辑内容" : editMode === "date" ? "修改日期" : editMode === "time" ? "修改时间" : "修改时长"}
                </span>
                <button onClick={() => setEditMode(null)} className={cn("p-1 rounded-lg", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}><X className="w-3.5 h-3.5" /></button>
              </div>
              
              {editMode === "content" ? (
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className={cn("w-full px-3 py-2 rounded-lg text-sm resize-none border", isDark ? "bg-white/5 border-white/10 text-white" : "bg-gray-50 border-gray-200 text-gray-900")}
                  rows={3}
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); } }}
                />
              ) : editMode === "date" ? (
                <div className="flex items-center justify-center gap-2">
                  <WheelPicker value={editYear} onChange={setEditYear} min={2020} max={2030} format={(v) => `${v}`} color={color} />
                  <span style={{ color }} className="text-lg font-bold">年</span>
                  <WheelPicker value={editMonth} onChange={setEditMonth} min={1} max={12} format={(v) => v.toString().padStart(2, "0")} color={color} />
                  <span style={{ color }} className="text-lg font-bold">月</span>
                  <WheelPicker value={editDay} onChange={setEditDay} min={1} max={daysInMonth} format={(v) => v.toString().padStart(2, "0")} color={color} />
                  <span style={{ color }} className="text-lg font-bold">日</span>
                </div>
              ) : editMode === "time" ? (
                <div className="flex items-center justify-center gap-2">
                  <WheelPicker value={editHour} onChange={setEditHour} min={0} max={23} format={(v) => v.toString().padStart(2, "0")} color={color} />
                  <span style={{ color }} className="text-2xl font-bold">:</span>
                  <WheelPicker value={editMinute} onChange={setEditMinute} min={0} max={55} step={5} format={(v) => v.toString().padStart(2, "0")} color={color} />
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <WheelPicker value={editDuration} onChange={setEditDuration} min={5} max={480} step={5} format={(v) => `${v}`} color={color} />
                  <span style={{ color }} className="text-lg font-bold">分钟</span>
                </div>
              )}
              
              <button onClick={handleSaveEdit} className={cn("w-full mt-3 py-1.5 rounded-lg text-sm font-medium border transition-colors", isDark ? "border-[var(--neon-cyan)]/50 text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/10" : "border-blue-400 text-blue-500 hover:bg-blue-50")}>保存</button>
            </div>
          ) : (
            <>
              <div className={cn("px-3 py-2 text-xs truncate border-b mb-1", isDark ? "text-white/50 border-white/10" : "text-gray-400 border-gray-100")}>{task.content.slice(0, 30)}{task.content.length > 30 ? "..." : ""}</div>
              <MenuItem icon={Edit3} label="编辑内容" onClick={handleEditContent} isDark={isDark} />
              <MenuItem icon={Calendar} label="修改日期" onClick={handleEditDate} isDark={isDark} subLabel={task.due_date || "未设置"} />
              <MenuItem icon={Clock} label="修改时间" onClick={handleEditTime} isDark={isDark} subLabel={task.scheduled_time || "未设置"} />
              <MenuItem icon={Timer} label="修改时长" onClick={handleEditDuration} isDark={isDark} subLabel={task.duration ? `${task.duration}分钟` : "未设置"} />
              <div className={cn("my-1 h-px mx-2", isDark ? "bg-white/10" : "bg-gray-200")} />
              {task.status !== "DONE" && <MenuItem icon={Check} label="标记完成" onClick={handleComplete} isDark={isDark} />}
              <MenuItem icon={Copy} label="复制内容" onClick={handleCopy} isDark={isDark} />
              <div className={cn("my-1 h-px mx-2", isDark ? "bg-white/10" : "bg-gray-200")} />
              <MenuItem icon={Trash2} label="删除任务" onClick={handleDelete} isDark={isDark} danger />
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

function MenuItem({ icon: Icon, label, onClick, isDark, danger, subLabel }: { icon: React.ElementType; label: string; onClick: () => void; isDark: boolean; danger?: boolean; subLabel?: string }) {
  return (
    <button onClick={onClick} className={cn("flex items-center justify-between w-full px-3 py-1.5 text-sm text-left transition-colors", danger ? "text-red-500 hover:bg-red-500/10" : isDark ? "text-white/80 hover:bg-white/10" : "text-gray-700 hover:bg-gray-100")}>
      <div className="flex items-center gap-2"><Icon className="w-4 h-4" /><span>{label}</span></div>
      {subLabel && <span className={cn("text-[10px]", isDark ? "text-white/30" : "text-gray-400")}>{subLabel}</span>}
    </button>
  );
}