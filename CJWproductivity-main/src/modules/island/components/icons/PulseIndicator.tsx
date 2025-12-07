/**
 * @file PulseIndicator.tsx
 * @description 脉冲动画指示器
 */

import { motion } from "framer-motion";

interface PulseIndicatorProps {
  color: string;
  size?: number;
}

export const PulseIndicator = ({ color, size = 8 }: PulseIndicatorProps) => (
  <div style={{ position: "relative", width: size, height: size }}>
    <motion.div
      animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
      }}
    />
    <div style={{
      position: "absolute",
      width: size,
      height: size,
      borderRadius: "50%",
      background: color,
    }} />
  </div>
);
