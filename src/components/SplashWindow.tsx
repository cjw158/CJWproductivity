/**
 * @file SplashWindow.tsx
 * @description 独立启动窗口组件 - 简洁优雅的启动动画
 */

import { memo, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import { initializeDataStore } from "@/lib/tasks";

type SplashPhase = "init" | "logo" | "loading" | "ready" | "exit";

export const SplashWindow = memo(function SplashWindow() {
  const [phase, setPhase] = useState<SplashPhase>("init");
  const [progress, setProgress] = useState(0);

  const transitionToMain = useCallback(async () => {
    setPhase("exit");
    await new Promise(resolve => setTimeout(resolve, 500));
    try {
      await invoke("show_main_and_close_splash");
    } catch {
      try { await invoke("show_main_window"); } catch { /* ignore */ }
    }
  }, []);

  // 显示窗口
  useEffect(() => {
    const timer = setTimeout(async () => {
      try { await invoke("show_splash"); } catch { /* ignore */ }
    }, 30);
    return () => clearTimeout(timer);
  }, []);

  // 初始化流程
  useEffect(() => {
    const run = async () => {
      await new Promise(r => setTimeout(r, 100));
      setPhase("logo");
      
      await new Promise(r => setTimeout(r, 800));
      setPhase("loading");
      setProgress(10);

      const interval = setInterval(() => {
        setProgress(p => p >= 85 ? p : p + Math.random() * 25);
      }, 100);

      try { await initializeDataStore(); } catch { /* ignore */ }

      clearInterval(interval);
      setProgress(100);
      
      await new Promise(r => setTimeout(r, 400));
      setPhase("ready");
      
      await new Promise(r => setTimeout(r, 400));
      transitionToMain();
    };
    run();
  }, [transitionToMain]);

  const isVisible = phase !== "init" && phase !== "exit";

  return (
    <div 
      className="w-screen h-screen overflow-hidden flex items-center justify-center"
      style={{ 
        background: "#0c0c12",
        // @ts-ignore - WebkitAppRegion is a valid CSS property for Electron/Tauri
        WebkitAppRegion: "drag",
      } as React.CSSProperties}
    >
      {/* 背景光晕 */}
      <motion.div
        className="absolute"
        style={{
          width: 200,
          height: 200,
          background: "radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 主内容 */}
      <motion.div
        className="flex flex-col items-center z-10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ 
          opacity: phase === "exit" ? 0 : 1, 
          scale: phase === "exit" ? 1.1 : 1,
          y: phase === "exit" ? -20 : 0,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        {/* Logo */}
        <motion.div
          className="relative mb-5"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: isVisible ? 1 : 0, 
            opacity: isVisible ? 1 : 0,
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          {/* 光环 */}
          <motion.div
            className="absolute -inset-3 rounded-2xl"
            style={{
              background: "linear-gradient(135deg, rgba(34,211,238,0.4), rgba(139,92,246,0.4))",
              filter: "blur(12px)",
            }}
            animate={{ 
              opacity: [0.5, 0.8, 0.5],
              scale: [0.95, 1.05, 0.95],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Logo 框 */}
          <div 
            className="relative w-14 h-14 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(145deg, #16161e, #0e0e14)",
              boxShadow: `
                0 0 0 1px rgba(34,211,238,0.3),
                0 8px 32px rgba(0,0,0,0.5),
                0 0 20px rgba(34,211,238,0.2)
              `,
            }}
          >
            <img 
              src="/logo.svg" 
              alt="CJW" 
              className="w-10 h-10"
              style={{
                animation: "pulse-brightness 2s ease-in-out infinite",
              }}
            />
          </div>
        </motion.div>

        {/* 品牌名 */}
        <motion.h1
          className="text-lg font-semibold tracking-wide mb-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ 
            opacity: isVisible ? 1 : 0, 
            y: isVisible ? 0 : 10,
          }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{
            background: "linear-gradient(90deg, #22d3ee, #8b5cf6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          CJW
        </motion.h1>

        {/* 进度条区域 */}
        <motion.div
          className="mt-4 w-32"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: phase === "loading" || phase === "ready" ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
        >
          {/* 进度条背景 */}
          <div 
            className="h-[3px] rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            {/* 进度条 */}
            <motion.div
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, #22d3ee, #8b5cf6)",
                boxShadow: "0 0 8px rgba(34,211,238,0.5)",
              }}
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.15 }}
            />
          </div>
          
          {/* 状态 */}
          <motion.p
            className="text-[9px] text-center mt-2 tracking-wider uppercase"
            style={{ color: phase === "ready" ? "#22d3ee" : "rgba(255,255,255,0.35)" }}
          >
            {phase === "loading" && "Loading..."}
            {phase === "ready" && "Ready"}
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
});
