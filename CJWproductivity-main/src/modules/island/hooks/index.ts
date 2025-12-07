/**
 * @file hooks/index.ts
 * @description 灵动岛 Hooks 统一导出
 */

export { useIslandState } from "./useIslandState";
export { usePomodoro } from "./usePomodoro";
export { useCapture } from "./useCapture";
// TODO: 添加更多 hooks
// export { useIslandSize } from "./useIslandSize";
// export { useIslandEvents } from "./useIslandEvents";

export type { UseIslandStateReturn } from "./useIslandState";
export type { UsePomodoroReturn } from "./usePomodoro";
export type { UseCaptureReturn, UseCaptureProps } from "./useCapture";
