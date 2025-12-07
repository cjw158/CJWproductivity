/**
 * @file NoteEditorToolbar.tsx
 * @description 笔记编辑器顶部工具栏组件
 */

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Edit3, 
  Eye, 
  Maximize2, 
  Minimize2, 
  Trash2, 
  Columns2, 
  Square 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { getRelativeTime } from "@/utils/timeUtils";
import type { Note } from "@/lib/notes";
import { NoteExportMenu } from "./NoteExportMenu";
import { LivelyIcon } from "@/components/ui/visual-effects";

interface NoteEditorToolbarProps {
  note: Note;
  isDark: boolean;
  isEditing: boolean;
  onToggleEditing: () => void;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  isDualPage: boolean;
  onToggleDualPage: () => void;
  onDelete: () => void;
  // 宽度调节
  widthPercent: number;
  onWidthChange: (width: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

export const NoteEditorToolbar = memo(function NoteEditorToolbar({
  note,
  isDark,
  isEditing,
  onToggleEditing,
  isFullScreen,
  onToggleFullScreen,
  isDualPage,
  onToggleDualPage,
  onDelete,
  widthPercent,
  onWidthChange,
  onDragStart,
  onDragEnd,
}: NoteEditorToolbarProps) {
  const { t, language } = useLanguage();

  return (
    <div className={cn(
      "flex-none h-14 px-8 flex items-center justify-between transition-all duration-300",
      isEditing
        ? (isDark ? "border-b border-white/5 bg-[#1a1a1f]" : "border-b border-gray-100 bg-white")
        : (isDark ? "bg-[#1a1a1f]/50" : "bg-gray-50/50")
    )}>
      {/* 左侧信息 */}
      <div className="flex items-center gap-4">
        <div className={cn("text-xs", isDark ? "text-white/30" : "text-gray-400")}>
          {t("notes.lastEdited")}: {getRelativeTime(note.updated_at, language)}
        </div>
        <div className={cn("w-px h-3", isDark ? "bg-white/10" : "bg-gray-300")} />
        <div className={cn("text-xs", isDark ? "text-white/30" : "text-gray-400")}>
          {note.content.replace(/<[^>]+>/g, "").replace(/\s+/g, "").length} {t("notes.words")}
        </div>
      </div>
      
      {/* 右侧按钮组 */}
      <div className="flex items-center gap-2">
        {/* 导出按钮 */}
        <NoteExportMenu note={note} isDark={isDark} />

        {/* 浏览模式：宽度调节滑块 - 双页模式时隐藏 */}
        <AnimatePresence>
          {!isEditing && !isDualPage && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center overflow-hidden"
            >
              <div className="flex items-center mx-1 group relative" title="阅读宽度">
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={widthPercent}
                  onChange={(e) => onWidthChange(Number(e.target.value))}
                  onPointerDown={onDragStart}
                  onPointerUp={onDragEnd}
                  className={cn(
                    "w-20 h-1.5 rounded-lg appearance-none cursor-pointer",
                    isDark 
                      ? "bg-white/10 accent-cyan-500" 
                      : "bg-gray-300 accent-cyan-600"
                  )}
                />
              </div>
              <div className={cn("w-px h-4 mx-1", isDark ? "bg-white/10" : "bg-gray-200")} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* 模式切换 */}
        <button
          onClick={onToggleEditing}
          className={cn(
            "p-2 rounded-lg transition-colors",
            isEditing 
              ? isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-50 text-blue-600"
              : isDark ? "hover:bg-white/5 text-white/40" : "hover:bg-gray-100 text-gray-400"
          )}
          title={isEditing ? t("notes.view") : t("notes.edit")}
        >
          {isEditing ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>

        {/* 双页模式切换 - 仅全屏时显示 */}
        <AnimatePresence>
          {isFullScreen && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, width: 0 }}
              animate={{ opacity: 1, scale: 1, width: "auto" }}
              exit={{ opacity: 0, scale: 0.8, width: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onToggleDualPage}
              className={cn(
                "p-2 rounded-lg transition-colors overflow-hidden",
                isDualPage
                  ? isDark ? "bg-purple-500/20 text-purple-400" : "bg-purple-50 text-purple-600"
                  : isDark ? "hover:bg-white/5 text-white/40" : "hover:bg-gray-100 text-gray-400"
              )}
              title={isDualPage ? "单页模式" : "双页模式"}
            >
              {isDualPage ? <Square className="w-4 h-4" /> : <Columns2 className="w-4 h-4" />}
            </motion.button>
          )}
        </AnimatePresence>

        {/* 全屏切换 */}
        <button
          onClick={onToggleFullScreen}
          className={cn(
            "p-2 rounded-lg transition-colors",
            isDark ? "hover:bg-white/5 text-white/40" : "hover:bg-gray-100 text-gray-400"
          )}
          title={isFullScreen ? t("notes.exitFullscreen") : t("notes.fullscreen")}
        >
          {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        <div className={cn("w-px h-4 mx-1", isDark ? "bg-white/10" : "bg-gray-200")} />

        {/* 删除按钮 */}
        <button 
          onClick={onDelete}
          className={cn(
            "p-2 rounded-lg transition-colors group",
            isDark ? "hover:bg-red-500/10 text-white/40 hover:text-red-400" : "hover:bg-red-50 text-gray-400 hover:text-red-500"
          )}
          title={t("notes.deleteNote")}
        >
          <LivelyIcon animation="shake">
            <Trash2 className="w-4 h-4" />
          </LivelyIcon>
        </button>
      </div>
    </div>
  );
});
