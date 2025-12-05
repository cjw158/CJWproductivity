/**
 * @file WheelPicker.tsx
 * @description 滚轮选择器组件
 */

import { memo, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface WheelPickerProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  isDark: boolean;
  color: string;
}

export const WheelPicker = memo(function WheelPicker({
  value,
  onChange,
  min,
  max,
  step,
  format,
  isDark,
  color,
}: WheelPickerProps) {
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -step : step;
      onChange(Math.max(min, Math.min(max, value + delta)));
    },
    [value, onChange, min, max, step]
  );

  const increment = useCallback(() => {
    onChange(Math.min(max, value + step));
  }, [value, onChange, max, step]);

  const decrement = useCallback(() => {
    onChange(Math.max(min, value - step));
  }, [value, onChange, min, step]);

  return (
    <div className="flex flex-col items-center select-none" onWheel={handleWheel}>
      <motion.button
        onClick={increment}
        className={cn(
          "p-1 rounded-lg",
          isDark ? "hover:bg-white/10 text-white/40" : "hover:bg-gray-100 text-gray-400"
        )}
        whileTap={{ scale: 0.9 }}
      >
        <ChevronUp className="w-4 h-4" />
      </motion.button>

      <motion.div
        className="text-2xl font-bold tabular-nums py-1 px-3 rounded-lg cursor-ns-resize"
        style={{ color }}
        whileHover={{ scale: 1.05 }}
        title="滚动滚轮调整"
      >
        {format(value)}
      </motion.div>

      <motion.button
        onClick={decrement}
        className={cn(
          "p-1 rounded-lg",
          isDark ? "hover:bg-white/10 text-white/40" : "hover:bg-gray-100 text-gray-400"
        )}
        whileTap={{ scale: 0.9 }}
      >
        <ChevronDown className="w-4 h-4" />
      </motion.button>
    </div>
  );
});
