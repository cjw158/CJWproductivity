/**
 * @file components/IslandTaskList.tsx
 * @description 灵动岛任务列表组件 - 渲染任务列表
 */

import { memo } from "react";
import { PulseIndicator, CheckIcon, CircleIcon } from "./icons";
import { SYSTEM_FONT } from "../constants";
import type { IslandColors } from "../constants";
import type { Task } from "@/lib/tasks";
import { getTaskRemaining, formatRemaining } from "@/utils";

interface IslandTaskListProps {
  tasks: Task[];
  activeTasks: Task[];
  colors: IslandColors;
  now: Date;
  onToggleTask: (e: React.MouseEvent, task: Task) => void;
  onStartTask: (e: React.MouseEvent, task: Task) => void;
}

/**
 * 任务列表组件
 * 显示任务列表，支持完成/开始任务
 */
export const IslandTaskList = memo(function IslandTaskList({
  tasks,
  activeTasks,
  colors,
  now,
  onToggleTask,
  onStartTask,
}: IslandTaskListProps) {
  if (tasks.length === 0) {
    return (
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
    );
  }

  return (
    <>
      {tasks.map(task => {
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
      })}
    </>
  );
});
