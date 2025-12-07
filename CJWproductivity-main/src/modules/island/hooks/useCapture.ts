/**
 * @file hooks/useCapture.ts
 * @description 快速捕获逻辑 Hook
 */

import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNotes, useCreateNote, useUpdateNote } from "@/hooks/useNotes";
import { extractH1Title } from "@/utils";
import type { NoteMode } from "../types";

export interface UseCaptureProps {
  captureText: string;
  capturedImage: string | null;
  isSaving: boolean;
  noteMode: NoteMode;
  selectedNoteId: number | null;
  setIsSaving: (saving: boolean) => void;
  setIsCaptureMode: (mode: boolean) => void;
  setCaptureText: (text: string) => void;
  setCapturedImage: (image: string | null) => void;
  setShowNoteSelector: (show: boolean) => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}

export interface UseCaptureReturn {
  handleSave: () => Promise<void>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handlePaste: (e: React.ClipboardEvent) => void;
  handleScreenshot: () => Promise<void>;
  lineCount: number;
  recentNotes: any[];
  latestNote: any | null;
  latestNoteTitle: string | null;
}

/**
 * 快速捕获 Hook
 */
export function useCapture(props: UseCaptureProps): UseCaptureReturn {
  const {
    captureText,
    capturedImage,
    isSaving,
    noteMode,
    selectedNoteId,
    setIsSaving,
    setIsCaptureMode,
    setCaptureText,
    setCapturedImage,
    setShowNoteSelector,
    inputRef,
  } = props;

  const queryClient = useQueryClient();
  const { data: notes = [] } = useNotes("all");
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();

  // 最近的笔记（按更新时间排序）
  const recentNotes = useMemo(() => 
    [...notes]
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
      .slice(0, 5),
    [notes]
  );
  
  const latestNote = recentNotes[0];
  
  // 获取笔记标题（提取 h1 标题）
  const latestNoteTitle = useMemo(() => {
    if (!latestNote) return null;
    const title = extractH1Title(latestNote.content);
    // 截取前12个字符显示
    return title === "未命名笔记" ? title : title.slice(0, 12);
  }, [latestNote]);

  // 保存笔记
  const handleSave = useCallback(async () => {
    // 至少需要有文字或图片
    if (!captureText.trim() && !capturedImage) return;
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      const text = captureText.trim();
      // 构建 HTML 内容：文字 + 图片
      let htmlContent = "";
      if (text) {
        htmlContent += `<p>${text}</p>`;
      }
      if (capturedImage) {
        htmlContent += `<img src="${capturedImage}" alt="captured" />`;
      }
      
      if (noteMode === "new") {
        // 创建新笔记
        await createNote.mutateAsync({ content: htmlContent });
      } else if (noteMode === "select" && selectedNoteId) {
        // 追加到选中的笔记
        const targetNote = notes.find(n => n.id === selectedNoteId);
        if (targetNote) {
          const newContent = targetNote.content + htmlContent;
          await updateNote.mutateAsync({
            id: selectedNoteId,
            input: { content: newContent },
          });
        }
      } else if (latestNote) {
        // 默认追加到最近笔记
        const newContent = latestNote.content + htmlContent;
        await updateNote.mutateAsync({
          id: latestNote.id,
          input: { content: newContent },
        });
      } else {
        // 没有笔记时创建新的
        await createNote.mutateAsync({ content: htmlContent });
      }
      
      // 刷新笔记列表
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      
      // 成功后关闭
      setTimeout(() => {
        setIsCaptureMode(false);
        setCaptureText("");
        setCapturedImage(null);
        setIsSaving(false);
        setShowNoteSelector(false);
      }, 200);
    } catch (error) {
      console.error("Failed to save note:", error);
      setIsSaving(false);
    }
  }, [captureText, capturedImage, isSaving, noteMode, selectedNoteId, notes, latestNote, createNote, updateNote, queryClient, setIsSaving, setIsCaptureMode, setCaptureText, setCapturedImage, setShowNoteSelector]);

  // 处理键盘事件 - Shift+Enter 保存，Enter 换行
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      if (props.setShowNoteSelector) {
        setShowNoteSelector(false);
      } else {
        setIsCaptureMode(false);
        setCaptureText("");
        setCapturedImage(null);
      }
    }
  }, [handleSave, setShowNoteSelector, setIsCaptureMode, setCaptureText, setCapturedImage]);

  // 处理粘贴事件 - 支持粘贴图片
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setCapturedImage(base64);
          };
          reader.readAsDataURL(file);
        }
        return;
      }
    }
  }, [setCapturedImage]);

  // 截图处理 - 隐藏窗口 → 触发系统截图 → 自动粘贴
  const handleScreenshot = useCallback(async () => {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const win = getCurrentWindow();
    
    try {
      // 隐藏窗口 → 启动截图工具
      await win.hide();
      await new Promise(r => setTimeout(r, 150));
      
      const { Command } = await import("@tauri-apps/plugin-shell");
      await Command.create("cmd", ["/c", "start", "ms-screenclip:"]).execute();
      
      // 恢复窗口
      await new Promise(r => setTimeout(r, 1000));
      await win.show();
      await win.setFocus();
      setIsCaptureMode(true);
      inputRef.current?.focus();
      
      // 后台轮询剪贴板（15秒超时）
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 500));
        try {
          const items = await navigator.clipboard.read();
          for (const item of items) {
            const imageType = item.types.find(t => t.startsWith("image/"));
            if (imageType) {
              const blob = await item.getType(imageType);
              const base64 = await new Promise<string>(resolve => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
              setCapturedImage(base64);
              return;
            }
          }
        } catch { /* 继续等待 */ }
      }
    } catch (error) {
      console.error("Screenshot failed:", error);
      await win.show().catch(() => {});
      setIsCaptureMode(true);
    }
  }, [setIsCaptureMode, setCapturedImage, inputRef]);

  // 计算文本行数（限制 1-6 行）
  const lineCount = useMemo(() => 
    Math.min(Math.max(captureText.split("\n").length, 1), 6)
  , [captureText]);

  return {
    handleSave,
    handleKeyDown,
    handlePaste,
    handleScreenshot,
    lineCount,
    recentNotes,
    latestNote,
    latestNoteTitle,
  };
}
