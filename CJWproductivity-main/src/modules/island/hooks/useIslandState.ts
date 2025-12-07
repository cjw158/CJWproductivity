/**
 * @file hooks/useIslandState.ts
 * @description 灵动岛状态管理 Hook
 */

import { useState, useRef } from "react";
import type { NoteMode } from "../types";

export interface UseIslandStateReturn {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
  isCaptureMode: boolean;
  setIsCaptureMode: (mode: boolean) => void;
  captureText: string;
  setCaptureText: (text: string) => void;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  showNoteSelector: boolean;
  setShowNoteSelector: (show: boolean) => void;
  noteMode: NoteMode;
  setNoteMode: (mode: NoteMode) => void;
  selectedNoteId: number | null;
  setSelectedNoteId: (id: number | null) => void;
  capturedImage: string | null;
  setCapturedImage: (image: string | null) => void;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}

/**
 * 灵动岛状态管理 Hook
 */
export function useIslandState(): UseIslandStateReturn {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isCaptureMode, setIsCaptureMode] = useState(false);
  const [captureText, setCaptureText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showNoteSelector, setShowNoteSelector] = useState(false);
  const [noteMode, setNoteMode] = useState<NoteMode>("append");
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  return {
    isExpanded,
    setIsExpanded,
    isVisible,
    setIsVisible,
    isCaptureMode,
    setIsCaptureMode,
    captureText,
    setCaptureText,
    isSaving,
    setIsSaving,
    showNoteSelector,
    setShowNoteSelector,
    noteMode,
    setNoteMode,
    selectedNoteId,
    setSelectedNoteId,
    capturedImage,
    setCapturedImage,
    inputRef,
  };
}
