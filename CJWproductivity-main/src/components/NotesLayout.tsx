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
  Upload,
  ArrowLeft,
  List,
  RotateCcw,
  Trash
} from "lucide-react";
import { NoteNavigationProvider, useNoteNavigation } from "@/contexts/NoteNavigationContext";
import { NoteLinkPicker, type NoteLinkSelection } from "@/components/NoteLinkPicker";
import type { RichTextEditorRef } from "@/components/RichTextEditor";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFolders, useNotes, useCreateNote, useUpdateNote, useDeleteNote, useCreateFolder, useDeleteFolder, useRestoreNote, usePermanentDeleteNote, useEmptyTrash, useAutoCleanupNotes } from "@/hooks/useNotes";
import type { Note, Folder as FolderType } from "@/lib/notes";
import { GlassPanel, SpotlightCard, NeonInput } from "@/components/ui/visual-effects";
import { extractH1Title, stripHtml } from "@/utils";
import { NoteEditorToolbar, TableOfContents } from "@/components/notes";
import { importFile, ACCEPT_FILE_TYPES } from "@/lib/note-import";
import { getRelativeTime } from "@/utils/timeUtils";
import { toast } from "@/hooks/useToast";
import { useTableOfContents } from "@/hooks/useTableOfContents";

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
  const { t } = useLanguage();
  
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
            {t("notes.folders")}
          </h2>
          <button
            onClick={() => setIsCreating(true)}
            className={cn(
              "p-1 rounded transition-colors",
              isDark ? "hover:bg-white/10 text-white/40 hover:text-white" : "hover:bg-gray-200 text-gray-400 hover:text-gray-600"
            )}
            title={t("notes.newFolder")}
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
              placeholder={t("notes.folderName")}
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
                  <span>{folder.id === "all" ? t("notes.allNotes") : folder.id === "trash" ? t("notes.recentlyDeleted") : folder.name}</span>
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
  onImportNote,
  onMoveNote,
  onTogglePin,
  onDeleteNote,
  onRestoreNote,
  onPermanentDelete,
  onEmptyTrash,
  folders,
  isDark,
  isTrash = false,
}: { 
  notes: Note[], 
  activeNoteId: number | null, 
  onSelectNote: (note: Note) => void,
  onCreateNote: () => void,
  onImportNote: (title: string, content: string) => void,
  onMoveNote: (noteId: number, folderId: string) => void,
  onTogglePin: (noteId: number, isPinned: boolean) => void,
  onDeleteNote: (noteId: number) => void,
  onRestoreNote?: (noteId: number) => void,
  onPermanentDelete?: (noteId: number) => void,
  onEmptyTrash?: () => void,
  folders: FolderType[],
  isDark: boolean,
  isTrash?: boolean,
}) {
  // 使用 onEmptyTrash 避免 TS 警告（未来可添加清空回收站按钮）
  void onEmptyTrash;
  const [search, setSearch] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; note: Note } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const { t, language } = useLanguage();
  
  // 处理文件导入
  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // 立即重置 input，防止卡住
    const fileList = Array.from(files);
    if (importInputRef.current) {
      importInputRef.current.value = "";
    }
    
    // 延迟处理，让文件选择器有时间关闭
    setTimeout(async () => {
      setIsImporting(true);
      let successCount = 0;
      let failCount = 0;
      
      try {
        for (const file of fileList) {
          // 让 UI 有机会更新
          await new Promise(resolve => setTimeout(resolve, 10));
          
          const result = await importFile(file);
          if (result.success) {
            // 确保内容有 h1 标题
            let content = result.content;
            if (!content.includes("<h1")) {
              content = `<h1>${result.title}</h1>\n${content}`;
            }
            await onImportNote(result.title, content);
            successCount++;
          } else {
            console.error("导入失败:", result.error);
            failCount++;
          }
        }
        
        // 显示结果
        if (successCount > 0) {
          toast({
            title: "导入成功",
            description: `成功导入 ${successCount} 个笔记${failCount > 0 ? `，${failCount} 个失败` : ""}`,
          });
        } else if (failCount > 0) {
          toast({
            title: "导入失败",
            description: `${failCount} 个文件导入失败`,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("导入错误:", error);
        toast({
          title: "导入错误",
          description: "文件导入过程中发生错误",
          variant: "destructive",
        });
      } finally {
        setIsImporting(false);
      }
    }, 100); // 延迟 100ms 让文件对话框关闭
  }, [onImportNote]);

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
            placeholder={t("notes.searchPlaceholder")}
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
            {t("notes.notesCount", { count: filteredNotes.length })}
          </span>
          <div className="flex items-center gap-1">
            {/* 导入按钮 */}
            <button
              onClick={() => importInputRef.current?.click()}
              disabled={isImporting}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                isDark ? "hover:bg-white/10 text-white/60 hover:text-white" : "hover:bg-gray-100 text-gray-500 hover:text-gray-700",
                isImporting && "opacity-50 cursor-not-allowed"
              )}
              title="导入文件 (.md, .html, .txt, .docx)"
            >
              {isImporting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
            </button>
            {/* 隐藏的文件输入 */}
            <input
              ref={importInputRef}
              type="file"
              accept={ACCEPT_FILE_TYPES}
              multiple
              onChange={handleImport}
              className="hidden"
            />
            {/* 新建按钮 */}
            <button
              onClick={onCreateNote}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                isDark ? "hover:bg-white/10 text-[var(--color-memo)]" : "hover:bg-gray-100 text-blue-600"
              )}
              title="新建笔记"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
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
              "cursor-pointer transition-all duration-200 relative overflow-hidden group",
              // 悬浮效果：明显上浮 + 阴影加深
              "hover:-translate-y-1 hover:shadow-lg",
              activeNoteId === note.id
                ? isDark 
                  ? "bg-[var(--color-memo)]/10 border-[var(--color-memo)]/30 shadow-[0_0_15px_rgba(0,255,255,0.1)]" 
                  : "bg-slate-50 border-l-[3px] border-l-blue-500 border-t border-r border-b border-slate-200 shadow-sm"
                : isDark 
                  ? "bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10" 
                  : "bg-white/70 border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow-sm"
            )}
            from={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)"}
          >
            {/* 选中态装饰（深色主题使用绝对定位高亮条，浅色主题使用 border-l） */}
            {activeNoteId === note.id && isDark && (
              <>
                <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--color-memo)] transition-colors duration-300" />
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-gradient-to-r from-[var(--color-memo)]/20 to-transparent" />
              </>
            )}
            
            <div className={cn("p-3.5", activeNoteId === note.id && "pl-4")}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h3 className={cn(
                  "font-medium text-sm line-clamp-1 transition-colors",
                  activeNoteId === note.id
                    ? isDark ? "text-[var(--color-memo)]" : "text-blue-700"
                    : isDark ? "text-white/90 group-hover:text-white" : "text-gray-800 group-hover:text-gray-900"
                )}>
                  {extractH1Title(note.content) || t("notes.untitled")}
                </h3>
                {note.is_pinned && (
                  <span className={cn(
                    "flex-none px-1.5 py-0.5 rounded-full text-[10px] font-medium",
                    isDark 
                      ? "bg-[var(--color-memo)]/20 text-[var(--color-memo)]" 
                      : "bg-blue-100 text-blue-600"
                  )}>
                    {t("notes.pinned")}
                  </span>
                )}
              </div>
              
              <div 
                className={cn(
                  "text-xs line-clamp-2 mb-2.5 h-9 leading-relaxed transition-colors",
                  isDark ? "text-white/40 group-hover:text-white/50" : "text-gray-500 group-hover:text-gray-600"
                )}
                dangerouslySetInnerHTML={{ __html: stripHtml(note.content).substring(0, 100) || "..." }}
              />
              
              <div className="flex items-center justify-between text-[10px]">
                <span className={cn(
                  "transition-colors",
                  isDark ? "text-white/20 group-hover:text-white/30" : "text-gray-400 group-hover:text-gray-500"
                )}>
                  {getRelativeTime(note.updated_at, language)}
                </span>
                
                {/* 悬浮显示的快捷操作图标 */}
                <div className={cn(
                  "opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1",
                  isDark ? "text-white/40" : "text-gray-400"
                )}>
                  {/* 此处可预留收藏/删除等快捷按钮 */}
                </div>
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
          {isTrash ? (
            <>
              {/* 回收站：恢复 */}
              <button
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onRestoreNote?.(contextMenu.note.id);
                  closeContextMenu();
                }}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm flex items-center gap-2 cursor-pointer",
                  isDark ? "hover:bg-white/10 text-green-400" : "hover:bg-green-50 text-green-600"
                )}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                恢复笔记
              </button>

              {/* 回收站：永久删除 */}
              <div className={cn("border-t my-1", isDark ? "border-white/5" : "border-gray-100")} />
              <button
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onPermanentDelete?.(contextMenu.note.id);
                  closeContextMenu();
                }}
                className={cn(
                  "w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-red-500 cursor-pointer",
                  isDark ? "hover:bg-red-500/10" : "hover:bg-red-50"
                )}
              >
                <Trash className="w-3.5 h-3.5" />
                永久删除
              </button>
            </>
          ) : (
            <>
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
                {contextMenu.note.is_pinned ? t("notes.unpin") : t("notes.pin")}
              </button>

              {/* 移动到文件夹 */}
              <div className={cn("border-t my-1", isDark ? "border-white/5" : "border-gray-100")} />
              <div className={cn("px-3 py-1 text-xs", isDark ? "text-white/30" : "text-gray-400")}>
                {t("notes.moveTo")}
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

              {/* 删除（移到回收站） */}
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
                {t("notes.deleteNote")}
              </button>
            </>
          )}
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
        Loading...
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
  onToggleFullScreen,
  onNoteLinkClick,
  isDualPage,
  onToggleDualPage,
}: { 
  note: Note | null, 
  onUpdate: (content: string) => void,
  onDelete: () => void,
  isDark: boolean,
  isFullScreen: boolean,
  onToggleFullScreen: () => void,
  onNoteLinkClick: (noteId: number) => void,
  isDualPage: boolean,
  onToggleDualPage: () => void,
}) {
  const [isEditing, setIsEditing] = useState(true);
  const [widthPercent, setWidthPercent] = useState(100);
  const [isDragging, setIsDragging] = useState(false);
  const [isLinkPickerOpen, setIsLinkPickerOpen] = useState(false);
  const [showToc, setShowToc] = useState(false); // 目录面板状态
  const editorRef = useRef<RichTextEditorRef>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const { justNavigated, lastSourceTitle, goBack, clearJustNavigated } = useNoteNavigation();
  
  // 目录 Hook
  const { items: tocItems, activeId, scrollToItem, scrollToTop } = useTableOfContents({
    containerRef: editorContainerRef,
    content: note?.content || '',
    enabled: showToc && !isEditing, // 仅浏览模式启用
  });
  
  // 全屏切换时调整宽度 - 16:9屏幕适配
  useEffect(() => {
    setWidthPercent(isFullScreen ? 57 : 100);
  }, [isFullScreen]);
  
  // 切换到双屏模式时自动关闭目录
  useEffect(() => {
    if (isDualPage && showToc) {
      setShowToc(false);
    }
  }, [isDualPage]);
  
  // 处理笔记链接选择
  const handleNoteLinkSelect = useCallback((selection: NoteLinkSelection) => {
    editorRef.current?.insertNoteLink(selection.noteId, selection.noteTitle);
  }, []);

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className={cn(
          "text-center max-w-xs px-6 py-8 rounded-2xl",
          isDark 
            ? "bg-white/5 border border-white/10" 
            : "bg-gray-50 border border-gray-100"
        )}>
          <div className={cn(
            "w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center",
            isDark 
              ? "bg-[var(--neon-cyan)]/10" 
              : "bg-blue-50"
          )}>
            <FileText className={cn(
              "w-8 h-8",
              isDark ? "text-[var(--neon-cyan)]" : "text-blue-500"
            )} />
          </div>
          <h3 className={cn(
            "text-lg font-medium mb-2",
            isDark ? "text-white/80" : "text-gray-700"
          )}>
            {t("notes.selectOrCreate")}
          </h3>
          <p className={cn(
            "text-sm mb-4",
            isDark ? "text-white/40" : "text-gray-500"
          )}>
            {t("notes.emptyHint") || "从左侧选择一篇笔记，或创建新笔记开始记录"}
          </p>
          <div className={cn(
            "flex items-center justify-center gap-2 text-xs",
            isDark ? "text-white/30" : "text-gray-400"
          )}>
            <span className={cn(
              "px-2 py-1 rounded",
              isDark ? "bg-white/10" : "bg-gray-100"
            )}>⌘ N</span>
            <span>{t("notes.quickCreate") || "快速创建"}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full transition-colors duration-300">
      {/* 顶部工具栏 */}
      <NoteEditorToolbar
        note={note}
        isDark={isDark}
        isEditing={isEditing}
        onToggleEditing={() => setIsEditing(!isEditing)}
        isFullScreen={isFullScreen}
        onToggleFullScreen={onToggleFullScreen}
        isDualPage={isDualPage}
        onToggleDualPage={onToggleDualPage}
        onDelete={onDelete}
        widthPercent={widthPercent}
        onWidthChange={setWidthPercent}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
      />

      {/* 返回条 - 从链接跳转过来时显示 */}
      <AnimatePresence>
        {justNavigated && lastSourceTitle && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "absolute top-14 left-0 right-0 z-20 flex items-center justify-center px-4 py-2",
              isDark ? "bg-[var(--neon-cyan)]/10" : "bg-blue-50"
            )}
          >
            <button
              onClick={() => {
                const entry = goBack();
                if (entry) {
                  onNoteLinkClick(entry.noteId);
                }
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                isDark 
                  ? "bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/30" 
                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              返回「{lastSourceTitle}」
            </button>
            <button
              onClick={clearJustNavigated}
              className={cn(
                "ml-2 p-1 rounded transition-colors",
                isDark ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600"
              )}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 编辑器容器 - 使用 Suspense 懒加载 */}
      <div className="flex-1 overflow-hidden relative flex">
        {/* 目录面板（左侧） */}
        <AnimatePresence>
          {showToc && !isEditing && !isDualPage && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "h-full border-r overflow-hidden flex-shrink-0",
                isDark ? "bg-[#16161a] border-white/10" : "bg-gray-50 border-gray-200"
              )}
            >
              <TableOfContents
                items={tocItems}
                activeId={activeId}
                onItemClick={scrollToItem}
                onScrollToTop={scrollToTop}
                onClose={() => setShowToc(false)}
                isDark={isDark}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* 主编辑区 */}
        <div ref={editorContainerRef} className="flex-1 overflow-hidden relative">
          <Suspense fallback={<EditorSkeleton isDark={isDark} />}>
            <RichTextEditor
              ref={editorRef}
              key={note.id}
              content={note.content}
              onChange={onUpdate}
              isDark={isDark}
              editable={isEditing}
              maxWidth={isDualPage && isFullScreen ? "100%" : `${widthPercent}%`}
              disableTransition={isDragging}
              onOpenNoteLinkPicker={() => setIsLinkPickerOpen(true)}
              onNoteLinkClick={onNoteLinkClick}
              isDualPage={isDualPage && isFullScreen}
            />
          </Suspense>
          
          {/* 目录切换按钮（浏览模式下，目录隐藏时显示） */}
          {!isEditing && !isDualPage && !showToc && (
            <button
              onClick={() => setShowToc(true)}
              className={cn(
                "absolute left-4 top-4 z-30 p-2 rounded-lg transition-all duration-200",
                isDark 
                  ? "bg-white/10 text-white/60 hover:text-white hover:bg-white/20" 
                  : "bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200"
              )}
              title="显示目录"
            >
              <List className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      
      {/* 笔记链接选择器 */}
      <NoteLinkPicker
        isOpen={isLinkPickerOpen}
        onClose={() => setIsLinkPickerOpen(false)}
        onSelect={handleNoteLinkSelect}
        currentNoteId={note.id}
      />
    </div>
  );
});

// 内部布局组件（需要在 Provider 内部使用 navigation context）
const NotesLayoutInner = memo(function NotesLayoutInner() {
  const [activeFolder, setActiveFolder] = useState("all");
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isDualPage, setIsDualPage] = useState(false);
  
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  const { data: folders = [] } = useFolders();
  const { data: notes = [] } = useNotes(activeFolder);
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const restoreNote = useRestoreNote();
  const permanentDelete = usePermanentDeleteNote();
  const emptyTrash = useEmptyTrash();
  const createFolderMutation = useCreateFolder();
  const deleteFolderMutation = useDeleteFolder();
  const { navigateTo } = useNoteNavigation();
  
  // 启动时自动清理7天前删除的笔记
  useAutoCleanupNotes();
  
  // 防抖计时器
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // 退出全屏时自动关闭双页模式
  useEffect(() => {
    if (!isFullScreen && isDualPage) {
      setIsDualPage(false);
    }
  }, [isFullScreen, isDualPage]);

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
  
  // 导入笔记
  const handleImportNote = useCallback(async (_title: string, content: string) => {
    try {
      const newNote = await createNote.mutateAsync({
        content,
        folder_id: activeFolder,
      });
      // 等待一帧确保 React Query 缓存已刷新
      await new Promise(resolve => setTimeout(resolve, 100));
      setActiveNoteId(newNote.id);
    } catch (error) {
      console.error("导入笔记失败:", error);
    }
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

  // 处理笔记链接点击（从浏览模式跳转到另一个笔记）
  const handleNoteLinkClick = useCallback((targetNoteId: number) => {
    if (!activeNote) return;
    
    // 获取当前滚动位置
    const scrollPosition = editorContainerRef.current?.scrollTop || 0;
    
    // 获取当前笔记标题
    const currentTitle = extractH1Title(activeNote.content) || stripHtml(activeNote.content).slice(0, 20) || "无标题";
    
    // 记录导航并跳转
    navigateTo(targetNoteId, activeNote.id, scrollPosition, currentTitle);
    
    // 切换到目标笔记（如果在不同文件夹，先切换到"全部"）
    setActiveFolder("all");
    setActiveNoteId(targetNoteId);
  }, [activeNote, navigateTo]);

  return (
    <div className="h-full flex overflow-hidden">
      <motion.div
        initial={false}
        animate={{ 
          width: isFullScreen ? 0 : "auto",
          opacity: isFullScreen ? 0 : 1
        }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className="flex overflow-hidden"
      >
        <div className="flex h-full flex-none">
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
            onImportNote={handleImportNote}
            onMoveNote={handleMoveNoteToFolder}
            onTogglePin={handleTogglePin}
            onDeleteNote={handleDeleteNoteById}
            onRestoreNote={(id) => restoreNote.mutate(id)}
            onPermanentDelete={(id) => permanentDelete.mutate(id)}
            onEmptyTrash={() => emptyTrash.mutate()}
            folders={folders}
            isDark={isDark}
            isTrash={activeFolder === "trash"}
          />
        </div>
      </motion.div>

      <div ref={editorContainerRef} className="flex-1 flex flex-col overflow-hidden">
        <NoteEditor 
          note={activeNote}
          onUpdate={handleUpdateContent}
          onDelete={handleDeleteNote}
          isDark={isDark}
          isFullScreen={isFullScreen}
          onToggleFullScreen={() => {
            if (isFullScreen && isDualPage) {
              // 退出全屏时，先关闭双页模式，等动画完成后再退出全屏
              setIsDualPage(false);
              setTimeout(() => setIsFullScreen(false), 300);
            } else {
              setIsFullScreen(!isFullScreen);
            }
          }}
          onNoteLinkClick={handleNoteLinkClick}
          isDualPage={isDualPage}
          onToggleDualPage={() => setIsDualPage(!isDualPage)}
        />
      </div>
    </div>
  );
});

// 主布局组件（包裹 Provider）
export const NotesLayout = memo(function NotesLayout() {
  return (
    <NoteNavigationProvider>
      <NotesLayoutInner />
    </NoteNavigationProvider>
  );
});
