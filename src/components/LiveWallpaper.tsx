/**
 * @file LiveWallpaper.tsx
 * @description 动态壁纸组件 - WebGL/Canvas 实现
 * 
 * 视觉优化版：
 * - nebula: 有机流动的极光星云，混合多种噪点
 * - matrix: 黑客帝国风格，带高亮头字符和动态拖尾
 * - particles: 带有鼠标交互的力导向粒子系统
 * - waves: 模拟极光或深海的辉光波浪
 */

import { memo, useRef, useEffect, useState, useCallback } from "react";
import { useSettings } from "@/hooks/useSettings";
import { useTheme } from "@/contexts/ThemeContext";
import type { LiveWallpaperType } from "@/types/settings";

interface LiveWallpaperProps {
  className?: string;
}

export const LiveWallpaper = memo(function LiveWallpaper({ className }: LiveWallpaperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const fpsRef = useRef({ frames: 0, lastTime: performance.now(), fps: 0 });
  const mouseRef = useRef({ x: -1000, y: -1000 }); // 鼠标位置
  const [fps, setFps] = useState(0);
  
  const { data: settings } = useSettings();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  // 浅色模式强制禁用动态壁纸，保持高级商务感
  const enabled = (settings?.developer?.enableLiveWallpaper ?? false) && isDark;
  const wallpaperType = settings?.developer?.liveWallpaperType ?? "nebula";
  const opacity = (settings?.developer?.liveWallpaperOpacity ?? 30) / 100;
  const speed = settings?.developer?.liveWallpaperSpeed ?? 1.0;
  const showFps = settings?.developer?.showFps ?? false;

  // 监听鼠标移动
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // 1. 星云/极光效果 (优化：更自然的流动和混合)
  const renderNebula = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    // 稍微保留上一帧，创造运动模糊/拖尾效果，更加柔和
    ctx.fillStyle = isDark ? "rgba(0, 0, 0, 0.02)" : "rgba(255, 255, 255, 0.05)";
    ctx.fillRect(0, 0, width, height);
    
    // 使用 globalCompositeOperation 实现更好的颜色混合
    ctx.globalCompositeOperation = isDark ? "screen" : "multiply";
    
    const t = time * 0.0002 * speed;
    
    // 定义几个流动的光球
    const orbs = [
      { 
        color: isDark ? "rgba(0, 229, 255, 0.15)" : "rgba(0, 113, 227, 0.1)", 
        radius: Math.min(width, height) * 0.6,
        x: width * 0.5 + Math.sin(t) * width * 0.2,
        y: height * 0.4 + Math.cos(t * 1.3) * height * 0.1
      },
      { 
        color: isDark ? "rgba(157, 78, 221, 0.15)" : "rgba(94, 92, 230, 0.1)", 
        radius: Math.min(width, height) * 0.5,
        x: width * 0.5 + Math.cos(t * 0.8) * width * 0.25,
        y: height * 0.6 + Math.sin(t * 1.1) * height * 0.15
      },
      { 
        color: isDark ? "rgba(255, 0, 128, 0.12)" : "rgba(255, 45, 85, 0.08)", 
        radius: Math.min(width, height) * 0.7,
        x: width * 0.5 + Math.sin(t * 1.5 + 2) * width * 0.15,
        y: height * 0.5 + Math.cos(t * 0.5 + 1) * height * 0.1
      }
    ];

    orbs.forEach(orb => {
      const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
      gradient.addColorStop(0, orb.color);
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalCompositeOperation = "source-over";

    // 绘制星星/尘埃
    const seed = Math.floor(time / 100); // 每 100ms 闪烁一次
    const starCount = 40;
    ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.2)";
    
    for (let i = 0; i < starCount; i++) {
      // 使用伪随机位置
      const x = ((i * 1337 + seed) % width);
      const y = ((i * 9301 + seed) % height);
      const size = (i % 2) + 0.5;
      const opacity = (Math.sin(t * 10 + i) + 1) / 2 * 0.5; // 呼吸闪烁
      
      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

  }, [isDark, speed]);

  // 2. 矩阵数字雨 (优化：高亮头字符，更清晰的拖尾)
  const matrixRef = useRef<{ drops: number[]; chars: string[] }>({ drops: [], chars: [] });
  
  const renderMatrix = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, _time: number) => {
    const fontSize = 16;
    const columns = Math.ceil(width / fontSize);
    
    if (matrixRef.current.drops.length !== columns) {
      matrixRef.current.drops = Array(columns).fill(1).map(() => Math.random() * -100);
      matrixRef.current.chars = "01XYZTUVW".split(""); // 简化字符集
    }
    
    // 强力拖尾效果
    ctx.fillStyle = isDark ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.1)";
    ctx.fillRect(0, 0, width, height);
    
    ctx.font = `bold ${fontSize}px monospace`;
    const { drops, chars } = matrixRef.current;
    
    for (let i = 0; i < drops.length; i++) {
      // 随机生成字符
      const char = chars[Math.floor(Math.random() * chars.length)];
      const x = i * fontSize;
      const y = drops[i] * fontSize;
      
      // 头部高亮字符
      ctx.shadowBlur = 8;
      ctx.shadowColor = isDark ? "#fff" : "#000";
      ctx.fillStyle = isDark ? "#fff" : "#333";
      ctx.fillText(char, x, y);
      
      // 尾部字符（再画一次，放在上面一点的位置，用主题色）
      if (y > fontSize) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = isDark ? "#00FF41" : "#007AFF"; // 经典黑客绿 或 苹果蓝
        // 随机变化尾部字符
        const trailChar = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(trailChar, x, y - fontSize);
      }
      
      // 随机重置
      if (y > height && Math.random() > 0.98) {
        drops[i] = 0;
      }
      
      drops[i] += speed * 0.4; // 稍微慢一点
    }
    ctx.shadowBlur = 0; // 重置
  }, [isDark, speed]);

  // 3. 粒子网络 (优化：鼠标交互，距离感)
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; size: number }>>([]);
  
  const renderParticles = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, _time: number) => {
    const particleCount = Math.floor(width * height / 12000); // 根据屏幕面积动态调整数量
    
    if (particlesRef.current.length !== particleCount) {
      particlesRef.current = Array(particleCount).fill(null).map(() => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.5, // 稍微快一点
        vy: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 2 + 1,
      }));
    }
    
    ctx.clearRect(0, 0, width, height);
    
    const particles = particlesRef.current;
    const mouse = mouseRef.current;
    
    // 鼠标交互半径
    const interactionRadius = 200;
    const connectionRadius = 120;
    
    particles.forEach((p, i) => {
      // 移动
      p.x += p.vx * speed;
      p.y += p.vy * speed;
      
      // 边界反弹
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;
      
      // 鼠标排斥/吸引效果
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < interactionRadius) {
        const force = (interactionRadius - dist) / interactionRadius;
        // 缓慢推开
        p.x -= dx * force * 0.03 * speed;
        p.y -= dy * force * 0.03 * speed;
      }
      
      // 绘制粒子
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.3)";
      ctx.fill();
      
      // 绘制连线
      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dx2 = p.x - p2.x;
        const dy2 = p.y - p2.y;
        const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        
        if (dist2 < connectionRadius) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          const opacity = (1 - dist2 / connectionRadius) * 0.3;
          ctx.strokeStyle = isDark 
            ? `rgba(0, 255, 255, ${opacity})` 
            : `rgba(0, 113, 227, ${opacity})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      
      // 鼠标连线
      if (dist < interactionRadius) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(mouse.x, mouse.y);
        const opacity = (1 - dist / interactionRadius) * 0.4;
        ctx.strokeStyle = isDark 
            ? `rgba(255, 0, 255, ${opacity})` 
            : `rgba(255, 45, 85, ${opacity})`;
        ctx.stroke();
      }
    });
  }, [isDark, speed]);

  // 4. 波浪线条 (优化：极光辉光效果)
  const renderWaves = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    ctx.clearRect(0, 0, width, height);
    
    const waveCount = 4;
    // 调整为更柔和的极光色
    const colors = isDark 
      ? ["rgba(0, 229, 255, 0.4)", "rgba(157, 78, 221, 0.4)", "rgba(0, 255, 163, 0.3)", "rgba(0, 195, 255, 0.3)"]
      : ["rgba(0, 113, 227, 0.3)", "rgba(94, 92, 230, 0.3)", "rgba(52, 199, 89, 0.3)", "rgba(0, 122, 255, 0.3)"];
    
    ctx.globalCompositeOperation = "screen"; // 叠加变亮
    
    for (let w = 0; w < waveCount; w++) {
      ctx.beginPath();
      
      // 发光效果
      ctx.shadowBlur = 20;
      ctx.shadowColor = colors[w];
      ctx.strokeStyle = colors[w];
      ctx.lineWidth = 3;
      
      const t = time * 0.001 * speed;
      
      // 使用叠加正弦波创造复杂形状
      const amplitude = height * 0.15;
      const yBase = height * (0.4 + w * 0.15);
      
      for (let x = 0; x <= width; x += 10) {
        const y = yBase 
          + Math.sin(x * 0.003 + t + w) * amplitude 
          + Math.sin(x * 0.01 + t * 1.5) * amplitude * 0.3;
          
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      
      // 闭合路径到底部以填充渐变（可选，这里只画线）
      ctx.stroke();
      
      // 绘制填充（模拟极光帘幕）
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "transparent");
      gradient.addColorStop(0.5, colors[w].replace("0.4", "0.1")); // 极淡
      gradient.addColorStop(1, "transparent");
      
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.fillStyle = gradient;
      ctx.fill();
    }
    
    ctx.globalCompositeOperation = "source-over";
    ctx.shadowBlur = 0;
  }, [isDark, speed]);

  // 主渲染循环
  useEffect(() => {
    if (!enabled || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // 设置 canvas 尺寸
    const resize = () => {
      // 限制 DPR 以保证性能，最高 2
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };
    
    resize();
    window.addEventListener("resize", resize);
    
    // 选择渲染函数
    const renderers: Record<LiveWallpaperType, (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void> = {
      none: () => {},
      nebula: renderNebula,
      matrix: renderMatrix,
      particles: renderParticles,
      waves: renderWaves,
    };
    
    const render = renderers[wallpaperType] || renderers.nebula;
    
    const animate = (time: number) => {
      // 简单的节流，避免在不可见时过度渲染
      if (document.hidden) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // FPS 计算
      fpsRef.current.frames++;
      if (time - fpsRef.current.lastTime >= 1000) {
        fpsRef.current.fps = fpsRef.current.frames;
        fpsRef.current.frames = 0;
        fpsRef.current.lastTime = time;
        if (showFps) setFps(fpsRef.current.fps);
      }
      
      render(ctx, width, height, time);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [enabled, wallpaperType, renderNebula, renderMatrix, renderParticles, renderWaves, showFps]);

  if (!enabled) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        className={className}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          opacity,
          transition: "opacity 0.5s ease", // 平滑过渡透明度
        }}
      />
      {showFps && (
        <div
          style={{
            position: "fixed",
            top: 8,
            right: 8,
            zIndex: 9999,
            padding: "4px 8px",
            background: "rgba(0,0,0,0.6)",
            color: "#00FF00",
            fontSize: 12,
            fontFamily: "monospace",
            borderRadius: 4,
            pointerEvents: "none",
          }}
        >
          FPS: {fps}
        </div>
      )}
    </>
  );
});
