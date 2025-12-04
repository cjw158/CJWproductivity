/**
 * @file TimeWheelPicker.tsx
 * @description 时间选择器组件 (时:分)
 */

import { memo, useState, useEffect, useRef } from "react";
import { WheelPicker } from "./WheelPicker";

interface TimeWheelPickerProps {
  value: string | null;
  onChange: (value: string) => void;
  isDark: boolean;
  color: string;
}

export const TimeWheelPicker = memo(function TimeWheelPicker({
  value,
  onChange,
  isDark,
  color,
}: TimeWheelPickerProps) {
  const initialHour = value ? parseInt(value.split(":")[0]) : new Date().getHours();
  const initialMinute = value ? parseInt(value.split(":")[1]) : 0;

  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onChange(
      `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
    );
  }, [hour, minute, onChange]);

  return (
    <div className="flex items-center gap-1">
      <WheelPicker
        value={hour}
        onChange={setHour}
        min={0}
        max={23}
        step={1}
        format={(v) => v.toString().padStart(2, "0")}
        isDark={isDark}
        color={color}
      />
      <span className="text-2xl font-bold" style={{ color }}>
        :
      </span>
      <WheelPicker
        value={minute}
        onChange={setMinute}
        min={0}
        max={55}
        step={5}
        format={(v) => v.toString().padStart(2, "0")}
        isDark={isDark}
        color={color}
      />
    </div>
  );
});
