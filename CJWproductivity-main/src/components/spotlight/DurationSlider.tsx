import { memo } from "react";
import { cn } from "@/lib/utils";

interface DurationSliderProps {
  value: number;
  onChange: (value: number) => void;
  isDark: boolean;
}

export const DurationSlider = memo(function DurationSlider({
  value,
  onChange,
  isDark,
}: DurationSliderProps) {
  const presets = [15, 30, 45, 60, 90, 120];

  return (
    <div className="space-y-3 pt-2">
      <input
        type="range"
        min="5"
        max="180"
        step="5"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
      />
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            onClick={() => onChange(preset)}
            className={cn(
              "px-2 py-1 rounded text-xs transition-colors",
              value === preset
                ? isDark
                  ? "bg-[var(--neon-cyan)] text-black font-medium"
                  : "bg-blue-500 text-white font-medium"
                : isDark
                  ? "bg-white/5 text-white/60 hover:bg-white/10"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {preset}m
          </button>
        ))}
        <span className={cn("ml-auto text-xs", isDark ? "text-white/40" : "text-gray-400")}>
          {value} 分钟
        </span>
      </div>
    </div>
  );
});