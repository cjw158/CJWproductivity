/**
 * @file components/IslandCapture.tsx
 * @description 灵动岛快速捕获组件 - 快速记录文本和图片
 */

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, FileText, Plus, Camera, X } from "lucide-react";
import { stripHtml } from "@/utils";
import { SYSTEM_FONT } from "../constants";
import type { IslandColors } from "../constants";
import type { NoteMode } from "../types";

interface IslandCaptureProps {
  captureText: string;
  setCaptureText: (text: string) => void;
  capturedImage: string | null;
  setCapturedImage: (image: string | null) => void;
  isSaving: boolean;
  showNoteSelector: boolean;
  setShowNoteSelector: (show: boolean) => void;
  noteMode: NoteMode;
  setNoteMode: (mode: NoteMode) => void;
  selectedNoteId: number | null;
  setSelectedNoteId: (id: number | null) => void;
  recentNotes: any[];
  latestNoteTitle: string | null;
  colors: IslandColors;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onScreenshot: () => Promise<void>;
}

/**
 * 灵动岛快速捕获模式
 * 支持文本输入、图片粘贴、截图
 */
export const IslandCapture = memo(function IslandCapture({
  captureText,
  setCaptureText,
  capturedImage,
  setCapturedImage,
  isSaving,
  showNoteSelector,
  setShowNoteSelector,
  noteMode,
  setNoteMode,
  selectedNoteId,
  setSelectedNoteId,
  recentNotes,
  latestNoteTitle,
  colors,
  inputRef,
  onKeyDown,
  onPaste,
  onScreenshot,
}: IslandCaptureProps) {
  // 占位符文本
  const placeholder = noteMode === "new" 
    ? "记录新想法... (Shift+Enter 保存)" 
    : latestNoteTitle 
      ? `追加到「${latestNoteTitle}...」(Shift+Enter 保存)` 
      : "记录想法... (Shift+Enter 保存)";

  return (
    <motion.div
      key="capture"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        width: "100%",
        height: "100%",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {/* 输入区 */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
        {/* 左侧图标区 */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          paddingTop: 2,
        }}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onScreenshot}
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: colors.cardBg,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: colors.textMuted,
            }}
          >
            <Camera size={14} />
          </motion.button>
        </div>

        {/* 输入框 */}
        <textarea
          ref={inputRef}
          value={captureText}
          onChange={(e) => setCaptureText(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          placeholder={placeholder}
          disabled={isSaving}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: colors.text,
            fontFamily: SYSTEM_FONT,
            fontSize: 14,
            fontWeight: 500,
            resize: "none",
            lineHeight: "22px",
          }}
        />
        
        {/* 下拉按钮 */}
        <button
          onClick={() => setShowNoteSelector(!showNoteSelector)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 8px",
            background: colors.cardBg,
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            color: colors.textMuted,
            fontSize: 11,
            fontFamily: SYSTEM_FONT,
          }}
        >
          <span>{noteMode === "new" ? "新建" : noteMode === "select" ? "选择" : "追加"}</span>
          <ChevronDown 
            size={12} 
            style={{ 
              transform: showNoteSelector ? "rotate(180deg)" : "none", 
              transition: "transform 0.2s" 
            }} 
          />
        </button>
      </div>

      {/* 图片预览 */}
      {capturedImage && (
        <div style={{ position: "relative", marginTop: 4 }}>
          <img
            src={capturedImage}
            alt="captured"
            style={{
              maxWidth: "100%",
              maxHeight: 120,
              borderRadius: 8,
              objectFit: "contain",
            }}
          />
          <button
            onClick={() => setCapturedImage(null)}
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 20,
              height: 20,
              borderRadius: 4,
              background: "rgba(0,0,0,0.6)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
            }}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* 下拉选择器 */}
      <AnimatePresence>
        {showNoteSelector && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              marginTop: 8,
              overflow: "hidden",
            }}
          >
            <div style={{
              display: "flex",
              gap: 6,
              marginBottom: 8,
            }}>
              <button
                onClick={() => { setNoteMode("append"); setShowNoteSelector(false); }}
                style={{
                  flex: 1,
                  padding: "6px 10px",
                  background: noteMode === "append" ? "#FBBF24" : colors.cardBg,
                  color: noteMode === "append" ? "#fff" : colors.textMuted,
                  border: "none",
                  borderRadius: 6,
                  fontSize: 11,
                  fontFamily: SYSTEM_FONT,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                <FileText size={11} /> 追加到最近
              </button>
              <button
                onClick={() => { setNoteMode("new"); setShowNoteSelector(false); }}
                style={{
                  flex: 1,
                  padding: "6px 10px",
                  background: noteMode === "new" ? "#FBBF24" : colors.cardBg,
                  color: noteMode === "new" ? "#fff" : colors.textMuted,
                  border: "none",
                  borderRadius: 6,
                  fontSize: 11,
                  fontFamily: SYSTEM_FONT,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                <Plus size={11} /> 新建笔记
              </button>
            </div>
            
            {recentNotes.length > 0 && (
              <div style={{
                maxHeight: 80,
                overflowY: "auto",
                background: colors.cardBg,
                borderRadius: 6,
              }}>
                {recentNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => {
                      setNoteMode("select");
                      setSelectedNoteId(note.id);
                      setShowNoteSelector(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "6px 10px",
                      background: selectedNoteId === note.id && noteMode === "select" ? "#FBBF24" : "transparent",
                      color: selectedNoteId === note.id && noteMode === "select" ? "#fff" : colors.textMuted,
                      border: "none",
                      borderBottom: `1px solid ${colors.cardBg}`,
                      fontSize: 11,
                      fontFamily: SYSTEM_FONT,
                      cursor: "pointer",
                      textAlign: "left",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {stripHtml(note.content).slice(0, 30)}...
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
