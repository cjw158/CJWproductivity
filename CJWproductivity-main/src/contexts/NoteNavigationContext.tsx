/**
 * @file NoteNavigationContext.tsx
 * @description 笔记导航上下文 - 管理笔记间跳转的历史栈
 * 
 * 功能:
 * - 维护浏览历史栈
 * - 支持从链接跳转到目标笔记
 * - 支持返回上一个浏览位置
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

// 历史记录条目
export interface NoteHistoryEntry {
  noteId: number;
  scrollPosition: number;  // 记录滚动位置以便返回时恢复
  timestamp: number;
}

// Context 值类型
interface NoteNavigationContextValue {
  // 历史栈
  history: NoteHistoryEntry[];
  // 是否可以返回
  canGoBack: boolean;
  // 最近来源笔记的标题（用于返回条显示）
  lastSourceTitle: string | null;
  // 是否刚刚跳转（用于显示返回条）
  justNavigated: boolean;
  
  // 导航到目标笔记（会记录当前笔记到历史）
  navigateTo: (targetNoteId: number, currentNoteId: number, currentScrollPosition: number, sourceNoteTitle: string) => void;
  // 返回上一个笔记
  goBack: () => NoteHistoryEntry | null;
  // 清除 justNavigated 状态
  clearJustNavigated: () => void;
  // 清空历史
  clearHistory: () => void;
}

const NoteNavigationContext = createContext<NoteNavigationContextValue | null>(null);

export function NoteNavigationProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<NoteHistoryEntry[]>([]);
  const [lastSourceTitle, setLastSourceTitle] = useState<string | null>(null);
  const [justNavigated, setJustNavigated] = useState(false);

  const canGoBack = history.length > 0;

  // 导航到目标笔记
  const navigateTo = useCallback((
    _targetNoteId: number, 
    currentNoteId: number, 
    currentScrollPosition: number,
    sourceNoteTitle: string
  ) => {
    // 将当前笔记压入历史栈
    setHistory(prev => [...prev, {
      noteId: currentNoteId,
      scrollPosition: currentScrollPosition,
      timestamp: Date.now(),
    }]);
    setLastSourceTitle(sourceNoteTitle);
    setJustNavigated(true);
    // 永久显示返回条，直到用户手动关闭或点击返回
  }, []);

  // 返回上一个笔记
  const goBack = useCallback(() => {
    if (history.length === 0) return null;
    
    const lastEntry = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setJustNavigated(false);
    setLastSourceTitle(null);
    
    return lastEntry;
  }, [history]);

  // 清除刚跳转状态
  const clearJustNavigated = useCallback(() => {
    setJustNavigated(false);
  }, []);

  // 清空历史
  const clearHistory = useCallback(() => {
    setHistory([]);
    setLastSourceTitle(null);
    setJustNavigated(false);
  }, []);

  return (
    <NoteNavigationContext.Provider value={{
      history,
      canGoBack,
      lastSourceTitle,
      justNavigated,
      navigateTo,
      goBack,
      clearJustNavigated,
      clearHistory,
    }}>
      {children}
    </NoteNavigationContext.Provider>
  );
}

export function useNoteNavigation() {
  const context = useContext(NoteNavigationContext);
  if (!context) {
    throw new Error("useNoteNavigation must be used within NoteNavigationProvider");
  }
  return context;
}
