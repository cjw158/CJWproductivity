/**
 * @file hooks/usePomodoro.ts
 * @description 番茄钟逻辑 Hook
 */

import { useState, useCallback, useEffect } from "react";
import { playNotificationSound, formatPomodoroTime } from "../utils";

export interface UsePomodoroReturn {
  minutes: number;
  remaining: number;
  isActive: boolean;
  progress: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
  setMinutes: (min: number) => void;
  formatTime: (seconds: number) => string;
  handleWheel: (e: React.WheelEvent) => void;
}

/**
 * 番茄钟 Hook
 * @param initialMinutes 初始分钟数，默认25分钟
 */
export function usePomodoro(initialMinutes = 25): UsePomodoroReturn {
  const [minutes, setMinutes] = useState(initialMinutes);
  const [remaining, setRemaining] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // 倒计时
  useEffect(() => {
    if (!isActive || remaining <= 0) return;
    
    const timer = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          setIsActive(false);
          // 播放提示音
          playNotificationSound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isActive, remaining]);

  // 开始/暂停
  const start = useCallback(() => {
    if (isActive) {
      // 暂停
      setIsActive(false);
    } else {
      // 开始/继续
      if (remaining === 0) {
        setRemaining(minutes * 60);
      }
      setIsActive(true);
    }
  }, [isActive, remaining, minutes]);

  // 暂停
  const pause = useCallback(() => {
    setIsActive(false);
  }, []);
  
  // 重置
  const reset = useCallback(() => {
    setIsActive(false);
    setRemaining(0);
  }, []);

  // 滚轮调节时长
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (isActive) return; // 运行中不允许调节
    e.preventDefault();
    e.stopPropagation();
    
    setMinutes(prev => {
      const delta = e.deltaY < 0 ? 1 : -1;
      return Math.max(1, Math.min(60, prev + delta));
    });
  }, [isActive]);

  // 计算进度百分比
  const progress = remaining === 0 ? 0 : ((minutes * 60 - remaining) / (minutes * 60)) * 100;

  return {
    minutes,
    remaining,
    isActive,
    progress,
    start,
    pause,
    reset,
    setMinutes,
    formatTime: formatPomodoroTime,
    handleWheel,
  };
}
