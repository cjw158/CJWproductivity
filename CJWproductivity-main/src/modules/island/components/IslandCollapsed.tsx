/**
 * @file components/IslandCollapsed.tsx
 * @description 灵动岛收起状态组件 - 显示当前进行中的任务
 */

import { memo } from "react";
import { motion } from "framer-motion";
import { PulseIndicator, CircularProgress } from "./icons";
import { SYSTEM_FONT } from "../constants";
import type { IslandColors } from "../constants";
import type { Task } from "@/lib/tasks";
import { getTaskRemaining, formatRemaining, parseScheduledTime } from "@/utils";

interface IslandCollapsedProps {
  activeTasks: Task[];
  nextTask: Task | null;
  colors: IslandColors;
  now: Date;
}

/**
 * 灵动岛收起状态
 * 显示正在进行的任务或下一个即将开始的任务
 */
export const IslandCollapsed = memo(function IslandCollapsed({
  activeTasks,
  nextTask,
  colors,
  now,
}: IslandCollapsedProps) {
  return (
    <motion.div
      key="collapsed"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: "0 16px",
      }}
    >
      {activeTasks.length > 0 ? (
        // 显示正在进行的任务
        activeTasks.map((task, idx) => {
          const remaining = getTaskRemaining(task, now);
          
          // 计算进度：基于任务的计划时间和时长
          let progress = 0;
          if (task.scheduled_time) {
            const start = parseScheduledTime(task.scheduled_time);
            const duration = task.duration || 30;
            if (start) {
              const totalMs = duration * 60000;
              const elapsed = now.getTime() - start.getTime();
              progress = Math.min((elapsed / totalMs) * 100, 100);
            }
          }

          return (
            <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* 任务分隔符 */}
              {idx > 0 && (
                <div style={{ width: 1, height: 16, background: colors.border, marginRight: 8 }} />
              )}
              
              {/* 进度环和脉冲指示器 */}
              <div style={{ position: 'relative', width: 14, height: 14 }}>
                <div style={{ position: 'absolute', top: -1, left: -1 }}>
                  <CircularProgress progress={progress} size={16} color={colors.success} strokeWidth={2} />
                </div>
                <div style={{ position: 'absolute', top: 3, left: 3 }}>
                  <PulseIndicator color={colors.success} size={8} />
                </div>
              </div>
              
              {/* 任务名称 */}
              <span style={{ 
                color: colors.text, 
                fontSize: 14, 
                fontWeight: 600,
                fontFamily: SYSTEM_FONT,
                maxWidth: "none",
                whiteSpace: "nowrap",
                letterSpacing: "-0.2px",
              }}>
                {task.content}
              </span>
              
              {/* 剩余时间 */}
              {remaining && (
                <span style={{ 
                  color: colors.accent, 
                  fontSize: 14, 
                  fontWeight: 700,
                  fontFamily: SYSTEM_FONT,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.3px",
                }}>
                  {formatRemaining(remaining)}
                </span>
              )}
            </div>
          );
        })
      ) : nextTask ? (
        // 显示下一个即将开始的任务
        <div style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.8 }}>
          <span style={{ 
            color: colors.textMuted, 
            fontSize: 12,
            fontFamily: SYSTEM_FONT,
          }}>
            即将开始:
          </span>
          <span style={{ 
            color: colors.text, 
            fontSize: 13, 
            fontWeight: 600,
            fontFamily: SYSTEM_FONT,
            maxWidth: "none",
            whiteSpace: "nowrap"
          }}>
            {nextTask.content}
          </span>
          <span style={{ 
            color: colors.accent, 
            fontSize: 12, 
            fontWeight: 500,
            fontFamily: SYSTEM_FONT,
          }}>
            {nextTask.scheduled_time}
          </span>
        </div>
      ) : (
        // 无任务状态
        <span style={{ 
          color: colors.textMuted, 
          fontSize: 14, 
          fontWeight: 400,
          fontFamily: SYSTEM_FONT,
        }}>
          暂无进行中任务
        </span>
      )}
    </motion.div>
  );
});
