import React, { useRef, useState, forwardRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";

// =========================================
// 1. Spotlight Card (聚光灯 + 3D 悬浮卡片)
// =========================================
interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  from?: string;
  via?: string;
  to?: string;
  enableTilt?: boolean; // 新增开关
}

export function SpotlightCard({
  children,
  className,
  from = "rgba(255,255,255,0.2)",
  via = "rgba(255,255,255,0.1)",
  to = "transparent",
  enableTilt = true,
  ...props
}: SpotlightCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePosition({ x, y });

    if (enableTilt) {
      const rotateY = ((x - rect.width / 2) / rect.width) * 20;
      const rotateX = ((y - rect.height / 2) / rect.height) * -20;
      containerRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
    }
  }

  function handleMouseLeave() {
    setIsHovered(false);
    if (containerRef.current) {
      containerRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
    }
  }

  function handleMouseEnter() {
    setIsHovered(true);
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative border border-white/10 bg-gray-900/5 rounded-xl transition-transform duration-200 ease-out",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      style={{
        transformStyle: "preserve-3d",
        transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)",
      }}
      {...props}
    >
      {/* 光圈效果 */}
      {isHovered && (
        <div
          className="pointer-events-none absolute -inset-px rounded-xl"
          style={{
            background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, ${from}, ${via}, ${to})`,
          }}
        />
      )}
      <div className="relative h-full">
        {children}
      </div>
    </div>
  );
}

// =========================================
// 2. Glass Panel (高级毛玻璃容器)
// =========================================
interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  intensity?: "low" | "medium" | "high";
  border?: boolean;
}

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(function GlassPanel({ 
  children, 
  className, 
  intensity = "medium", 
  border = true,
  ...props 
}, ref) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const blurMap = {
    low: "backdrop-filter-sm",
    medium: "backdrop-blur-md",
    high: "backdrop-blur-xl",
  };

  const bgMap = {
    low: isDark ? "bg-black/20" : "bg-white/40",
    medium: isDark ? "bg-[#1c1c26]/60" : "bg-white/70",
    high: isDark ? "bg-[#1c1c26]/80" : "bg-white/90",
  };

  return (
    <div
      ref={ref}
      className={cn(
        bgMap[intensity],
        blurMap[intensity],
        border && (isDark ? "border border-white/5" : "border border-white/40 shadow-sm"),
        "relative",
        className
      )}
      {...props}
    >
      {/* 噪点纹理 - 增加质感 */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay rounded-inherit"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` 
        }}
      />
      {children}
    </div>
  );
});

// =========================================
// 3. Magnetic Button (磁吸按钮)
// =========================================
interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function MagneticButton({ children, className, onClick, ...props }: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current!.getBoundingClientRect();
    const x = (clientX - (left + width / 2)) * 0.25; // 降低磁吸强度
    const y = (clientY - (top + height / 2)) * 0.25;
    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }} // 提高响应速度
      className={cn("relative", className)}
      {...props as any}
    >
      {children}
    </motion.button>
  );
}

// =========================================
// 5. Neon Input (霓虹呼吸输入框)
// =========================================
interface NeonInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  glowColor?: string;
}

export const NeonInput = forwardRef<HTMLInputElement, NeonInputProps>(function NeonInput({ 
  className, 
  glowColor = "var(--neon-cyan)",
  ...props 
}, ref) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative w-full">
      <input
        ref={ref}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          "w-full px-4 py-2 rounded-lg text-sm transition-all duration-300 outline-none",
          isDark 
            ? "bg-white/5 text-white placeholder:text-white/30 border border-white/10" 
            : "bg-white text-gray-900 placeholder:text-gray-400 border border-gray-200",
          isFocused && isDark && "border-[var(--neon-cyan)]/50",
          isFocused && !isDark && "border-blue-400",
          className
        )}
        {...props}
      />
      {/* 呼吸光晕 - 仅暗色模式 + focus */}
      {isDark && isFocused && (
        <div 
          className="absolute inset-0 rounded-lg pointer-events-none animate-pulse"
          style={{
            boxShadow: `0 0 15px ${glowColor}, 0 0 30px ${glowColor}`,
            opacity: 0.3,
            zIndex: -1
          }}
        />
      )}
    </div>
  );
});

// =========================================
// 4. Grid Beam (神经元光束)
// =========================================
interface GridBeamProps {
  className?: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
}

export function GridBeam({ className, width = 20, height = 20, x = 0, y = 0 }: GridBeamProps) {
  // 随机生成光束路径
  const id = React.useId();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  if (!isDark) return null; // 仅在暗色模式显示

  return (
    <div 
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div className="absolute inset-0 bg-[url(https://grainy-gradients.vercel.app/noise.svg)] opacity-20"></div>
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        style={{ stroke: "rgba(255, 255, 255, 0.15)" }} // 强制提升亮度至 15%
      >
        <defs>
          <pattern
            id={id}
            width={width}
            height={height}
            x={x}
            y={y}
            patternUnits="userSpaceOnUse"
          >
            <path d={`M.5 ${height}V.5H${width}`} fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" strokeWidth={1} fill={`url(#${id})`} />
        
        {/* 随机光束 - 增加数量和频次 */}
        <Beam duration={3} delay={0} width={width} height={height} />
        <Beam duration={5} delay={2} width={width} height={height} />
        <Beam duration={4} delay={1} width={width} height={height} horizontal />
        <Beam duration={6} delay={3} width={width} height={height} horizontal />
        <Beam duration={4} delay={1.5} width={width} height={height} />
        <Beam duration={5} delay={3.5} width={width} height={height} horizontal />
      </svg>
    </div>
  );
}

function Beam({ duration, delay, width, height, horizontal = false }: { duration: number; delay: number; width: number; height: number; horizontal?: boolean }) {
  const [dimension, setDimension] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 1200, 
    height: typeof window !== 'undefined' ? window.innerHeight : 800 
  });

  useEffect(() => {
    const handleResize = () => {
      setDimension({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    // 强制触发一次
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 计算路径 - 确保覆盖全屏
  const maxSteps = horizontal ? Math.ceil(dimension.height / height) : Math.ceil(dimension.width / width);
  const rowOrCol = Math.floor(Math.random() * maxSteps);
  const offset = rowOrCol * (horizontal ? height : width) + (horizontal ? height/2 : width/2);
  
  // 增加额外的长度，确保从屏幕外完全穿过
  const d = horizontal 
    ? `M -500 ${offset} L ${dimension.width + 500} ${offset}`
    : `M ${offset} -500 L ${offset} ${dimension.height + 500}`;

  return (
    <motion.path
      d={d}
      stroke="#00FFFF" // 直接使用亮青色，不依赖渐变定义
      strokeWidth="3" 
      strokeLinecap="round"
      fill="none"
      initial={{ pathLength: 0, opacity: 0, pathOffset: 0 }}
      animate={{ 
        pathLength: [0, 0.4, 0], // 缩短光束长度，使其更像子弹
        opacity: [0, 1, 0],
        pathOffset: [0, 1] 
      }}
      transition={{
        duration: duration * 1.5, // 稍微慢一点，看清运动
        delay,
        repeat: Infinity,
        ease: "linear",
        repeatDelay: Math.random() * 2 + 1 // 随机间隔 1-3秒
      }}
      style={{ filter: "drop-shadow(0 0 4px #00FFFF)" }} // 添加发光滤镜
    />
  );
}

// =========================================
// 6. Fluid Text (流光文字)
// =========================================
export function FluidText({ 
  children, 
  className,
  color = "from-cyan-400 via-blue-500 to-purple-600" 
}: { 
  children: React.ReactNode; 
  className?: string;
  color?: string;
}) {
  return (
    <span 
      className={cn(
        "bg-clip-text text-transparent bg-300% animate-gradient",
        "bg-gradient-to-r",
        color,
        className
      )}
    >
      {children}
    </span>
  );
}

import { createPortal } from "react-dom";

// =========================================
// 7. Explosion (粒子爆炸)
// =========================================
export function Explosion({ active, x, y }: { active: boolean; x: number; y: number }) {
  if (!active) return null;
  
  return createPortal(
    <div 
      className="fixed pointer-events-none z-[9999]" 
      style={{ left: x, top: y }}
    >
      {Array.from({ length: 20 }).map((_, i) => (
        <Particle key={i} />
      ))}
    </div>,
    document.body
  );
}

function Particle() {
  // 随机角度和距离
  const angle = Math.random() * Math.PI * 2;
  const velocity = 50 + Math.random() * 100;
  const x = Math.cos(angle) * velocity;
  const y = Math.sin(angle) * velocity;
  const color = Math.random() > 0.5 ? "var(--neon-cyan)" : "var(--neon-purple)";
  
  return (
    <motion.div
      className="absolute w-1.5 h-1.5 rounded-full"
      style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{ 
        x, 
        y, 
        opacity: 0, 
        scale: 0 
      }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    />
  );
}

// =========================================
// 9. Lively Icon (灵动图标)
// =========================================
export function LivelyIcon({ 
  children, 
  animation = "bounce",
  className
}: { 
  children: React.ReactNode; 
  animation?: "shake" | "bounce" | "pulse";
  className?: string;
}) {
  return (
    <motion.div
      className={cn("inline-flex items-center justify-center", className)}
      whileHover={animation === "shake" ? { 
        rotate: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.5 }
      } : animation === "bounce" ? {
        y: [0, -3, 0],
        transition: { duration: 0.3, repeat: Infinity, repeatType: "reverse" }
      } : {
        scale: [1, 1.1, 1],
        transition: { duration: 0.3 }
      }}
      whileTap={{ scale: 0.9 }}
    >
      {children}
    </motion.div>
  );
}
