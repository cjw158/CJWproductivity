import { memo, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { GridBeam } from "@/components/ui/visual-effects";

// 使用 memo 确保背景永不重渲染
export const Background = memo(function Background() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    // 全局鼠标追踪
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  // 多彩鼠标光晕
  const background = useMotionTemplate`
    radial-gradient(
      600px circle at ${mouseX}px ${mouseY}px,
      rgba(0, 255, 255, 0.1),
      transparent 40%
    ),
    radial-gradient(
      400px circle at ${mouseX}px ${mouseY}px,
      rgba(139, 92, 246, 0.08),
      transparent 50%
    ),
    radial-gradient(
      800px circle at ${mouseX}px ${mouseY}px,
      rgba(255, 0, 255, 0.05),
      transparent 60%
    )
  `;

  return (
    <>
      {/* 神经元光束网格 - 仅暗色主题 */}
      {isDark ? (
        <GridBeam className="fixed inset-0 z-0" width={40} height={40} />
      ) : (
        <div 
          className="fixed inset-0 bg-grid-pattern pointer-events-none opacity-50" 
          style={{ zIndex: 0 }}
          aria-hidden="true"
        />
      )}
      
      {/* 鼠标光晕跟随 - 仅暗色主题 */}
      {isDark && (
        <motion.div
          className="fixed inset-0 pointer-events-none"
          style={{ 
            zIndex: 0,
            background: background,
          }}
        />
      )}

      {/* 多彩极光层 - 仅暗色主题 */}
      {isDark && (
        <div 
          className="fixed inset-0 pointer-events-none aurora-bg"
          style={{ zIndex: 0 }}
          aria-hidden="true"
        />
      )}

      {/* 渐变遮罩 - 仅暗色主题 */}
      {isDark && (
        <div 
          className="fixed inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0A0A0F]/80 pointer-events-none" 
          style={{ zIndex: 0 }}
          aria-hidden="true"
        />
      )}
    </>
  );
});

// 启动动画 Logo
export const LoadingScreen = memo(function LoadingScreen() {
  return (
    <div className="h-screen w-screen flex items-center justify-center overflow-hidden" style={{ background: "#0A0A0F" }}>
      {/* 背景光晕动画 */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(0, 255, 255, 0.15) 0%, rgba(139, 92, 246, 0.1) 40%, transparent 70%)",
          filter: "blur(60px)",
        }}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ 
          scale: [0.5, 1.2, 1],
          opacity: [0, 0.8, 0.6],
        }}
        transition={{ duration: 2, ease: "easeOut" }}
      />
      
      {/* 旋转光环 */}
      <motion.div
        className="absolute w-32 h-32 rounded-full"
        style={{
          border: "2px solid transparent",
          borderTopColor: "rgba(0, 255, 255, 0.6)",
          borderRightColor: "rgba(139, 92, 246, 0.4)",
        }}
        initial={{ rotate: 0, scale: 0 }}
        animate={{ rotate: 360, scale: 1 }}
        transition={{ 
          rotate: { duration: 2, repeat: Infinity, ease: "linear" },
          scale: { duration: 0.5, ease: "easeOut" }
        }}
      />
      
      {/* 第二个光环（反向） */}
      <motion.div
        className="absolute w-24 h-24 rounded-full"
        style={{
          border: "1px solid transparent",
          borderBottomColor: "rgba(255, 0, 255, 0.5)",
          borderLeftColor: "rgba(0, 255, 136, 0.3)",
        }}
        initial={{ rotate: 0, scale: 0 }}
        animate={{ rotate: -360, scale: 1 }}
        transition={{ 
          rotate: { duration: 1.5, repeat: Infinity, ease: "linear" },
          scale: { duration: 0.5, delay: 0.2, ease: "easeOut" }
        }}
      />

      <div className="flex flex-col items-center gap-6 z-10">
        {/* Logo 图标 */}
        <motion.div 
          className="relative"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.3
          }}
        >
          <motion.div 
            className="w-20 h-20 rounded-2xl flex items-center justify-center relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(0, 255, 255, 0.2) 0%, rgba(139, 92, 246, 0.2) 50%, rgba(255, 0, 255, 0.2) 100%)",
              border: "1px solid rgba(0, 255, 255, 0.4)",
              boxShadow: "0 0 40px rgba(0, 255, 255, 0.4), inset 0 0 30px rgba(0, 255, 255, 0.1)",
            }}
          >
            {/* 内部流光效果 */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
              }}
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1,
                ease: "easeInOut",
              }}
            />
            {/* 大脑图标 - 使用 SVG */}
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#00FFFF" }}>
              <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 2.96 3.08A2.5 2.5 0 0 0 12 19.5a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 12 4.5"/>
              <path d="m15.7 10.4-.9.4"/>
              <path d="m9.2 13.2-.9.4"/>
              <path d="m13.6 15.7-.4-.9"/>
              <path d="m10.8 9.2-.4-.9"/>
              <path d="m15.7 13.5-.9-.4"/>
              <path d="m9.2 10.9-.9-.4"/>
              <path d="m10.4 15.7.4-.9"/>
              <path d="m13.1 9.2.4-.9"/>
            </svg>
          </motion.div>
          
          {/* 外发光 */}
          <motion.div 
            className="absolute inset-0 rounded-2xl -z-10"
            style={{ background: "rgba(0, 255, 255, 0.4)" }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 0.1, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
        
        {/* 文字 */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <motion.h1 
            className="font-bold text-2xl tracking-wider bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent"
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              backgroundSize: "200% 200%",
            }}
          >
            CJW
          </motion.h1>
          <motion.p 
            className="text-sm mt-2 text-white/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Capture. Journal. Wrap-up.
          </motion.p>
        </motion.div>

        {/* 加载指示器 */}
        <motion.div
          className="flex gap-1 mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ background: "#00FFFF" }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
});
