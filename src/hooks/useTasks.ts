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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
}

// ============ 更新任务 ============

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateTaskInput }) =>
      updateTask(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
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

      // Optimistic update
      if (previousKanban) {
        const task = Object.values(previousKanban)
          .flat()
          .find((t) => t.id === id);
        
        if (task) {
          const oldStatus = task.status;
          const newKanban = { ...previousKanban };
          newKanban[oldStatus] = newKanban[oldStatus].filter((t) => t.id !== id);
          newKanban[status] = [...newKanban[status], { ...task, status }];
          queryClient.setQueryData(KANBAN_QUERY_KEY, newKanban);
        }
      }

      return { previousKanban };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousKanban) {
        queryClient.setQueryData(KANBAN_QUERY_KEY, context.previousKanban);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
}

// ============ 删除任务 ============

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
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

      if (previousKanban) {
        const task = Object.values(previousKanban)
          .flat()
          .find((t) => t.id === id);
        
        if (task) {
          const oldStatus = task.status;
          const newKanban = { ...previousKanban };
          newKanban[oldStatus] = newKanban[oldStatus].filter((t) => t.id !== id);
          newKanban.DONE = [...newKanban.DONE, { ...task, status: "DONE" as TaskStatus }];
          queryClient.setQueryData(KANBAN_QUERY_KEY, newKanban);
        }
      }

      return { previousKanban };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousKanban) {
        queryClient.setQueryData(KANBAN_QUERY_KEY, context.previousKanban);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
    },
  });
}

