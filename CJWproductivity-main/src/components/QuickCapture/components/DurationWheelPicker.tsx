/**
 * @file DurationWheelPicker.tsx
 * @description 时长选择器组件
 */

import { memo } from "react";
import { cn } from "@/lib/utils";
import { WheelPicker } from "./WheelPicker";

interface DurationWheelPickerProps {
  value: number;
  onChange: (value: number) => void;
  isDark: boolean;
  color: string;
}

const DURATION_PRESETS = [15, 30, 45, 60];

export const DurationWheelPicker = memo(function DurationWheelPicker({
  value,
  onChange,
  isDark,
  color,
}: DurationWheelPickerProps) {
  const formatDuration = (v: number): string => {
    if (v < 60) return `${v}`;
    return `${Math.floor(v / 60)}:${(v % 60).toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-3">
      <WheelPicker
        value={value}
        onChange={onChange}
        min={5}
        max={180}
        step={5}
        format={formatDuration}
        isDark={isDark}
        color={color}
      />
      <div className="flex flex-col gap-1">
        {DURATION_PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => onChange(preset)}
            className={cn(
              "px-2 py-0.5 rounded text-xs transition-colors",
              value === preset
                ? "text-white"
                : isDark
                  ? "text-white/40 hover:text-white/70"
                  : "text-gray-400 hover:text-gray-600"
            )}
            style={value === preset ? { backgroundColor: color } : undefined}
          >
            {preset < 60 ? `${preset}分` : `${preset / 60}h`}
          </button>
        ))}
      </div>
    </div>
  );
});
