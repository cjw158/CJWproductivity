import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllTasks,
  getTasksByKanban,
  getTasksByStatus,
  getActiveTasks,
  getDoingTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  type Task,
  type TaskStatus,
  type CreateTaskInput,
  type UpdateTaskInput,
} from "@/lib/tasks";

export const TASKS_QUERY_KEY = ["tasks"];
export const KANBAN_QUERY_KEY = ["tasks", "kanban"];

// ============ 基础查询 ============

export function useTasks() {
  return useQuery({
    queryKey: TASKS_QUERY_KEY,
    queryFn: getAllTasks,
  });
}

export function useAllTasks() {
  return useQuery({
    queryKey: [...TASKS_QUERY_KEY, "all"],
    queryFn: getAllTasks,
  });
}

export function useActiveTasks() {
  return useQuery({
    queryKey: [...TASKS_QUERY_KEY, "active"],
    queryFn: getActiveTasks,
  });
}

export function useTasksByStatus(status: TaskStatus) {
  return useQuery({
    queryKey: [...TASKS_QUERY_KEY, "status", status],
    queryFn: () => getTasksByStatus(status),
  });
}

export function useDoingTasks() {
  return useQuery({
    queryKey: [...TASKS_QUERY_KEY, "doing"],
    queryFn: getDoingTasks,
  });
}

export function useKanbanTasks() {
  return useQuery({
    queryKey: KANBAN_QUERY_KEY,
    queryFn: getTasksByKanban,
  });
}

// ============ 创建任务 ============

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onSuccess: (newTask) => {
      // 乐观更新：直接更新缓存而不是 invalidate
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (old) => 
        old ? [newTask, ...old] : [newTask]
      );
      queryClient.setQueryData<Task[]>([...TASKS_QUERY_KEY, "all"], (old) => 
        old ? [newTask, ...old] : [newTask]
      );
      // 刷新相关查询以确保一致性
      queryClient.invalidateQueries({ queryKey: KANBAN_QUERY_KEY });
    },
  });
}

// ============ 更新任务 ============

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateTaskInput }) =>
      updateTask(id, input),
    onSuccess: (updatedTask) => {
      // 乐观更新：直接更新缓存
      const updateTaskInCache = (tasks: Task[] | undefined) => 
        tasks?.map(t => t.id === updatedTask.id ? updatedTask : t);
      
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, updateTaskInCache);
      queryClient.setQueryData<Task[]>([...TASKS_QUERY_KEY, "all"], updateTaskInCache);
      // 刷新看板视图
      queryClient.invalidateQueries({ queryKey: KANBAN_QUERY_KEY });
    },
  });
}

// ============ 移动任务状态 (看板) ============

export function useMoveTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) =>
      updateTaskStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });

      const previousKanban = queryClient.getQueryData<Record<TaskStatus, Task[]>>(KANBAN_QUERY_KEY);
      const previousTasks = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY);

      // Optimistic update - 同时更新 Kanban 和 Tasks 缓存
      if (previousKanban) {
        const task = Object.values(previousKanban)
          .flat()
          .find((t) => t.id === id);
        
        if (task) {
          const oldStatus = task.status;
          const updatedTask = { ...task, status, completed_at: status === "DONE" ? new Date().toISOString() : null };
          const newKanban = { ...previousKanban };
          newKanban[oldStatus] = newKanban[oldStatus].filter((t) => t.id !== id);
          newKanban[status] = [...newKanban[status], updatedTask];
          queryClient.setQueryData(KANBAN_QUERY_KEY, newKanban);
          
          // 同步更新 tasks 缓存
          if (previousTasks) {
            queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, 
              previousTasks.map(t => t.id === id ? updatedTask : t)
            );
          }
        }
      }

      return { previousKanban, previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousKanban) {
        queryClient.setQueryData(KANBAN_QUERY_KEY, context.previousKanban);
      }
      if (context?.previousTasks) {
        queryClient.setQueryData(TASKS_QUERY_KEY, context.previousTasks);
      }
    },
    onSettled: () => {
      // 只刷新 kanban，避免不必要的重新获取
      queryClient.invalidateQueries({ queryKey: KANBAN_QUERY_KEY });
    },
  });
}

// ============ 删除任务 ============

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteTask(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });
      
      const previousTasks = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY);
      
      // 乐观更新：立即从缓存中移除
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, 
          previousTasks.filter(t => t.id !== id)
        );
        queryClient.setQueryData<Task[]>([...TASKS_QUERY_KEY, "all"], 
          previousTasks.filter(t => t.id !== id)
        );
      }
      
      return { previousTasks };
    },
    onError: (_err, _id, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(TASKS_QUERY_KEY, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: KANBAN_QUERY_KEY });
    },
  });
}

// ============ 完成任务 ============

export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => updateTaskStatus(id, "DONE"),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });

      const previousKanban = queryClient.getQueryData<Record<TaskStatus, Task[]>>(KANBAN_QUERY_KEY);
      const previousTasks = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY);

      if (previousKanban) {
        const task = Object.values(previousKanban)
          .flat()
          .find((t) => t.id === id);
        
        if (task) {
          const oldStatus = task.status;
          const completedTask = { ...task, status: "DONE" as TaskStatus, completed_at: new Date().toISOString() };
          const newKanban = { ...previousKanban };
          newKanban[oldStatus] = newKanban[oldStatus].filter((t) => t.id !== id);
          newKanban.DONE = [...newKanban.DONE, completedTask];
          queryClient.setQueryData(KANBAN_QUERY_KEY, newKanban);
          
          // 同步更新 tasks 缓存
          if (previousTasks) {
            queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY,
              previousTasks.map(t => t.id === id ? completedTask : t)
            );
          }
        }
      }

      return { previousKanban, previousTasks };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousKanban) {
        queryClient.setQueryData(KANBAN_QUERY_KEY, context.previousKanban);
      }
      if (context?.previousTasks) {
        queryClient.setQueryData(TASKS_QUERY_KEY, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: KANBAN_QUERY_KEY });
    },
  });
}