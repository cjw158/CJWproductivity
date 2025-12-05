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
  type UpdateNoteInput,
  type Note,
  type Folder
} from "@/lib/notes";

export const NOTES_QUERY_KEY = ["notes"];
export const FOLDERS_QUERY_KEY = ["folders"];

// ============ 性能优化配置 ============
const CACHE_CONFIG = {
  // 文件夹很少变化，5分钟内认为是新鲜的
  folders: {
    staleTime: 5 * 60 * 1000, // 5分钟
    gcTime: 30 * 60 * 1000, // 30分钟后垃圾回收
  },
  // 笔记需要更频繁刷新，但也不需要每3秒
  notes: {
    staleTime: 10 * 1000, // 10秒
    gcTime: 5 * 60 * 1000, // 5分钟后垃圾回收
    refetchInterval: 30000, // 30秒轮询（降低频率以提升性能）
  }
};

// ============ Folders ============

export function useFolders() {
  return useQuery({
    queryKey: FOLDERS_QUERY_KEY,
    queryFn: getFolders,
    staleTime: CACHE_CONFIG.folders.staleTime,
    gcTime: CACHE_CONFIG.folders.gcTime,
    refetchOnWindowFocus: true,
    refetchOnMount: false, // 挂载时不重复请求（如果数据已缓存）
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => createFolder(name),
    // 乐观更新：立即在UI中显示新文件夹
    onMutate: async (name) => {
      await queryClient.cancelQueries({ queryKey: FOLDERS_QUERY_KEY });
      
      const previousFolders = queryClient.getQueryData<Folder[]>(FOLDERS_QUERY_KEY);
      
      // 乐观添加新文件夹（使用稳定的临时ID格式）
      const tempId = `__temp_folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const tempFolder: Folder = {
        id: tempId,
        name,
        type: "user",
        icon: "Folder",
      };
      
      queryClient.setQueryData<Folder[]>(FOLDERS_QUERY_KEY, (old = []) => [...old, tempFolder]);
      
      return { previousFolders, tempId };
    },
    onSuccess: (newFolder, _variables, context) => {
      // 用真实数据替换临时数据
      queryClient.setQueryData<Folder[]>(FOLDERS_QUERY_KEY, (old = []) => 
        old.map(f => f.id === context?.tempId ? newFolder : f)
      );
    },
    onError: (_err, _variables, context) => {
      // 出错时回滚
      if (context?.previousFolders) {
        queryClient.setQueryData(FOLDERS_QUERY_KEY, context.previousFolders);
      }
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (folderId: string) => deleteFolder(folderId),
    // 乐观更新：立即在UI中移除文件夹
    onMutate: async (folderId) => {
      await queryClient.cancelQueries({ queryKey: FOLDERS_QUERY_KEY });
      
      const previousFolders = queryClient.getQueryData<Folder[]>(FOLDERS_QUERY_KEY);
      
      // 乐观移除文件夹
      queryClient.setQueryData<Folder[]>(FOLDERS_QUERY_KEY, (old = []) => 
        old.filter(f => f.id !== folderId)
      );
      
      return { previousFolders };
    },
    onError: (_err, _variables, context) => {
      // 出错时回滚
      if (context?.previousFolders) {
        queryClient.setQueryData(FOLDERS_QUERY_KEY, context.previousFolders);
      }
    },
    onSettled: () => {
      // 操作完成后刷新笔记列表（文件夹删除会影响笔记）
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY });
    },
  });
}

// ============ Notes ============

export function useNotes(folderId: string = "all") {
  return useQuery({
    queryKey: [...NOTES_QUERY_KEY, folderId],
    queryFn: () => getNotes(folderId),
    staleTime: CACHE_CONFIG.notes.staleTime,
    gcTime: CACHE_CONFIG.notes.gcTime,
    refetchInterval: CACHE_CONFIG.notes.refetchInterval,
    refetchOnWindowFocus: true,
    refetchOnMount: true, // 切换文件夹时需要刷新
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateNoteInput) => createNote(input),
    // 乐观更新：立即在UI中显示新笔记
    onMutate: async (input) => {
      const folderId = input.folder_id || "all";
      await queryClient.cancelQueries({ queryKey: [...NOTES_QUERY_KEY, folderId] });
      
      const previousNotes = queryClient.getQueryData<Note[]>([...NOTES_QUERY_KEY, folderId]);
      
      // 乐观添加新笔记（使用唯一负数ID避免冲突）
      const tempId = -(Date.now() * 1000 + Math.floor(Math.random() * 1000));
      const tempNote: Note = {
        id: tempId,
        title: "新笔记",
        content: input.content,
        folder_id: folderId,
        is_pinned: input.is_pinned || false,
        tags: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      queryClient.setQueryData<Note[]>([...NOTES_QUERY_KEY, folderId], (old = []) => [tempNote, ...old]);
      
      return { previousNotes, folderId, tempId };
    },
    onSuccess: (newNote, _variables, context) => {
      if (!context) return;
      // 用真实数据替换临时数据
      queryClient.setQueryData<Note[]>([...NOTES_QUERY_KEY, context.folderId], (old = []) => 
        old.map(n => n.id === context.tempId ? newNote : n)
      );
      // 如果在"全部笔记"视图，也需要更新
      if (context.folderId !== "all") {
        queryClient.invalidateQueries({ queryKey: [...NOTES_QUERY_KEY, "all"] });
      }
    },
    onError: (_err, _variables, context) => {
      // 出错时回滚
      if (context?.previousNotes) {
        queryClient.setQueryData([...NOTES_QUERY_KEY, context.folderId], context.previousNotes);
      }
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateNoteInput }) =>
      updateNote(id, input),
    // 乐观更新：立即在UI中反映变化
    onMutate: async ({ id, input }) => {
      // 取消所有笔记相关查询
      await queryClient.cancelQueries({ queryKey: NOTES_QUERY_KEY });
      
      // 获取所有缓存的笔记查询
      const queries = queryClient.getQueriesData<Note[]>({ queryKey: NOTES_QUERY_KEY });
      
      // 在所有缓存中乐观更新
      queries.forEach(([queryKey, notes]) => {
        if (notes) {
          queryClient.setQueryData<Note[]>(queryKey, 
            notes.map(n => n.id === id ? { ...n, ...input, updated_at: new Date().toISOString() } : n)
          );
        }
      });
      
      return { queries };
    },
    onError: (_err, _variables, context) => {
      // 出错时回滚所有缓存
      context?.queries.forEach(([queryKey, notes]) => {
        queryClient.setQueryData(queryKey, notes);
      });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteNote(id),
    // 乐观更新：立即从UI中移除笔记
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: NOTES_QUERY_KEY });
      
      const queries = queryClient.getQueriesData<Note[]>({ queryKey: NOTES_QUERY_KEY });
      
      // 在所有缓存中乐观移除
      queries.forEach(([queryKey, notes]) => {
        if (notes) {
          queryClient.setQueryData<Note[]>(queryKey, notes.filter(n => n.id !== id));
        }
      });
      
      return { queries };
    },
    onError: (_err, _variables, context) => {
      // 出错时回滚所有缓存
      context?.queries.forEach(([queryKey, notes]) => {
        queryClient.setQueryData(queryKey, notes);
      });
    },
  });
}
