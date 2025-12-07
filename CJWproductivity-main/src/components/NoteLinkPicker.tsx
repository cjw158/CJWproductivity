/**
 * @file NoteLinkPicker.tsx
 * @description 笔记链接选择器弹窗
 * 
 * 功能:
 * - 搜索笔记
 * - 显示最近笔记列表
 * - 选择后返回笔记信息用于插入链接
 */

import { useState, useMemo, useCallback, useEffect, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FileText, X, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotes } from "@/hooks/useNotes";
import type { Note } from "@/lib/notes";
import { extractH1Title, stripHtml } from "@/utils";

export interface NoteLinkSelection {
  noteId: number;
  noteTitle: string;
}

interface NoteLinkPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selection: NoteLinkSelection) => void;
  currentNoteId?: number;  // 当前笔记ID，排除自链接
}

export const NoteLinkPicker = memo(function NoteLinkPicker({
  isOpen,
  onClose,
  onSelect,
  currentNoteId,
}: NoteLinkPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  // 获取所有笔记
  const { data: notes = [] } = useNotes("all");
  
  // 过滤和排序笔记
  const filteredNotes = useMemo(() => {
    let result = notes.filter(note => note.id !== currentNoteId);  // 排除当前笔记
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(note => {
        const title = extractH1Title(note.content) || stripHtml(note.content).slice(0, 50);
        return title.toLowerCase().includes(query) || 
               stripHtml(note.content).toLowerCase().includes(query);
      });
    }
    
    // 按更新时间排序
    return result
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 10);  // 最多显示10条
  }, [notes, searchQuery, currentNoteId]);
  
  // 打开时聚焦搜索框
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);
  
  // ESC 关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);
  
  const handleSelectNote = useCallback((note: Note) => {
    const title = extractH1Title(note.content) || stripHtml(note.content).slice(0, 30) || "无标题笔记";
    onSelect({
      noteId: note.id,
      noteTitle: title,
    });
    onClose();
  }, [onSelect, onClose]);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          
          {/* 弹窗 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
            className={cn(
              "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
              "w-[400px] max-h-[500px] rounded-2xl shadow-2xl overflow-hidden",
              isDark 
                ? "bg-[#1a1a24] border border-white/10" 
                : "bg-white border border-gray-200"
            )}
          >
            {/* 头部 */}
            <div className={cn(
              "flex items-center justify-between px-4 py-3 border-b",
              isDark ? "border-white/10" : "border-gray-100"
            )}>
              <div className="flex items-center gap-2">
                <Link2 className={cn("w-4 h-4", isDark ? "text-[var(--neon-cyan)]" : "text-blue-500")} />
                <span className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                  插入笔记链接
                </span>
              </div>
              <button
                onClick={onClose}
                className={cn(
                  "p-1 rounded-lg transition-colors",
                  isDark ? "hover:bg-white/10 text-white/60" : "hover:bg-gray-100 text-gray-400"
                )}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* 搜索框 */}
            <div className={cn("px-4 py-3 border-b", isDark ? "border-white/10" : "border-gray-100")}>
              <div className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg",
                isDark ? "bg-white/5" : "bg-gray-50"
              )}>
                <Search className={cn("w-4 h-4", isDark ? "text-white/40" : "text-gray-400")} />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索笔记..."
                  className={cn(
                    "flex-1 bg-transparent outline-none text-sm",
                    isDark ? "text-white placeholder:text-white/30" : "text-gray-900 placeholder:text-gray-400"
                  )}
                />
              </div>
            </div>
            
            {/* 笔记列表 */}
            <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
              {filteredNotes.length === 0 ? (
                <div className={cn(
                  "flex flex-col items-center justify-center py-12",
                  isDark ? "text-white/30" : "text-gray-400"
                )}>
                  <FileText className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">
                    {searchQuery ? "没有找到匹配的笔记" : "暂无可链接的笔记"}
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {!searchQuery && (
                    <div className={cn(
                      "px-2 py-1 text-xs font-medium mb-1",
                      isDark ? "text-white/40" : "text-gray-500"
                    )}>
                      最近笔记
                    </div>
                  )}
                  {filteredNotes.map((note) => {
                    const title = extractH1Title(note.content) || stripHtml(note.content).slice(0, 40) || "无标题笔记";
                    const preview = stripHtml(note.content).slice(0, 60);
                    
                    return (
                      <button
                        key={note.id}
                        onClick={() => handleSelectNote(note)}
                        className={cn(
                          "w-full text-left px-3 py-2.5 rounded-lg transition-colors group",
                          isDark ? "hover:bg-white/10" : "hover:bg-gray-100"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <FileText className={cn(
                            "w-4 h-4 mt-0.5 flex-shrink-0",
                            isDark ? "text-[var(--color-memo)]" : "text-blue-500"
                          )} />
                          <div className="flex-1 min-w-0">
                            <div className={cn(
                              "font-medium text-sm truncate",
                              isDark ? "text-white" : "text-gray-900"
                            )}>
                              {title}
                            </div>
                            <div className={cn(
                              "text-xs truncate mt-0.5",
                              isDark ? "text-white/40" : "text-gray-500"
                            )}>
                              {preview}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* 底部提示 */}
            <div className={cn(
              "px-4 py-2 text-xs border-t",
              isDark ? "border-white/10 text-white/30" : "border-gray-100 text-gray-400"
            )}>
              点击选择笔记 · 仅在浏览模式下可跳转
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
