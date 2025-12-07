import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  getFolders,
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  restoreNote,
  permanentDeleteNote,
  emptyTrash,
  cleanupDeletedNotes,
  createFolder,
  deleteFolder,
  type CreateNoteInput,
  type UpdateNoteInput
} from "@/lib/notes";

export const NOTES_QUERY_KEY = ["notes"];
export const FOLDERS_QUERY_KEY = ["folders"];

// ============ Folders ============

export function useFolders() {
  return useQuery({
    queryKey: FOLDERS_QUERY_KEY,
    queryFn: getFolders,
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createFolder(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOLDERS_QUERY_KEY });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (folderId: string) => deleteFolder(folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOLDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
    },
  });
}

// ============ Notes ============

export function useNotes(folderId: string = "all") {
  return useQuery({
    queryKey: [...NOTES_QUERY_KEY, folderId],
    queryFn: () => getNotes(folderId),
    refetchInterval: 3000, // 每3秒自动刷新，确保跨窗口同步
    refetchOnWindowFocus: true,
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateNoteInput) => createNote(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateNoteInput }) =>
      updateNote(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
    },
  });
}

// ============ 回收站功能 ============

/**
 * 恢复已删除的笔记
 */
export function useRestoreNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => restoreNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
    },
  });
}

/**
 * 永久删除笔记
 */
export function usePermanentDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => permanentDeleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
    },
  });
}

/**
 * 清空回收站
 */
export function useEmptyTrash() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => emptyTrash(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
    },
  });
}

/**
 * 启动时自动清理超过7天的已删除笔记
 */
export function useAutoCleanupNotes() {
  useEffect(() => {
    // 启动时清理
    cleanupDeletedNotes(7).then(count => {
      if (count > 0) {
        console.log(`[notes] Auto-cleaned ${count} deleted notes older than 7 days`);
      }
    });
  }, []);
}
