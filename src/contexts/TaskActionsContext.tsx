/**
 * @file TaskActionsContext.tsx
 * @description 统一任务操作 Context
 * 
 * 设计目的:
 * 1. 集中管理所有任务操作（创建、更新、删除、移动）
 * 2. 避免各组件重复调用 hooks
 * 3. 统一处理操作反馈（toast）
 * 4. 提供业务约束（如 DOING 限制）
 */

import { createContext, useContext, useCallback, type ReactNode } from "react";
import {
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useMoveTaskStatus,
  useAllTasks,
} from "@/hooks/useTasks";
import { toast } from "@/hooks/useToast";
import { DOING_LIMIT, DEFAULT_TASK_DURATION, TASK_STATUS } from "@/config/constants";
import type { Task, TaskStatus, CreateTaskInput, UpdateTaskInput } from "@/lib/tasks";

// ============ 类型定义 ============

interface TaskActionsContextValue {
  /** 所有任务 */
  tasks: Task[];
  /** 是否加载中 */
  isLoading: boolean;
  
  /** 创建任务 */
  createTask: (input: CreateTaskInput) => Promise<Task | null>;
  /** 更新任务 */
  updateTask: (id: number, input: UpdateTaskInput) => Promise<boolean>;
  /** 删除任务 */
  deleteTask: (id: number) => Promise<boolean>;
  
  /** 切换任务完成状态 */
  toggleTask: (task: Task) => Promise<boolean>;
  /** 移动任务到指定状态 */
  moveToStatus: (taskId: number, status: TaskStatus) => Promise<boolean>;
  
  /** 排期任务到时间 */
  scheduleToTime: (taskId: number, date: string, time: string, duration?: number) => Promise<boolean>;
  /** 排期任务到日期 */
  scheduleToDate: (taskId: number, date: string) => Promise<boolean>;
}

// ============ Context ============

const TaskActionsContext = createContext<TaskActionsContextValue | null>(null);

// ============ Provider ============

interface TaskActionsProviderProps {
  children: ReactNode;
}

export function TaskActionsProvider({ children }: TaskActionsProviderProps) {
  const { data: tasks = [], isLoading } = useAllTasks();
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();
  const moveMutation = useMoveTaskStatus();

  /**
   * 创建任务
   */
  const createTask = useCallback(async (input: CreateTaskInput): Promise<Task | null> => {
    try {
      const task = await createMutation.mutateAsync(input);
      toast({ title: "已创建", description: "任务已添加" });
      return task;
    } catch (error) {
      toast({ title: "创建失败", variant: "destructive" });
      return null;
    }
  }, [createMutation]);

  /**
   * 更新任务
   */
  const updateTask = useCallback(async (id: number, input: UpdateTaskInput): Promise<boolean> => {
    try {
      await updateMutation.mutateAsync({ id, input });
      return true;
    } catch (error) {
      toast({ title: "更新失败", variant: "destructive" });
      return false;
    }
  }, [updateMutation]);

  /**
   * 删除任务
   */
  const deleteTask = useCallback(async (id: number): Promise<boolean> => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({ title: "已删除", description: "任务已移除" });
      return true;
    } catch (error) {
      toast({ title: "删除失败", variant: "destructive" });
      return false;
    }
  }, [deleteMutation]);

  /**
   * 切换任务完成状态
   */
  const toggleTask = useCallback(async (task: Task): Promise<boolean> => {
    const newStatus = task.status === TASK_STATUS.DONE ? TASK_STATUS.TODO : TASK_STATUS.DONE;
    try {
      await updateMutation.mutateAsync({
        id: task.id,
        input: { status: newStatus },
      });
      return true;
    } catch (error) {
      toast({ title: "操作失败", variant: "destructive" });
      return false;
    }
  }, [updateMutation]);

  /**
   * 移动任务到指定状态
   * 包含 DOING 数量限制检查
   */
  const moveToStatus = useCallback(async (taskId: number, status: TaskStatus): Promise<boolean> => {
    // DOING 限制检查
    if (status === TASK_STATUS.DOING) {
      const doingCount = tasks.filter(t => t.status === TASK_STATUS.DOING).length;
      if (doingCount >= DOING_LIMIT) {
        toast({
          title: "专注区已满",
          description: `专注区最多只能有 ${DOING_LIMIT} 个任务`,
          variant: "destructive",
        });
        return false;
      }
    }

    try {
      await moveMutation.mutateAsync({ id: taskId, status });
      return true;
    } catch (error) {
      toast({ title: "移动失败", variant: "destructive" });
      return false;
    }
  }, [tasks, moveMutation]);

  /**
   * 排期任务到具体时间
   */
  const scheduleToTime = useCallback(async (
    taskId: number,
    date: string,
    time: string,
    duration: number = DEFAULT_TASK_DURATION
  ): Promise<boolean> => {
    try {
      await updateMutation.mutateAsync({
        id: taskId,
        input: { due_date: date, scheduled_time: time, duration },
      });
      toast({ title: "已排期", description: `任务已安排到 ${time}` });
      return true;
    } catch (error) {
      toast({ title: "排期失败", variant: "destructive" });
      return false;
    }
  }, [updateMutation]);

  /**
   * 排期任务到日期（保留已有时间）
   */
  const scheduleToDate = useCallback(async (taskId: number, date: string): Promise<boolean> => {
    try {
      await updateMutation.mutateAsync({
        id: taskId,
        input: { due_date: date },
      });
      return true;
    } catch (error) {
      toast({ title: "排期失败", variant: "destructive" });
      return false;
    }
  }, [updateMutation]);

  const value: TaskActionsContextValue = {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    toggleTask,
    moveToStatus,
    scheduleToTime,
    scheduleToDate,
  };

  return (
    <TaskActionsContext.Provider value={value}>
      {children}
    </TaskActionsContext.Provider>
  );
}

// ============ Hook ============

/**
 * 使用任务操作
 * @returns TaskActionsContextValue
 * @throws 如果未在 Provider 内使用
 */
export function useTaskActions(): TaskActionsContextValue {
  const context = useContext(TaskActionsContext);
  if (!context) {
    throw new Error("useTaskActions must be used within TaskActionsProvider");
  }
  return context;
}
