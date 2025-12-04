/**
 * @file TasksView.tsx
 * @description 任务视图 - 纯日历模式
 */

import { memo } from "react";
import { CalendarView } from "./CalendarView";

export const TasksView = memo(function TasksView() {
  return <CalendarView />;
});

export default TasksView;
