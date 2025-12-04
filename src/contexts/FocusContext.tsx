import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Task } from '@/lib/tasks';

interface FocusContextType {
  focusedTask: Task | null;
  startFocus: (task: Task) => void;
  stopFocus: () => void;
  isFocusing: boolean;
}

const FocusContext = createContext<FocusContextType | undefined>(undefined);

export function FocusProvider({ children }: { children: ReactNode }) {
  const [focusedTask, setFocusedTask] = useState<Task | null>(null);

  const startFocus = useCallback((task: Task) => {
    setFocusedTask(task);
  }, []);

  const stopFocus = useCallback(() => {
    setFocusedTask(null);
  }, []);

  return (
    <FocusContext.Provider value={{ focusedTask, startFocus, stopFocus, isFocusing: !!focusedTask }}>
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const context = useContext(FocusContext);
  if (context === undefined) {
    throw new Error('useFocus must be used within a FocusProvider');
  }
  return context;
}
