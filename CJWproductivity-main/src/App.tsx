import { useState, useEffect, useCallback, Suspense, lazy, useMemo, useTransition, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header, type TabType } from "@/components/Header";
import { Background, LoadingScreen } from "@/components/Background";
import { ViewSkeleton } from "@/components/lazy";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/hooks/useToast";
import { initializeDataStore } from "@/lib/tasks";
import { usePreloadData, usePreloadComponents } from "@/hooks/usePreload";
import { useTaskSelection } from "@/contexts/TaskSelectionContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";
import { showIsland } from "@/lib/island";
import { registerGlobalShortcuts, unregisterGlobalShortcuts } from "@/lib/globalShortcuts";
import { logger } from "@/lib/logger";

// 懒加载视图组件
const TasksView = lazy(() => import("@/components/TasksView").then(m => ({ default: m.TasksView })));
const PlansView = lazy(() => import("@/components/PlansView").then(m => ({ default: m.PlansView })));
const NotesLayout = lazy(() => import("@/components/NotesLayout").then(m => ({ default: m.NotesLayout })));
const QuickCapture = lazy(() => import("@/components/QuickCapture").then(m => ({ default: m.QuickCapture })));
const DynamicIsland = lazy(() => import("@/components/DynamicIsland").then(m => ({ default: m.DynamicIsland })));
const SettingsModal = lazy(() => import("@/components/settings/SettingsModal").then(m => ({ default: m.SettingsModal })));

import { FocusOverlay } from "@/components/FocusOverlay";
import { TaskContextMenu } from "@/components/TaskContextMenu";
import { BatchActionsBar } from "@/components/BatchActionsBar";
import { SplashScreen } from "@/components/SplashScreen";
import { SplashWindow } from "@/components/SplashWindow";
import { LiveWallpaper } from "@/components/LiveWallpaper";

// 页面切换动画配置
const pageVariants = {
  initial: { opacity: 0, scale: 0.98, filter: "blur(4px)" },
  enter: { opacity: 1, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, scale: 1.02, filter: "blur(4px)" }
};

const pageTransition = {
  type: "tween",
  ease: "easeOut",
  duration: 0.2
};

// 判断是否为特殊窗口
const isIslandWindow = window.location.hash === "#island";
const isSplashWindow = window.location.hash === "#splash";

// 特殊窗口需要完全透明背景
if (isIslandWindow || isSplashWindow) {
  document.documentElement.style.background = "transparent";
  document.body.style.background = "transparent";
}

function App() {
  const { data: settings } = useSettings();
  const startPage = settings?.general.startPage ?? "tasks";
  
  const [activeTab, setActiveTab] = useState<TabType>(startPage as TabType);
  const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
  const [quickCaptureDefaultDate, setQuickCaptureDefaultDate] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  // 在 Tauri 环境中，由独立的 splash 窗口显示启动动画，主窗口不再显示内部 splash
  const isTauriEnv = '__TAURI__' in window || '__TAURI_INTERNALS__' in window;
  const [showSplash, setShowSplash] = useState(!isTauriEnv);
  const pressedKeys = useRef<Set<string>>(new Set());
  const islandAutoShowTriggered = useRef(false);

  // Initialize database
  useEffect(() => {
    const init = async () => {
      try {
        await initializeDataStore();
        setIsInitialized(true);
      } catch (error) {
        logger.error("Initialization error:", error);
        setIsInitialized(true);
      }
    };
    init();

    // 清理：卸载全局快捷键
    return () => {
      unregisterGlobalShortcuts();
    };
  }, []);

  // 注册全局快捷键（使用设置中的配置）
  useEffect(() => {
    logger.debug("[App] Shortcuts effect - isInitialized:", isInitialized, "settings?.shortcuts:", settings?.shortcuts);
    if (isInitialized && settings?.shortcuts) {
      logger.debug("[App] Calling registerGlobalShortcuts with:", settings.shortcuts);
      registerGlobalShortcuts({
        globalQuickCapture: settings.shortcuts.globalQuickCapture,
        globalToggleIsland: settings.shortcuts.globalToggleIsland,
        globalShowMain: settings.shortcuts.globalShowMain,
      });
    }
  }, [isInitialized, settings?.shortcuts]);

  // 灵动岛自动显示
  useEffect(() => {
    if (isInitialized && settings?.island.autoShow && !islandAutoShowTriggered.current) {
      islandAutoShowTriggered.current = true;
      showIsland();
    }
  }, [isInitialized, settings?.island.autoShow]);

  // Keyboard shortcuts (Shift + F + J 全局快捷键)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      pressedKeys.current.add(key);

      // Shift + F + J 组合键：打开/保存关闭 QuickCapture
      if (e.shiftKey && pressedKeys.current.has('f') && pressedKeys.current.has('j')) {
        e.preventDefault();
        e.stopPropagation();
        
        if (quickCaptureOpen) {
          // 已打开状态：触发保存并关闭
          document.dispatchEvent(new CustomEvent('quickcapture-save'));
        } else {
          // 未打开状态：打开 QuickCapture
          setQuickCaptureOpen(true);
        }
        pressedKeys.current.clear();
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeys.current.delete(e.key.toLowerCase());
    };

    // 失去焦点时清空按键状态
    const handleBlur = () => {
      pressedKeys.current.clear();
    };

    // 监听外部打开 QuickCapture 的事件（可带默认日期）
    const handleOpenQuickCapture = (e: Event) => {
      const customEvent = e as CustomEvent<{ dueDate?: string }>;
      setQuickCaptureDefaultDate(customEvent.detail?.dueDate || null);
      setQuickCaptureOpen(true);
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("open-quickcapture", handleOpenQuickCapture);
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("open-quickcapture", handleOpenQuickCapture);
    };
  }, [quickCaptureOpen]);

  const handleOpenSettings = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setSettingsOpen(false);
  }, []);

  const handleCloseQuickCapture = useCallback(() => {
    setQuickCaptureOpen(false);
    setQuickCaptureDefaultDate(null);
  }, []);

  const handleSaveAndCloseQuickCapture = useCallback(() => {
    setQuickCaptureOpen(false);
    setQuickCaptureDefaultDate(null);
  }, []);

  const handleCreated = useCallback(() => {
    toast({
      title: "已保存",
      description: "内容已成功保存",
      variant: "success",
    });
  }, []);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  // 预加载数据和组件
  usePreloadData();
  usePreloadComponents();

  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  // 使用 transition 让 Tab 切换更流畅
  const [, startTransition] = useTransition();

  // 获取任务选择上下文（用于切换标签时清理状态）
  const { clearSelection, closeContextMenu } = useTaskSelection();

  // 缓存 Tab 切换回调 - 清理任务状态并使用 startTransition 延迟非紧急渲染
  const handleTabChange = useCallback((tab: TabType) => {
    // 切换标签时清除任务选择和关闭上下文菜单
    clearSelection();
    closeContextMenu();
    startTransition(() => {
      setActiveTab(tab);
    });
  }, [clearSelection, closeContextMenu]);

  // 缓存背景样式类
  const containerClassName = useMemo(() => cn(
    "h-screen w-screen overflow-hidden flex flex-col relative transition-colors duration-300",
    isDark ? "bg-[#0A0A0F] streaming-frame" : "bg-[#E5E5EA]"
  ), [isDark]);

  // Splash 启动窗口：独立的启动动画界面
  if (isSplashWindow) {
    return <SplashWindow />;
  }

  // 灵动岛窗口：等待初始化后渲染，确保完全透明
  if (isIslandWindow) {
    if (!isInitialized) {
      return null;
    }
    return (
      <div style={{ 
        width: "100vw", 
        height: "100vh", 
        background: "transparent",
        overflow: "hidden",
      }}>
        <Suspense fallback={null}>
          <DynamicIsland />
        </Suspense>
      </div>
    );
  }

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <div className={containerClassName}>
      {/* 启动动画 */}
      {showSplash && <SplashScreen onComplete={handleSplashComplete} duration={2500} />}
      
      {/* 静态背景 - 永不重渲染 */}
      <Background />
      
      {/* 动态壁纸 - 在背景之上，内容之下 */}
      <LiveWallpaper />
      
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenSettings={handleOpenSettings}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative z-10">
        <AnimatePresence mode="popLayout">
          {activeTab === "tasks" && (
            <motion.div
              key="tasks"
              variants={pageVariants}
              initial="initial"
              animate="enter"
              exit="exit"
              transition={pageTransition}
              className="h-full"
            >
              <Suspense fallback={<ViewSkeleton />}>
                <TasksView />
              </Suspense>
            </motion.div>
          )}
          {activeTab === "plans" && (
            <motion.div
              key="plans"
              variants={pageVariants}
              initial="initial"
              animate="enter"
              exit="exit"
              transition={pageTransition}
              className="h-full"
            >
              <Suspense fallback={<ViewSkeleton />}>
                <PlansView />
              </Suspense>
            </motion.div>
          )}
          {activeTab === "notes" && (
            <motion.div
              key="notes"
              variants={pageVariants}
              initial="initial"
              animate="enter"
              exit="exit"
              transition={pageTransition}
              className="h-full"
            >
              <Suspense fallback={<ViewSkeleton />}>
                <NotesLayout />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* QuickCapture - 全局快速捕获悬浮窗 (Shift+F+J) */}
      <Suspense fallback={null}>
        <QuickCapture
          isOpen={quickCaptureOpen}
          onClose={handleCloseQuickCapture}
          onSaveAndClose={handleSaveAndCloseQuickCapture}
          onCreated={handleCreated}
          defaultDueDate={quickCaptureDefaultDate}
        />
      </Suspense>

      {/* Settings Modal */}
      <Suspense fallback={null}>
        <SettingsModal
          isOpen={settingsOpen}
          onClose={handleCloseSettings}
        />
      </Suspense>

      {/* Toast Notifications */}
      <Toaster />

      {/* Zen Mode Overlay */}
      <FocusOverlay />

      {/* Context Menu - 仅在任务视图显示 */}
      {activeTab === "tasks" && <TaskContextMenu />}

      {/* Batch Actions Bar - 仅在任务视图显示 */}
      {activeTab === "tasks" && <BatchActionsBar />}
    </div>
  );
}

export default App;
