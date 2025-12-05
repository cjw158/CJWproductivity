import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { Task } from '@/lib/tasks';

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  task: Task | null;
}

interface TaskSelectionContextType {
  // 多选
  selectedTaskIds: Set<number>;
  isSelecting: boolean;
  toggleTaskSelection: (taskId: number, shiftKey: boolean) => void;
  selectTask: (taskId: number) => void;
  deselectTask: (taskId: number) => void;
  clearSelection: () => void;
  selectAll: (taskIds: number[]) => void;
  
  // 右键菜单
  contextMenu: ContextMenuState;
  openContextMenu: (x: number, y: number, task: Task) => void;
  closeContextMenu: () => void;
  
  // 🟡 性能优化：批量检查选中状态
  isTaskSelected: (taskId: number) => boolean;
}

const TaskSelectionContext = createContext<TaskSelectionContextType | undefined>(undefined);

// 初始右键菜单状态（稳定引用，避免重渲染）
const INITIAL_CONTEXT_MENU: ContextMenuState = {
  isOpen: false,
  x: 0,
  y: 0,
  task: null,
};

export function TaskSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(INITIAL_CONTEXT_MENU);

  // 🟡 性能优化：使用useMemo缓存派生状态
  const isSelecting = useMemo(() => selectedTaskIds.size > 0, [selectedTaskIds]);

  // 🟡 性能优化：使用useCallback确保回调稳定
  const selectTask = useCallback((taskId: number) => {
    setSelectedTaskIds(prev => {
      if (prev.has(taskId)) return prev; // 已选中则不更新
      const next = new Set(prev);
      next.add(taskId);
      return next;
    });
  }, []);

  const deselectTask = useCallback((taskId: number) => {
    setSelectedTaskIds(prev => {
      if (!prev.has(taskId)) return prev; // 未选中则不更新
      const next = new Set(prev);
      next.delete(taskId);
      return next;
    });
  }, []);

  const toggleTaskSelection = useCallback((taskId: number, _shiftKey?: boolean) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedTaskIds(prev => {
      if (prev.size === 0) return prev; // 已清空则不更新
      return new Set();
    });
  }, []);

  const selectAll = useCallback((taskIds: number[]) => {
    setSelectedTaskIds(new Set(taskIds));
  }, []);

  const openContextMenu = useCallback((x: number, y: number, task: Task) => {
    setContextMenu({ isOpen: true, x, y, task });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => {
      if (!prev.isOpen) return prev; // 已关闭则不更新
      return { ...prev, isOpen: false, task: null };
    });
  }, []);

  // 🟡 性能优化：批量检查选中状态的辅助函数
  const isTaskSelected = useCallback((taskId: number) => {
    return selectedTaskIds.has(taskId);
  }, [selectedTaskIds]);

  // 🟡 性能优化：使用useMemo缓存整个context value
  const contextValue = useMemo(() => ({
    selectedTaskIds,
    isSelecting,
    toggleTaskSelection,
    selectTask,
    deselectTask,
    clearSelection,
    selectAll,
    contextMenu,
    openContextMenu,
    closeContextMenu,
    isTaskSelected,
  }), [
    selectedTaskIds,
    isSelecting,
    toggleTaskSelection,
    selectTask,
    deselectTask,
    clearSelection,
    selectAll,
    contextMenu,
    openContextMenu,
    closeContextMenu,
    isTaskSelected,
  ]);

  return (
    <TaskSelectionContext.Provider value={contextValue}>
      {children}
    </TaskSelectionContext.Provider>
  );
}

export function useTaskSelection() {
  const context = useContext(TaskSelectionContext);
  if (context === undefined) {
    throw new Error('useTaskSelection must be used within a TaskSelectionProvider');
  }
  return context;
}
