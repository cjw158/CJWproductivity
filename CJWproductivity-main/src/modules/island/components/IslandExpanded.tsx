/**
 * @file components/IslandExpanded.tsx
 * @description 灵动岛展开状态组件 - 显示今日任务列表
 */

import { memo } from "react";
import { motion } from "framer-motion";
import { PulseIndicator, CheckIcon, CircleIcon } from "./icons";
import { SYSTEM_FONT } from "../constants";
import type { IslandColors } from "../constants";
import type { Task } from "@/lib/tasks";
import { getTaskRemaining, formatRemaining } from "@/utils";

interface IslandExpandedProps {
  todayTasks: Task[];
  activeTasks: Task[];
  colors: IslandColors;
  now: Date;
  onToggleTask: (e: React.MouseEvent, task: Task) => void;
  onStartTask: (e: React.MouseEvent, task: Task) => void;
}

/**
 * 灵动岛展开状态
 * 显示今日任务列表，支持完成/开始任务
 */
export const IslandExpanded = memo(function IslandExpanded({
  todayTasks,
  activeTasks,
  colors,
  now,
  onToggleTask,
  onStartTask,
}: IslandExpandedProps) {
  return (
    <motion.div
      key="expanded"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      style={{ 
        width: "100%", 
        height: "100%", 
        padding: 16,
        display: "flex", 
        flexDirection: "column",
      }}
    >
      {/* 头部 */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        marginBottom: 12,
        paddingBottom: 10,
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <span style={{ 
          color: colors.text, 
          fontSize: 15, 
          fontWeight: 700, 
          fontFamily: SYSTEM_FONT,
          letterSpacing: "-0.3px" 
        }}>
          今日任务
        </span>
        <span style={{ 
          color: colors.accent, 
          fontSize: 13, 
          fontWeight: 600,
          fontFamily: SYSTEM_FONT,
        }}>
          {todayTasks.filter(t => t.status === "DONE").length}/{todayTasks.length}
        </span>
      </div>
      
      {/* 任务列表 */}
      <div 
        className="hide-scrollbar"
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {todayTasks.length > 0 ? (
          todayTasks.map(task => {
            const isDone = task.status === "DONE";
            const isDoing = task.status === "DOING" || activeTasks.some(t => t.id === task.id);
            const remaining = getTaskRemaining(task, now);
            
            return (
              <div
                key={task.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 0",
                  borderBottom: `1px solid ${colors.cardBg}`,
                  cursor: "pointer"
                }}
              >
                {/* 状态图标 */}
                <div 
                  onClick={(e) => isDoing ? onToggleTask(e, task) : isDone ? onToggleTask(e, task) : onStartTask(e, task)}
                  style={{ cursor: "pointer", display: "flex" }}
                >
                  {isDone ? (
                    <CheckIcon color={colors.success} size={18} />
                  ) : isDoing ? (
                    <PulseIndicator color={colors.success} size={10} />
                  ) : (
                    <CircleIcon color={colors.textMuted} size={18} />
                  )}
                </div>
                
                {/* 任务名称 */}
                <span 
                  onClick={(e) => onStartTask(e, task)}
                  style={{
                    flex: 1,
                    fontSize: 14,
                    fontWeight: isDoing ? 600 : 500,
                    fontFamily: SYSTEM_FONT,
                    color: isDone ? colors.textMuted : colors.text,
                    textDecoration: isDone ? "line-through" : "none",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    letterSpacing: "-0.2px",
                    opacity: isDone ? 0.6 : 1
                  }}
                >
                  {task.content}
                </span>
                
                {/* 剩余时间或计划时间 */}
                {isDoing && remaining && (
                  <span style={{ 
                    fontSize: 13, 
                    fontWeight: 700,
                    fontFamily: SYSTEM_FONT,
                    color: colors.accent,
                    flexShrink: 0,
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "-0.3px",
                  }}>
                    {formatRemaining(remaining)}
                  </span>
                )}
                {!isDone && !isDoing && task.scheduled_time && (
                  <span style={{ 
                    fontSize: 12, 
                    fontWeight: 500,
                    fontFamily: SYSTEM_FONT,
                    color: colors.textMuted,
                    flexShrink: 0,
                  }}>
                    {task.scheduled_time}
                  </span>
                )}
              </div>
            );
          })
        ) : (
          // 空状态
          <div style={{ 
            flex: 1, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center",
            color: colors.textMuted,
            fontSize: 14,
            fontFamily: SYSTEM_FONT,
          }}>
            今日暂无任务
          </div>
        )}
      </div>
    </motion.div>
  );
});
