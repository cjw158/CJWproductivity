import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
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
}

const TaskSelectionContext = createContext<TaskSelectionContextType | undefined>(undefined);

export function TaskSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    task: null,
  });

  const isSelecting = selectedTaskIds.size > 0;

  const selectTask = useCallback((taskId: number) => {
    setSelectedTaskIds(prev => new Set([...prev, taskId]));
  }, []);

  const deselectTask = useCallback((taskId: number) => {
    setSelectedTaskIds(prev => {
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
    setSelectedTaskIds(new Set());
  }, []);

  const selectAll = useCallback((taskIds: number[]) => {
    setSelectedTaskIds(new Set(taskIds));
  }, []);

  const openContextMenu = useCallback((x: number, y: number, task: Task) => {
    setContextMenu({ isOpen: true, x, y, task });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, isOpen: false, task: null }));
  }, []);

  return (
    <TaskSelectionContext.Provider value={{
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
    }}>
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
