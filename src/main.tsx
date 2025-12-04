import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./contexts/ThemeContext";
import { FocusProvider } from "./contexts/FocusContext";
import { TaskSelectionProvider } from "./contexts/TaskSelectionContext";
import { TaskActionsProvider } from "./contexts/TaskActionsContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import App from "./App";
import "./index.css";

/**
 * React Query 配置优化：
 * - staleTime: 10分钟 - 减少不必要的重新获取
 * - gcTime: 1小时 - 更长的缓存保留时间
 * - refetchOnWindowFocus: false - 禁用窗口聚焦刷新，减少网络请求
 * - refetchOnMount: false - 组件挂载时不重新获取
 * - retry: 1 - 失败重试一次
 * - structuralSharing: true - 启用结构共享优化
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // 10分钟
      gcTime: 1000 * 60 * 60, // 1小时
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
      structuralSharing: true, // 启用结构共享，减少不必要的重渲染
    },
  },
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TaskActionsProvider>
            <FocusProvider>
              <TaskSelectionProvider>
                <App />
              </TaskSelectionProvider>
            </FocusProvider>
          </TaskActionsProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
