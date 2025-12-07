/**
 * @file NoteExportMenu.tsx
 * @description 笔记导出下拉菜单组件
 */

import { memo, useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { exportNote, exportFormats, type ExportFormat } from "@/utils/noteExport";
import type { Note } from "@/lib/notes";
import { toast } from "@/hooks/useToast";
import { useLanguage } from "@/contexts/LanguageContext";

interface NoteExportMenuProps {
  note: Note;
  isDark: boolean;
}

export const NoteExportMenu = memo(function NoteExportMenu({ 
  note, 
  isDark 
}: NoteExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<ExportFormat | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // 处理导出
  const handleExport = useCallback(async (format: ExportFormat) => {
    setIsExporting(format);
    try {
      const filename = await exportNote(note, format, isDark);
      toast({ 
        title: t("notes.exportSuccess"), 
        description: `📁 ${filename} → ${t("notes.downloadFolder")}`,
        variant: "success" 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Export failed:", errorMessage, error);
      toast({ title: `${t("notes.exportFailed")}: ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsExporting(null);
      setIsOpen(false);
    }
  }, [note, isDark, t]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-2 rounded-lg transition-colors",
          isOpen
            ? isDark ? "bg-green-500/20 text-green-400" : "bg-green-50 text-green-600"
            : isDark ? "hover:bg-white/5 text-white/40" : "hover:bg-gray-100 text-gray-400"
        )}
        title={t("notes.export")}
      >
        <Download className="w-4 h-4" />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute right-0 top-full mt-1 z-50 min-w-[160px] rounded-lg border shadow-xl overflow-hidden",
              isDark 
                ? "bg-[#1a1a1f] border-white/10" 
                : "bg-white border-gray-200"
            )}
          >
            <div className={cn(
              "px-3 py-2 text-xs font-medium border-b",
              isDark ? "text-white/40 border-white/5" : "text-gray-400 border-gray-100"
            )}>
              {t("notes.exportAs")}
            </div>
            {exportFormats.map((format) => (
              <button
                key={format.value}
                onClick={() => handleExport(format.value)}
                disabled={isExporting !== null}
                className={cn(
                  "w-full px-3 py-2.5 text-sm text-left transition-colors flex items-center gap-3",
                  isDark 
                    ? "text-white/80 hover:bg-white/5" 
                    : "text-gray-700 hover:bg-gray-50",
                  isExporting === format.value && "opacity-50"
                )}
              >
                <span className="text-base">{format.icon}</span>
                <span className="flex-1">{format.label}</span>
                <span className={cn(
                  "text-xs",
                  isDark ? "text-white/30" : "text-gray-400"
                )}>
                  {format.ext}
                </span>
                {isExporting === format.value && (
                  <Loader2 className="w-3 h-3 animate-spin" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
