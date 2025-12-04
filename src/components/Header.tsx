import { memo, useCallback, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, CheckSquare, Book, Sun, Moon, Target, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { useEnergyMode } from "@/hooks/useEnergyMode";
import { useTheme } from "@/contexts/ThemeContext";
import { toggleIsland, isIslandVisible } from "@/lib/island";

export type TabType = "tasks" | "plans" | "notes";

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenSettings: () => void;
}

export const Header = memo(function Header({ activeTab, onTabChange, onOpenSettings }: HeaderProps) {
  useEnergyMode(); // Keep hook connected
  useTheme(); // Keep context connected
  
  // 本地主题状态（立即响应）
  const [localDark, setLocalDark] = useState(() => {
    const stored = localStorage.getItem("cjw-theme");
    return stored !== "light";
  });
  const isDark = localDark;
  
  // 直接切换主题
  const handleToggleTheme = useCallback(() => {
    const newTheme = localDark ? "light" : "dark";
    setLocalDark(!localDark);
    
    // 立即更新 DOM
    const root = document.documentElement;
    root.classList.remove("theme-dark", "theme-light");
    root.classList.add(`theme-${newTheme}`);
    localStorage.setItem("cjw-theme", newTheme);
    
    // 触发自定义事件通知 ThemeContext
    window.dispatchEvent(new Event("theme-changed"));
    
    logger.debug("[Header] Theme toggled to:", newTheme);
  }, [localDark]);
  
  // 实时时钟
  const [currentTime, setCurrentTime] = useState(new Date());
  // 灵动岛状态
  const [islandActive, setIslandActive] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 检查灵动岛初始状态
  useEffect(() => {
    isIslandVisible().then(setIslandActive);
  }, []);

  // 切换灵动岛
  const handleToggleIsland = useCallback(async () => {
    await toggleIsland();
    const visible = await isIslandVisible();
    setIslandActive(visible);
  }, []);

  // 缓存 Tab 切换回调
  const handleTasksClick = useCallback(() => onTabChange("tasks"), [onTabChange]);
  const handlePlansClick = useCallback(() => onTabChange("plans"), [onTabChange]);
  const handleNotesClick = useCallback(() => onTabChange("notes"), [onTabChange]);

  return (
    <header 
      className={cn(
        "h-16 flex items-center justify-between px-6 backdrop-blur-xl transition-colors duration-300",
        isDark 
          ? "bg-black/40 streaming-border" 
          : "border-b border-black/5 bg-[#F2F2F7]/90"
      )}
    >
      {/* Logo & Context */}
      <div className="flex items-center gap-4">
        <div className="flex items-center cursor-pointer select-none">
          <h1 className={cn(
            "text-lg font-bold tracking-tight flex items-center",
            isDark ? "text-white" : "text-gray-900"
          )}>
            <motion.span 
              className={cn(
                "text-2xl font-extrabold inline-block mr-0.5",
                isDark ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" : "text-blue-600"
              )}
              animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >C</motion.span>apture&nbsp;&nbsp;
            
            <motion.span 
              className={cn(
                "text-2xl font-extrabold inline-block mr-0.5",
                isDark ? "text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.8)]" : "text-purple-600"
              )}
              animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.1, 1] }}
              transition={{ duration: 3, delay: 1, repeat: Infinity, ease: "easeInOut" }}
            >J</motion.span>ournal&nbsp;&nbsp;
            
            <motion.span 
              className={cn(
                "text-2xl font-extrabold inline-block mr-0.5",
                isDark ? "text-lime-400 drop-shadow-[0_0_8px_rgba(163,230,53,0.8)]" : "text-emerald-600"
              )}
              animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.1, 1] }}
              transition={{ duration: 3, delay: 2, repeat: Infinity, ease: "easeInOut" }}
            >W</motion.span>rap-up
          </h1>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav 
        className={cn(
          "flex items-center gap-1 p-1 rounded-xl border transition-colors duration-300",
          isDark 
            ? "bg-black/40 border-white/5" 
            : "bg-gray-100/80 border-gray-200/50"
        )}
      >
        <TabButton active={activeTab === "tasks"} onClick={handleTasksClick} icon={CheckSquare} label="待办" isDark={isDark} />
        <TabButton active={activeTab === "plans"} onClick={handlePlansClick} icon={Target} label="计划" isDark={isDark} />
        <TabButton active={activeTab === "notes"} onClick={handleNotesClick} icon={Book} label="笔记" isDark={isDark} />
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* 灵动岛开关 */}
        <button
          onClick={handleToggleIsland}
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
            islandActive
              ? isDark 
                ? "bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] border border-[var(--neon-cyan)]/30" 
                : "bg-cyan-100 text-cyan-600 border border-cyan-200"
              : isDark 
                ? "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10" 
                : "bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 border border-gray-200"
          )}
          title={islandActive ? "关闭灵动岛" : "打开灵动岛"}
        >
          <Sparkles className="w-5 h-5" />
        </button>

        {/* 主题切换按钮 */}
        <button
          onClick={handleToggleTheme}
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
            isDark 
              ? "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10" 
              : "bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 border border-gray-200"
          )}
          title={isDark ? "切换到浅色主题" : "切换到暗色主题"}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* 设置按钮 */}
        <button
          onClick={onOpenSettings}
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
            isDark 
              ? "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10" 
              : "bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 border border-gray-200"
          )}
          title="设置"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* 时间显示移到最右侧 */}
        <div className={cn(
          "ml-2 text-xs font-medium tabular-nums opacity-60",
          isDark ? "text-white" : "text-gray-600"
        )}>
          {currentTime.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {/* 底部时间进度条 */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-transparent overflow-hidden">
        <motion.div 
          className={cn(
            "h-full",
            isDark ? "bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500" : "bg-blue-500"
          )}
          style={{ 
            width: `${(currentTime.getHours() * 60 + currentTime.getMinutes()) / (24 * 60) * 100}%`,
            opacity: 0.5
          }}
          transition={{ duration: 60, ease: "linear" }}
        />
      </div>
    </header>
  );
});

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  isDark: boolean;
}

const TabButton = memo(function TabButton({ active, onClick, icon: Icon, label, isDark }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
        active
          ? isDark ? "text-[var(--neon-cyan)]" : "text-[var(--neon-cyan)]"
          : isDark ? "text-white/40 hover:text-white/70" : "text-gray-600 hover:text-gray-900"
      )}
    >
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 rounded-lg"
          style={isDark ? {
            background: "rgba(0, 255, 255, 0.1)",
            border: "1px solid rgba(0, 255, 255, 0.3)",
            boxShadow: "0 0 20px rgba(0, 255, 255, 0.2), inset 0 0 20px rgba(0, 255, 255, 0.05)",
          } : {
            background: "#FFFFFF",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 8px rgba(0, 0, 0, 0.02)",
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
        />
      )}
      <Icon 
        className={cn(
          "w-4 h-4 relative z-10", 
          active && isDark && "drop-shadow-[0_0_8px_var(--neon-cyan)]"
        )} 
      />
      <span className="relative z-10">{label}</span>
    </button>
  );
});
