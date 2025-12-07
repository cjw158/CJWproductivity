/**
 * @file components/IslandPomodoro.tsx
 * @description 灵动岛番茄钟组件 - 显示和控制番茄钟
 */

import { memo } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw } from "lucide-react";
import { CircularProgress } from "./icons";
import { SYSTEM_FONT } from "../constants";
import type { IslandColors } from "../constants";
import type { UsePomodoroReturn } from "../hooks/usePomodoro";

interface IslandPomodoroProps {
  pomodoro: UsePomodoroReturn;
  colors: IslandColors;
}

/**
 * 番茄钟组件
 * 显示番茄钟状态，支持开始/暂停/重置/调整时长
 */
export const IslandPomodoro = memo(function IslandPomodoro({
  pomodoro,
  colors,
}: IslandPomodoroProps) {
  const {
    minutes,
    remaining,
    isActive,
    progress,
    start,
    reset,
    formatTime,
    handleWheel,
  } = pomodoro;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: "0 20px",
      }}
    >
      {/* 环形进度 */}
      <div 
        style={{ position: "relative", cursor: isActive ? "default" : "ns-resize" }}
        onWheel={handleWheel}
      >
        <CircularProgress 
          progress={progress} 
          size={48} 
          color={isActive ? colors.accent : colors.textMuted} 
          strokeWidth={3} 
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: SYSTEM_FONT,
            color: colors.text,
          }}
        >
          {remaining > 0 ? formatTime(remaining) : minutes}
        </div>
      </div>

      {/* 时间显示 */}
      {remaining > 0 && (
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            fontFamily: SYSTEM_FONT,
            color: colors.accent,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "-0.5px",
          }}
        >
          {formatTime(remaining)}
        </div>
      )}

      {/* 控制按钮 */}
      <div style={{ display: "flex", gap: 8 }}>
        {/* 开始/暂停按钮 */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={start}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: isActive ? colors.cardBg : colors.accent,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: isActive ? colors.text : "#fff",
          }}
        >
          {isActive ? <Pause size={16} /> : <Play size={16} />}
        </motion.button>

        {/* 重置按钮 */}
        {remaining > 0 && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={reset}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: colors.cardBg,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: colors.textMuted,
            }}
          >
            <RotateCcw size={16} />
          </motion.button>
        )}
      </div>

      {/* 提示文字 */}
      {!isActive && remaining === 0 && (
        <div
          style={{
            fontSize: 12,
            color: colors.textMuted,
            fontFamily: SYSTEM_FONT,
          }}
        >
          滚轮调节时长
        </div>
      )}
    </motion.div>
  );
});
