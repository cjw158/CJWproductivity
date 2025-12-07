/**
 * @file SplashWindow.tsx
 * @description 极简启动动画 - Logo 由虚凝实，旋转后淡出
 */

import { memo, useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import { initializeDataStore } from "@/lib/tasks";
import logoImage from "/logo.png";

type SplashPhase = "init" | "materialize" | "spin" | "fadeout" | "done";

export const SplashWindow = memo(function SplashWindow() {
  const [phase, setPhase] = useState<SplashPhase>("init");

  const transitionToMain = useCallback(async () => {
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

  // 动画流程
  useEffect(() => {
    const run = async () => {
      // 初始化数据（后台进行）
      const initPromise = initializeDataStore().catch(() => {});
      
      // 阶段1：由虚凝实 (0.6s)
      await new Promise(r => setTimeout(r, 50));
      setPhase("materialize");
      
      // 阶段2：旋转 (0.5s)
      await new Promise(r => setTimeout(r, 600));
      setPhase("spin");
      
      // 等待数据初始化完成
      await initPromise;
      
      // 阶段3：淡出 (0.3s)
      await new Promise(r => setTimeout(r, 500));
      setPhase("fadeout");
      
      // 完成
      await new Promise(r => setTimeout(r, 300));
      setPhase("done");
      transitionToMain();
    };
    run();
  }, [transitionToMain]);

  return (
    <div 
      className="w-screen h-screen overflow-hidden flex items-center justify-center"
      style={{ 
        background: "transparent",
        // @ts-ignore
        WebkitAppRegion: "drag",
      } as React.CSSProperties}
    >
      {/* Logo - 高清透明背景 */}
      <motion.img
        src={logoImage}
        alt="CJW"
        className="w-36 h-36"
        initial={{ 
          opacity: 0, 
          scale: 0.2, 
          rotate: -90,
          filter: "blur(15px)"
        }}
        animate={{
          opacity: phase === "init" ? 0 : phase === "fadeout" || phase === "done" ? 0 : 1,
          scale: phase === "init" ? 0.2 : phase === "fadeout" || phase === "done" ? 1.2 : 1,
          rotate: phase === "init" ? -90 : phase === "spin" || phase === "fadeout" || phase === "done" ? 360 : 0,
          filter: phase === "init" 
            ? "blur(15px) drop-shadow(0 0 0px transparent)" 
            : phase === "fadeout" || phase === "done"
              ? "blur(8px) drop-shadow(0 0 60px rgba(34,211,238,1))"
              : "blur(0px) drop-shadow(0 0 25px rgba(34,211,238,0.8))"
        }}
        transition={{ 
          duration: phase === "materialize" ? 0.6 : phase === "spin" ? 0.5 : 0.3,
          ease: "easeOut",
        }}
      />
    </div>
  );
});
