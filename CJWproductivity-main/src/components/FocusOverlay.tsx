import { useState, useEffect, memo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Play, Pause, GripHorizontal, Maximize2, Minimize2, Square, Bell } from "lucide-react";
import { useFocus } from "@/contexts/FocusContext";
import { useUpdateTask } from "@/hooks/useTasks";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

// 请求通知权限
const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};

// 发送系统通知
const sendNotification = (title: string, body: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: 'cjw-focus',
    });
  }
};

export const FocusOverlay = memo(function FocusOverlay() {
  const { focusedTask, stopFocus } = useFocus();
  const updateTask = useUpdateTask();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [initialDuration, setInitialDuration] = useState(25 * 60);
  const [isFlashing, setIsFlashing] = useState(false); // 闪烁状态
  
  const constraintsRef = useRef(null);
  const hasNotified = useRef(false); // 防止重复通知

  // 请求通知权限
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // 初始化
  useEffect(() => {
    if (focusedTask) {
      const duration = (focusedTask.duration || 25) * 60;
      setTimeLeft(duration);
      setInitialDuration(duration);
      setIsActive(true);
      setIsExpanded(true);
      setIsFlashing(false);
      hasNotified.current = false;
    }
  }, [focusedTask]);

  // 计时逻辑
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !hasNotified.current && focusedTask) {
      // 时间到！
      setIsActive(false);
      setIsFlashing(true);
      hasNotified.current = true;
      
      // 发送系统通知
      sendNotification(
        "⏰ 专注时间结束！",
        `任务「${focusedTask.content}」的专注时段已完成`
      );
      
      // 播放提示音（可选）
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch {}
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, focusedTask]);

  const handleComplete = () => {
    if (focusedTask) {
      updateTask.mutate({
        id: focusedTask.id,
        input: { status: "DONE" }
      });
      stopFocus();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!focusedTask) return null;

  const progress = ((initialDuration - timeLeft) / initialDuration) * 100;

  return (
    <>
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[200]" />

      <AnimatePresence>
        <motion.div
          drag
          dragMomentum={false}
          dragConstraints={constraintsRef}
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
            // 闪烁动画
            boxShadow: isFlashing 
              ? [
                  "0 0 0 0 rgba(0, 255, 255, 0)",
                  "0 0 30px 10px rgba(0, 255, 255, 0.6)",
                  "0 0 0 0 rgba(0, 255, 255, 0)"
                ]
              : "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
          }}
          transition={isFlashing ? { 
            boxShadow: { repeat: Infinity, duration: 1 }
          } : {}}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
          className={cn(
            "fixed top-6 right-6 z-[201] pointer-events-auto backdrop-blur-xl border transition-colors",
            isExpanded ? "rounded-2xl" : "rounded-full",
            isDark 
              ? "bg-black/80 border-white/10" 
              : "bg-white/90 border-gray-200 shadow-xl",
            isFlashing && "ring-2 ring-[var(--neon-cyan)] ring-offset-2"
          )}
          style={{ width: isExpanded ? 280 : "auto" }}
        >
          {/* 时间到提示 */}
          {isFlashing && isExpanded && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={cn(
                "absolute -top-2 -right-2 p-1.5 rounded-full",
                isDark ? "bg-[var(--neon-cyan)]" : "bg-blue-500"
              )}
            >
              <Bell className="w-3.5 h-3.5 text-white animate-bounce" />
            </motion.div>
          )}

          {/* 顶部进度条 */}
          {isExpanded && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200/20 overflow-hidden rounded-t-2xl">
              <motion.div 
                className={cn(
                  "h-full",
                  isFlashing ? "bg-[var(--neon-green)]" : (isDark ? "bg-[var(--neon-cyan)]" : "bg-blue-500")
                )}
                initial={{ width: "100%" }}
                animate={{ width: `${100 - progress}%` }}
                transition={{ ease: "linear", duration: 1 }}
              />
            </div>
          )}

          <div className={cn("flex flex-col", isExpanded ? "p-4 pt-5" : "p-2")}>
            
            {/* 顶部栏 */}
            {isExpanded && (
              <div className="flex items-center justify-between mb-3 cursor-grab active:cursor-grabbing">
                <GripHorizontal className={cn("w-4 h-4 opacity-30", isDark ? "text-white" : "text-black")} />
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsExpanded(false)} className="p-1 rounded hover:bg-white/10 transition-colors">
                    <Minimize2 className={cn("w-3.5 h-3.5 opacity-50", isDark ? "text-white" : "text-black")} />
                  </button>
                  <button onClick={stopFocus} className="p-1 rounded hover:bg-red-500/20 hover:text-red-500 transition-colors">
                    <X className={cn("w-3.5 h-3.5 opacity-50", isDark ? "text-white" : "text-black")} />
                  </button>
                </div>
              </div>
            )}

            {/* 核心内容区 */}
            <div className={cn("flex items-center gap-3", !isExpanded && "pl-1")}>
              {!isExpanded && (
                <div className="cursor-grab active:cursor-grabbing px-1">
                  <GripHorizontal className={cn("w-4 h-4 opacity-30", isDark ? "text-white" : "text-black")} />
                </div>
              )}

              <div className={cn(
                "font-mono font-bold",
                isExpanded ? "text-4xl w-full text-center my-2" : "text-lg",
                isDark ? "text-white" : "text-gray-900",
                isFlashing && "text-[var(--neon-green)]"
              )}>
                {timeLeft === 0 ? "完成!" : formatTime(timeLeft)}
              </div>

              {!isExpanded && (
                <div className="flex items-center gap-1 pr-1">
                  <button
                    onClick={() => setIsActive(!isActive)}
                    className={cn(
                      "p-1.5 rounded-full transition-colors",
                      isActive 
                        ? (isDark ? "bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)]" : "bg-blue-100 text-blue-600")
                        : (isDark ? "hover:bg-white/10" : "hover:bg-gray-100")
                    )}
                  >
                    {isActive ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  </button>
                  <button onClick={() => setIsExpanded(true)} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
                    <Maximize2 className={cn("w-3.5 h-3.5 opacity-50", isDark ? "text-white" : "text-black")} />
                  </button>
                </div>
              )}
            </div>

            {/* 展开模式内容 */}
            {isExpanded && (
              <>
                <div className={cn(
                  "text-sm font-medium text-center line-clamp-2 mb-4 min-h-[2.5em] flex items-center justify-center",
                  isDark ? "text-white/80" : "text-gray-700"
                )}>
                  {focusedTask.content}
                </div>

                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={stopFocus}
                    className={cn(
                      "p-3 rounded-full transition-all",
                      isDark ? "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                    )}
                    title="放弃"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>

                  <button
                    onClick={() => setIsActive(!isActive)}
                    className={cn(
                      "p-4 rounded-full transition-all shadow-lg scale-100 hover:scale-105 active:scale-95",
                      isDark ? "bg-[var(--neon-cyan)] text-black" : "bg-blue-500 text-white"
                    )}
                  >
                    {isActive ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current pl-1" />}
                  </button>

                  <button
                    onClick={handleComplete}
                    className={cn(
                      "p-3 rounded-full transition-all",
                      isDark ? "bg-green-500/10 text-green-400 hover:bg-green-500/20" : "bg-green-50 text-green-600 hover:bg-green-100"
                    )}
                    title="完成"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
});
