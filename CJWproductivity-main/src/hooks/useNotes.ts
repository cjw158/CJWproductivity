import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFolders,
  getNotes,
  createNote,
  updateNote,
  deleteNote,
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
