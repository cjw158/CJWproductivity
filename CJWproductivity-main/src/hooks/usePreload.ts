import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getTasksByKanban, getAllTasks } from "@/lib/tasks";
import { getNotes, getFolders } from "@/lib/notes";
import { TASKS_QUERY_KEY, KANBAN_QUERY_KEY } from "./useTasks";
import { NOTES_QUERY_KEY, FOLDERS_QUERY_KEY } from "./useNotes";

// 预加载所有关键数据
export function usePreloadData() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // 并行预加载所有数据
    Promise.all([
      queryClient.prefetchQuery({
        queryKey: KANBAN_QUERY_KEY,
        queryFn: getTasksByKanban,
        staleTime: 1000 * 60 * 5,
      }),
      queryClient.prefetchQuery({
        queryKey: TASKS_QUERY_KEY,
        queryFn: getAllTasks,
        staleTime: 1000 * 60 * 5,
      }),
      // 预加载笔记数据
      queryClient.prefetchQuery({
        queryKey: [...NOTES_QUERY_KEY, "all"],
        queryFn: () => getNotes("all"),
        staleTime: 1000 * 60 * 5,
      }),
      queryClient.prefetchQuery({
        queryKey: FOLDERS_QUERY_KEY,
        queryFn: getFolders,
        staleTime: 1000 * 60 * 5,
      }),
    ]).catch((err) => {
      if (err && Object.keys(err).length > 0) {
        console.error("Preload error:", err);
      }
    });
  }, [queryClient]);
}

// 预加载组件
export function usePreloadComponents() {
  useEffect(() => {
    // 立即预加载最重要的组件
    const immediateTimer = setTimeout(() => {
      // 优先预加载 RichTextEditor（最重的组件）
      import("@/components/RichTextEditor");
      import("@/components/NotesLayout");
    }, 500);

    // 延迟预加载其他视图组件
    const delayedTimer = setTimeout(() => {
      import("@/components/PlansView");
      import("@/components/CalendarView");
    }, 1500);

    return () => {
      clearTimeout(immediateTimer);
      clearTimeout(delayedTimer);
    };
  }, []);
}
