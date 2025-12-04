import { useState, useMemo, memo, useCallback, useRef, lazy, Suspense, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { 
  Folder, 
  Trash2, 
  Archive, 
  Plus, 
  Search, 
  FileText,
  Loader2,
  Maximize2,
  Minimize2,
  Eye,
  Edit3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useFolders, useNotes, useCreateNote, useUpdateNote, useDeleteNote, useCreateFolder, useDeleteFolder } from "@/hooks/useNotes";
import type { Note, Folder as FolderType } from "@/lib/notes";
import { GlassPanel, SpotlightCard, NeonInput, LivelyIcon } from "@/components/ui/visual-effects";
import { extractH1Title, stripHtml } from "@/utils";

// 懒加载重型编辑器组件
const RichTextEditor = lazy(() => 
  import("./RichTextEditor").then(m => ({ default: m.RichTextEditor }))
);

// 左侧边栏 - 文件夹
const Sidebar = memo(function Sidebar({ 
  folders, 
  activeFolder, 
  onSelectFolder,
  onCreateFolder,
  onDeleteFolder,
  isDark 
}: { 
  folders: FolderType[], 
  activeFolder: string, 
  onSelectFolder: (id: string) => void,
  onCreateFolder: (name: string) => void,
  onDeleteFolder: (id: string) => void,
  isDark: boolean 
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  
  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim());
      setNewFolderName("");
      setIsCreating(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreateFolder();
    } else if (e.key === "Escape") {
      setIsCreating(false);
      setNewFolderName("");
    }
  };

  return (
    <GlassPanel 
      intensity="high"
      className="w-64 flex-none border-r flex flex-col"
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className={cn("text-xs font-medium tracking-wider", isDark ? "text-white/40" : "text-gray-400")}>
            文件夹
          </h2>
          <button
            onClick={() => setIsCreating(true)}
            className={cn(
              "p-1 rounded transition-colors",
              isDark ? "hover:bg-white/10 text-white/40 hover:text-white" : "hover:bg-gray-200 text-gray-400 hover:text-gray-600"
            )}
            title="新建文件夹"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        {/* 新建文件夹输入框 */}
        {isCreating && (
          <div className="mb-3">
            <NeonInput
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (!newFolderName.trim()) {
                  setIsCreating(false);
                }
              }}
              placeholder="文件夹名称..."
              autoFocus
              className={isDark ? "bg-white/5" : "bg-white border-gray-200"}
            />
          </div>
        )}
        
        <nav className="space-y-1">
          {folders.map(folder => {
            const Icon = folder.icon === "Archive" ? Archive : folder.icon === "Trash2" ? Trash2 : Folder;
            const isActive = activeFolder === folder.id;
            
            return (
              <button
                key={folder.id}
                onClick={() => onSelectFolder(folder.id)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors group",
                  isActive
                    ? isDark 
                      ? "bg-white/10 text-white" 
                      : "bg-blue-50 text-blue-700"
                    : isDark 
                      ? "text-white/60 hover:bg-white/5 hover:text-white" 
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("w-4 h-4", isActive ? (isDark ? "text-[var(--color-memo)]" : "text-blue-600") : "opacity-70")} />
                  <span>{folder.name}</span>
                </div>
                {/* 仅用户文件夹显示删除按钮 (示例：type === 'user') */}
                {folder.type === "user" && (
                  <div 
                    className={cn(
                      "opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/10 hover:text-red-500",
                      isDark ? "text-white/40" : "text-gray-400"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFolder(folder.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </GlassPanel>
  );
});

// 中间栏 - 笔记列表
const NoteList = memo(function NoteList({ 
  notes, 
  activeNoteId, 
  onSelectNote, 
  onCreateNote,
  onMoveNote,
  onTogglePin,
  onDeleteNote,
  folders,
  isDark 
}: { 
  notes: Note[], 
  activeNoteId: number | null, 
  onSelectNote: (note: Note) => void,
  onCreateNote: () => void,
  onMoveNote: (noteId: number, folderId: string) => void,
  onTogglePin: (noteId: number, isPinned: boolean) => void,
  onDeleteNote: (noteId: number) => void,
  folders: FolderType[],
  isDark: boolean 
}) {
  const [search, setSearch] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; note: Note } | null>(null);

  // 关闭右键菜单
  const closeContextMenu = useCallback(() => setContextMenu(null), []);
  
  // 点击或右键其他地方关闭菜单
  useEffect(() => {
    if (contextMenu) {
      const handleClick = () => closeContextMenu();
      const handleContextMenu = (e: MouseEvent) => {
        // 检查右键是否在当前菜单外部（延迟检测避免同一事件触发）
        const target = e.target as HTMLElement;
        const menuEl = document.querySelector('[data-note-context-menu]');
        if (menuEl && !menuEl.contains(target)) {
          closeContextMenu();
        }
      };
      document.addEventListener("click", handleClick);
      // 延迟添加 contextmenu 监听，避免打开菜单的右键事件立即触发关闭
      const timer = setTimeout(() => {
        document.addEventListener("contextmenu", handleContextMenu);
      }, 0);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("click", handleClick);
        document.removeEventListener("contextmenu", handleContextMenu);
      };
    }
  }, [contextMenu, closeContextMenu]);
  
  const filteredNotes = useMemo(() => {
    if (!search) return notes;
    return notes.filter(n => {
      const title = extractH1Title(n.content).toLowerCase();
      const content = stripHtml(n.content).toLowerCase();
      const searchLower = search.toLowerCase();
      return title.includes(searchLower) || content.includes(searchLower);
    });
  }, [notes, search]);

  return (
    <GlassPanel 
      intensity="medium"
      className="w-80 flex-none border-r flex flex-col"
    >
      {/* 搜索与添加 */}
      <div className="p-4 border-b border-transparent">
        <div className="relative mb-4">
          <Search className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 z-10", isDark ? "text-white/30" : "text-gray-400")} />
          <NeonInput
            type="text"
            placeholder="搜索笔记..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "pl-9 transition-all", // 留出图标位置
              isDark 
                ? "bg-white/5 focus:bg-white/10" 
                : "bg-gray-100 border-transparent focus:bg-white focus:border-blue-200 focus:shadow-sm focus:ring-2 focus:ring-blue-100/50"
            )}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className={cn("text-xs font-medium", isDark ? "text-white/40" : "text-gray-500")}>
            {filteredNotes.length} 条笔记
          </span>
          <button
            onClick={onCreateNote}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              isDark ? "hover:bg-white/10 text-[var(--color-memo)]" : "hover:bg-gray-100 text-blue-600"
            )}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-3">
        <motion.div 
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05
              }
            }
          }}
        >
          {filteredNotes.map(note => (
            <motion.div
              key={note.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              className="mb-2"
            >
            <SpotlightCard
            onClick={() => onSelectNote(note)}
            onContextMenu={(e: React.MouseEvent) => {
              e.preventDefault();
              setContextMenu({ x: e.clientX, y: e.clientY, note });
            }}
            className={cn(
              "cursor-pointer transition-all relative overflow-hidden",
              activeNoteId === note.id
                ? isDark 
                  ? "bg-[var(--color-memo)]/10 border-[var(--color-memo)]/20" 
                  : "bg-white border-blue-200 shadow-sm ring-1 ring-blue-100"
                : isDark 
                  ? "hover:bg-white/5" 
                  : "bg-white/50 hover:bg-white hover:shadow-sm border-transparent"
            )}
            from={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}
          >
            {/* 选中态左侧指示条 */}
            {activeNoteId === note.id && !isDark && (
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500" />
            )}
            
            <div className={cn("p-3", activeNoteId === note.id && !isDark && "pl-4")}>
              <h3 className={cn(
                "font-medium text-sm mb-1 line-clamp-1",
                activeNoteId === note.id
                  ? isDark ? "text-[var(--color-memo)]" : "text-blue-700"
                  : isDark ? "text-white/90" : "text-gray-900"
              )}>
                {extractH1Title(note.content)}
              </h3>
              <div 
                className={cn(
                  "text-xs line-clamp-2 mb-2 h-8",
                  isDark ? "text-white/40" : "text-gray-500"
                )}
                dangerouslySetInnerHTML={{ __html: note.content.replace(/<[^>]+>/g, '').substring(0, 100) }}
              />
              <div className="flex items-center gap-2 text-[10px]">
                <span className={isDark ? "text-white/20" : "text-gray-400"}>
                  {new Date(note.updated_at).toLocaleDateString()}
                </span>
                {note.is_pinned && (
                  <span className={cn("px-1.5 py-0.5 rounded-full", isDark ? "bg-white/10 text-white/60" : "bg-gray-100 text-gray-500")}>
                    置顶
                  </span>
                )}
              </div>
            </div>
          </SpotlightCard>
          </motion.div>
        ))}
        </motion.div>
      </div>

      {/* 右键菜单 - 使用 Portal 渲染到 body */}
      {contextMenu && createPortal(
        <div
          data-note-context-menu
          className={cn(
            "fixed z-[9999] min-w-[180px] rounded-lg shadow-xl border py-1",
            isDark ? "bg-[#1a1a1f] border-white/10" : "bg-white border-gray-200"
          )}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* 置顶/取消置顶 */}
          <button
            onMouseDown={(e) => {
              e.stopPropagation();
              onTogglePin(contextMenu.note.id, !contextMenu.note.is_pinned);
              closeContextMenu();
            }}
            className={cn(
              "w-full px-3 py-2 text-left text-sm flex items-center gap-2 cursor-pointer",
              isDark ? "hover:bg-white/10 text-white/80" : "hover:bg-gray-100 text-gray-700"
            )}
          >
            {contextMenu.note.is_pinned ? "取消置顶" : "置顶笔记"}
          </button>

          {/* 移动到文件夹 */}
          <div className={cn("border-t my-1", isDark ? "border-white/5" : "border-gray-100")} />
          <div className={cn("px-3 py-1 text-xs", isDark ? "text-white/30" : "text-gray-400")}>
            移动到
          </div>
          {folders.filter(f => f.id !== "trash").map(folder => (
            <button
              key={folder.id}
              onMouseDown={(e) => {
                e.stopPropagation();
                onMoveNote(contextMenu.note.id, folder.id);
                closeContextMenu();
              }}
              className={cn(
                "w-full px-3 py-2 text-left text-sm flex items-center gap-2 cursor-pointer",
                contextMenu.note.folder_id === folder.id && (isDark ? "text-[var(--color-memo)]" : "text-blue-600"),
                isDark ? "hover:bg-white/10 text-white/80" : "hover:bg-gray-100 text-gray-700"
              )}
            >
              <Folder className="w-3.5 h-3.5" />
              {folder.name}
            </button>
          ))}

          {/* 删除 */}
          <div className={cn("border-t my-1", isDark ? "border-white/5" : "border-gray-100")} />
          <button
            onMouseDown={(e) => {
              e.stopPropagation();
              onDeleteNote(contextMenu.note.id);
              closeContextMenu();
            }}
            className={cn(
              "w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-red-500 cursor-pointer",
              isDark ? "hover:bg-red-500/10" : "hover:bg-red-50"
            )}
          >
            <Trash2 className="w-3.5 h-3.5" />
            删除笔记
          </button>
        </div>,
        document.body
      )}
    </GlassPanel>
  );
});

// 编辑器加载骨架屏
const EditorSkeleton = memo(function EditorSkeleton({ isDark }: { isDark: boolean }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3">
      <Loader2 className={cn(
        "w-6 h-6 animate-spin",
        isDark ? "text-white/30" : "text-gray-400"
      )} />
      <span className={cn("text-sm", isDark ? "text-white/30" : "text-gray-400")}>
        加载编辑器...
      </span>
    </div>
  );
});

// 右侧 - 编辑器
const NoteEditor = memo(function NoteEditor({ 
  note, 
  onUpdate, 
  onDelete,
  isDark,
  isFullScreen,
  onToggleFullScreen
}: { 
  note: Note | null, 
  onUpdate: (content: string) => void,
  onDelete: () => void,
  isDark: boolean,
  isFullScreen: boolean,
  onToggleFullScreen: () => void
}) {
  const [isEditing, setIsEditing] = useState(true);

  // 切换笔记时重置为编辑模式
  // 修复: 使用 useEffect 替代 useMemo 执行副作用
  useEffect(() => {
    if (note) setIsEditing(true);
  }, [note?.id]);

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center opacity-30">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4" />
          <p>选择或创建一个笔记</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* 顶部信息 */}
      <div className={cn(
        "flex-none h-14 px-8 flex items-center justify-between border-b",
        isDark ? "border-white/5" : "border-gray-100"
      )}>
        <div className={cn("text-xs", isDark ? "text-white/30" : "text-gray-400")}>
          上次编辑：{new Date(note.updated_at).toLocaleString()}
        </div>
        
        <div className="flex items-center gap-2">
          {/* 模式切换 */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isEditing 
                ? isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-50 text-blue-600"
                : isDark ? "hover:bg-white/5 text-white/40" : "hover:bg-gray-100 text-gray-400"
            )}
            title={isEditing ? "切换至浏览模式" : "切换至编辑模式"}
          >
            {isEditing ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* 全屏切换 */}
          <button
            onClick={onToggleFullScreen}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isDark ? "hover:bg-white/5 text-white/40" : "hover:bg-gray-100 text-gray-400"
            )}
            title={isFullScreen ? "退出全屏" : "全屏编辑"}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <div className={cn("w-px h-4 mx-1", isDark ? "bg-white/10" : "bg-gray-200")} />

          <button 
            onClick={onDelete}
            className={cn(
              "p-2 rounded-lg transition-colors group",
              isDark ? "hover:bg-red-500/10 text-white/40 hover:text-red-400" : "hover:bg-red-50 text-gray-400 hover:text-red-500"
            )}
            title="删除笔记"
          >
            <LivelyIcon animation="shake">
              <Trash2 className="w-4 h-4" />
            </LivelyIcon>
          </button>
        </div>
      </div>

      {/* 编辑器容器 - 使用 Suspense 懒加载 */}
      <div className="flex-1 overflow-hidden relative">
        <Suspense fallback={<EditorSkeleton isDark={isDark} />}>
          <RichTextEditor
            key={note.id}
            content={note.content}
            onChange={onUpdate}
            isDark={isDark}
            editable={isEditing}
          />
        </Suspense>
      </div>
    </div>
  );
});

// 主布局组件
export const NotesLayout = memo(function NotesLayout() {
  const [activeFolder, setActiveFolder] = useState("all");
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  const { data: folders = [] } = useFolders();
  const { data: notes = [] } = useNotes(activeFolder);
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const createFolderMutation = useCreateFolder();
  const deleteFolderMutation = useDeleteFolder();
  
  // 防抖计时器
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeNote = useMemo(() => 
    notes.find(n => n.id === activeNoteId) || null, 
  [notes, activeNoteId]);

  // 缓存回调
  const handleSelectFolder = useCallback((id: string) => {
    setActiveFolder(id);
    setActiveNoteId(null); // 切换文件夹时清除选中
  }, []);
  
  const handleCreateFolder = useCallback(async (name: string) => {
    try {
      const newFolder = await createFolderMutation.mutateAsync(name);
      // 创建后自动选中新文件夹
      setActiveFolder(newFolder.id);
      setActiveNoteId(null);
    } catch (error) {
      console.error("创建文件夹失败:", error);
    }
  }, [createFolderMutation]);
  
  const handleDeleteFolder = useCallback(async (folderId: string) => {
    try {
      await deleteFolderMutation.mutateAsync(folderId);
      // 如果删除的是当前选中的文件夹，切换到"全部笔记"
      if (activeFolder === folderId) {
        setActiveFolder("all");
        setActiveNoteId(null);
      }
    } catch (error) {
      console.error("删除文件夹失败:", error);
    }
  }, [deleteFolderMutation, activeFolder]);

  const handleSelectNote = useCallback((note: Note) => {
    setActiveNoteId(note.id);
  }, []);

  const handleCreateNote = useCallback(async () => {
    const newNote = await createNote.mutateAsync({
      content: "<h1>新笔记</h1><p>开始记录...</p>",
      folder_id: activeFolder,
    });
    setActiveNoteId(newNote.id);
  }, [createNote, activeFolder]);
  
  const handleDeleteNote = useCallback(async () => {
    if (!activeNoteId) return;
    
    // 直接删除，不使用 confirm（Tauri 环境可能有问题）
    try {
      await deleteNote.mutateAsync(activeNoteId);
      setActiveNoteId(null);
    } catch (error) {
      console.error("删除笔记失败:", error);
    }
  }, [activeNoteId, deleteNote]);

  // 带防抖的更新
  const handleUpdateContent = useCallback((content: string) => {
    if (!activeNoteId) return;
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      updateNote.mutate({
        id: activeNoteId,
        input: { content }
      });
    }, 500); // 500ms 防抖
  }, [activeNoteId, updateNote]);

  // 移动笔记到文件夹
  const handleMoveNoteToFolder = useCallback(async (noteId: number, folderId: string) => {
    try {
      await updateNote.mutateAsync({
        id: noteId,
        input: { folder_id: folderId }
      });
    } catch (error) {
      console.error("移动笔记失败:", error);
    }
  }, [updateNote]);

  // 切换置顶
  const handleTogglePin = useCallback(async (noteId: number, isPinned: boolean) => {
    try {
      await updateNote.mutateAsync({
        id: noteId,
        input: { is_pinned: isPinned }
      });
    } catch (error) {
      console.error("切换置顶失败:", error);
    }
  }, [updateNote]);

  // 删除笔记（通过ID）
  const handleDeleteNoteById = useCallback(async (noteId: number) => {
    try {
      await deleteNote.mutateAsync(noteId);
      if (activeNoteId === noteId) {
        setActiveNoteId(null);
      }
    } catch (error) {
      console.error("删除笔记失败:", error);
    }
  }, [deleteNote, activeNoteId]);

  return (
    <div className="h-full flex overflow-hidden">
      {!isFullScreen && (
        <>
          <Sidebar 
            folders={folders} 
            activeFolder={activeFolder} 
            onSelectFolder={handleSelectFolder}
            onCreateFolder={handleCreateFolder}
            onDeleteFolder={handleDeleteFolder}
            isDark={isDark}
          />
          <NoteList 
            notes={notes} 
            activeNoteId={activeNoteId}
            onSelectNote={handleSelectNote}
            onCreateNote={handleCreateNote}
            onMoveNote={handleMoveNoteToFolder}
            onTogglePin={handleTogglePin}
            onDeleteNote={handleDeleteNoteById}
            folders={folders}
            isDark={isDark}
          />
        </>
      )}
      <NoteEditor 
        note={activeNote}
        onUpdate={handleUpdateContent}
        onDelete={handleDeleteNote}
        isDark={isDark}
        isFullScreen={isFullScreen}
        onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
      />
    </div>
  );
});
