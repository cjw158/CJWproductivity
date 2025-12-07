/**
 * @file QuickCapture/reducer.ts
 * @description QuickCapture 状态管理
 */

import type { QuickCaptureState, QuickCaptureAction } from "./types";

export const initialState: QuickCaptureState = {
  content: "",
  mode: "task",
  saveStatus: "idle",
  dueDate: null,
  scheduledTime: null,
  duration: 30,
  parsedDate: null,
  parsedText: "",
  showTimePanel: false,
  noteMode: "append",
  selectedNoteId: null,
  showNoteOptions: false,
};

export function quickCaptureReducer(
  state: QuickCaptureState,
  action: QuickCaptureAction
): QuickCaptureState {
  switch (action.type) {
    case "SET_CONTENT":
      return { ...state, content: action.payload };

    case "TOGGLE_MODE":
      return { ...state, mode: state.mode === "task" ? "note" : "task" };

    case "SET_DUE_DATE":
      return { ...state, dueDate: action.payload };

    case "SET_SCHEDULED_TIME":
      return { ...state, scheduledTime: action.payload };

    case "SET_DURATION":
      return { ...state, duration: Math.max(5, Math.min(180, action.payload)) };

    case "SET_PARSED":
      return {
        ...state,
        parsedDate: action.payload.date,
        parsedText: action.payload.text,
      };

    case "SET_SAVE_STATUS":
      return { ...state, saveStatus: action.payload };

    case "TOGGLE_TIME_PANEL":
      return { ...state, showTimePanel: !state.showTimePanel };

    case "SET_NOTE_MODE":
      return { ...state, noteMode: action.payload };

    case "SET_SELECTED_NOTE":
      return {
        ...state,
        selectedNoteId: action.payload,
        noteMode: "select",
      };

    case "TOGGLE_NOTE_OPTIONS":
      return { ...state, showNoteOptions: !state.showNoteOptions };

    case "APPLY_PARSED_DATE":
      if (!state.parsedDate) return state;
      const pd = state.parsedDate;
      const dateStr = `${pd.getFullYear()}-${(pd.getMonth() + 1).toString().padStart(2, "0")}-${pd.getDate().toString().padStart(2, "0")}`;
      const hours = pd.getHours();
      const mins = state.parsedDate.getMinutes();
      const timeStr =
        hours || mins
          ? `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`
          : null;
      return {
        ...state,
        dueDate: dateStr,
        scheduledTime: timeStr,
        content: state.content.replace(state.parsedText, "").trim(),
        parsedDate: null,
        parsedText: "",
      };

    case "INIT":
      return {
        ...initialState,
        dueDate: action.payload.dueDate || null,
      };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}
