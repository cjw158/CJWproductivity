/**
 * @file island/utils.ts
 * @description 灵动岛模块工具函数
 */

// 测量文本宽度的辅助函数（缓存 canvas 提升性能）
let textMeasureCanvas: HTMLCanvasElement | null = null;
let textMeasureCtx: CanvasRenderingContext2D | null = null;

/**
 * 测量文本宽度
 * @param text 文本内容
 * @param font 字体设置
 * @returns 宽度（像素）
 */
export const measureTextWidth = (text: string, font: string): number => {
  if (!textMeasureCanvas) {
    textMeasureCanvas = document.createElement("canvas");
    textMeasureCtx = textMeasureCanvas.getContext("2d");
  }
  if (textMeasureCtx) {
    textMeasureCtx.font = font;
    return textMeasureCtx.measureText(text).width;
  }
  return 0;
};

/**
 * 格式化番茄钟时间显示
 * @param seconds 秒数
 * @returns 格式化的时间字符串 (MM:SS)
 */
export const formatPomodoroTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

/**
 * 播放番茄钟完成提示音
 */
export const playNotificationSound = (): void => {
  try {
    const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleVJFnNzmxoFYOFOz8N62dFVZrPnpxIBfXqru4bl4X12p7+G3dV5cpO7ftXNdW6Lr3bNxW1mi6duxcFpYoOfZr25ZVp/l169tWFWd49WtbFdUnOHTq2tWUpri0alqVVGY4M+oaVRQl97NpmhTT5XdzKVnUk6U3MqjZlFNk9rJomVQTJLZyKBkT0uR2MefY05KkNbGnmJNSY/VxZ1hTEiO1MSbYEtHjdPDmmBKRozSwpleSkaL0cGYXUlFitDAl1xIRInPv5ZbR0OIzr6VWkZCh829lFlFQYbMvJNYRECFy7uSV0M/hMq6kVZCPoTJuZBVQT2DyLiPVEA8gsC3j1M/O4G/to5SPjqAvbWNUj05gLy0i1E8OIC7s4pQOzeAurKJUDo2f7mxiFQ3NYC4sIdTNjSAt6+GUjUzgLauhlE0MoC1rYVRMzGAs6yEUDIwgLKrgk8xL4CxqoFPMC6AsKmATy8tgK+of04uLICupn5OLSuArKV9TSsqgKukfE0qKYCqo3tMKSiAqaJ6TCgngKiheks=");
    audio.volume = 0.5;
    audio.play().catch(() => {});
  } catch {}
};
