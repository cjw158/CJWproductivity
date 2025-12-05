/**
 * @file QuickCapture/types.ts
 * @description QuickCapture 组件类型定义
 */

export type CaptureMode = "task" | "note";
export type NoteMode = "append" | "select" | "new";
export type SaveStatus = "idle" | "saving" | "success" | "error";

export interface QuickCaptureState {
  content: string;
  mode: CaptureMode;
  saveStatus: SaveStatus;
  dueDate: string | null;
  scheduledTime: string | null;
  duration: number;
  parsedDate: Date | null;
  parsedText: string;
  showTimePanel: boolean;
  noteMode: NoteMode;
  selectedNoteId: number | null;
  showNoteOptions: boolean;
}

export type QuickCaptureAction =
  | { type: "SET_CONTENT"; payload: string }
  | { type: "TOGGLE_MODE" }
  | { type: "SET_DUE_DATE"; payload: string | null }
  | { type: "SET_SCHEDULED_TIME"; payload: string | null }
  | { type: "SET_DURATION"; payload: number }
  | { type: "SET_PARSED"; payload: { date: Date | null; text: string } }
  | { type: "SET_SAVE_STATUS"; payload: SaveStatus }
  | { type: "TOGGLE_TIME_PANEL" }
  | { type: "SET_NOTE_MODE"; payload: NoteMode }
  | { type: "SET_SELECTED_NOTE"; payload: number | null }
  | { type: "TOGGLE_NOTE_OPTIONS" }
  | { type: "APPLY_PARSED_DATE" }
  | { type: "RESET" };

export interface QuickCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndClose: () => void;
  onCreated?: () => void;
}

export interface ModeConfig {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  placeholder: string;
  color: string;
  bgColor: string;
}
