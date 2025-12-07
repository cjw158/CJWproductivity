/**
 * @file SettingsModal.tsx
 * @description 设置弹窗组件
 * 
 * 功能：
 * - 分组显示设置项
 * - 支持即时预览
 * - 导入/导出设置
 * - 重置为默认
 */

import { memo, useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Settings,
  Palette,
  Sparkles,
  Keyboard,
  Database,
  Bell,
  Info,
  RotateCcw,
  Download,
  Upload,
  Sun,
  Moon,
  Monitor,
  Check,
  Code2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import {
  useSettings,
  useUpdateSettings,
  useResetSettings,
  useExportSettings,
  useImportSettings,
} from "@/hooks/useSettings";
import type { 
  SettingsCategory, 
  ThemeMode, 
  FontSize,
  StartPage,
  LiveWallpaperType,
} from "@/types/settings";
import { toast } from "@/hooks/useToast";
import { showIsland, hideIsland } from "@/lib/island";
import { logger } from "@/lib/logger";
import { downloadBackup, importFromFile } from "@/lib/backup";
import { useLanguage } from "@/contexts/LanguageContext";
import { languageNames } from "@/i18n";
import type { Language } from "@/types/settings";
import logoImage from "/logo.png";

// ============ 常量 ============

const CATEGORY_IDS: {
  id: SettingsCategory;
  icon: React.ElementType;
}[] = [
  { id: "general", icon: Settings },
  { id: "theme", icon: Palette },
  { id: "island", icon: Sparkles },
  { id: "shortcuts", icon: Keyboard },
  { id: "data", icon: Database },
  { id: "notifications", icon: Bell },
  { id: "developer", icon: Code2 },
  { id: "about", icon: Info },
];

// ============ 主组件 ============

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal = memo(function SettingsModal({
  isOpen,
  onClose,
}: SettingsModalProps) {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>("general");
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { t } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={onClose}
        >
          {/* 背景遮罩 */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* 弹窗主体 */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "relative w-[800px] h-[600px] rounded-2xl overflow-hidden flex",
              isDark
                ? "bg-[#1a1a1f] border border-white/10"
                : "bg-white border border-gray-200 shadow-2xl"
            )}
          >
            {/* 左侧导航 */}
            <div
              className={cn(
                "w-48 flex-shrink-0 border-r flex flex-col",
                isDark ? "bg-black/20 border-white/5" : "bg-gray-50 border-gray-100"
              )}
            >
              <div className="p-4">
                <h2 className={cn("text-lg font-bold", isDark ? "text-white" : "text-gray-900")}>
                  {t("settings.title")}
                </h2>
              </div>

              <nav className="flex-1 px-2 space-y-1">
                {CATEGORY_IDS.map(({ id, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveCategory(id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      activeCategory === id
                        ? isDark
                          ? "bg-white/10 text-white"
                          : "bg-white text-gray-900 shadow-sm"
                        : isDark
                          ? "text-white/60 hover:bg-white/5 hover:text-white"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {t(`settings.categories.${id}`)}
                  </button>
                ))}
              </nav>
            </div>

            {/* 右侧内容 */}
            <div className="flex-1 flex flex-col">
              {/* 头部 */}
              <div
                className={cn(
                  "flex items-center justify-between px-6 py-4 border-b",
                  isDark ? "border-white/5" : "border-gray-100"
                )}
              >
                <h3 className={cn("text-lg font-semibold", isDark ? "text-white" : "text-gray-900")}>
                  {t(`settings.categories.${activeCategory}`)}
                </h3>
                <button
                  onClick={onClose}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    isDark
                      ? "hover:bg-white/10 text-white/60 hover:text-white"
                      : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                  )}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 内容区 */}
              <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCategory}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeCategory === "general" && <GeneralSettings isDark={isDark} />}
                    {activeCategory === "theme" && <ThemeSettings isDark={isDark} />}
                    {activeCategory === "island" && <IslandSettings isDark={isDark} />}
                    {activeCategory === "shortcuts" && <ShortcutSettings isDark={isDark} />}
                    {activeCategory === "data" && <DataSettings isDark={isDark} />}
                    {activeCategory === "notifications" && <NotificationSettings isDark={isDark} />}
                    {activeCategory === "developer" && <DeveloperSettings isDark={isDark} />}
                    {activeCategory === "about" && <AboutSection isDark={isDark} />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// ============ 设置项组件 ============

interface SettingItemProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  isDark: boolean;
}

const SettingItem = memo(function SettingItem({
  label,
  description,
  children,
  isDark,
}: SettingItemProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
      <div className="flex-1 pr-4">
        <h4 className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
          {label}
        </h4>
        {description && (
          <p className={cn("text-sm mt-0.5", isDark ? "text-white/40" : "text-gray-500")}>
            {description}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
});

// ============ 自定义下拉组件 ============

interface CustomSelectOption<T extends string | number> {
  value: T;
  label: string;
}

interface CustomSelectProps<T extends string | number> {
  value: T;
  options: CustomSelectOption<T>[];
  onChange: (value: T) => void;
  isDark: boolean;
  minWidth?: string;
}

function CustomSelect<T extends string | number>({ 
  value, 
  options, 
  onChange, 
  isDark,
  minWidth = "140px"
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
          isDark 
            ? "bg-white/5 text-white border border-white/10 hover:bg-white/10" 
            : "bg-gray-100 text-gray-900 hover:bg-gray-200"
        )}
        style={{ minWidth }}
      >
        <span>{selectedOption?.label}</span>
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute right-0 top-full mt-1 z-50 rounded-lg border shadow-xl overflow-hidden",
              isDark 
                ? "bg-[#1a1a1f] border-white/10" 
                : "bg-white border-gray-200"
            )}
            style={{ minWidth }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-3 py-2.5 text-sm text-left transition-colors flex items-center justify-between",
                  value === option.value
                    ? isDark 
                      ? "bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)]" 
                      : "bg-blue-50 text-blue-600"
                    : isDark 
                      ? "text-white/80 hover:bg-white/5" 
                      : "text-gray-700 hover:bg-gray-50"
                )}
              >
                <span>{option.label}</span>
                {value === option.value && (
                  <Check className="w-4 h-4" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============ 通用设置 ============

// 字体大小范围
const FONT_SIZE_MIN = 12;
const FONT_SIZE_MAX = 24;
const FONT_SIZE_DEFAULT = 16;

const GeneralSettings = memo(function GeneralSettings({ isDark }: { isDark: boolean }) {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const { t, language, setLanguage, availableLanguages } = useLanguage();
  const [localFontSize, setLocalFontSize] = useState<FontSize>(settings?.general.fontSize ?? FONT_SIZE_DEFAULT);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };
    if (isLangDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isLangDropdownOpen]);

  // 同步设置中的字体大小到本地状态
  useEffect(() => {
    if (settings?.general.fontSize) {
      setLocalFontSize(settings.general.fontSize);
    }
  }, [settings?.general.fontSize]);

  const handleFontSizeChange = (size: number) => {
    const clampedSize = Math.min(Math.max(size, FONT_SIZE_MIN), FONT_SIZE_MAX);
    logger.debug("[GeneralSettings] Font size change:", clampedSize);
    setLocalFontSize(clampedSize);
    // 立即应用到 DOM
    const root = document.documentElement;
    root.style.setProperty("--base-font-size", `${clampedSize}px`);
    root.style.fontSize = `${clampedSize}px`;
    // 保存到设置
    updateSettings.mutate({ general: { fontSize: clampedSize } });
  };

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    setIsLangDropdownOpen(false);
  };

  return (
    <div className="space-y-1">
      {/* 语言设置 */}
      <SettingItem 
        label={t("settings.general.language")} 
        description={t("settings.general.languageDesc")} 
        isDark={isDark}
      >
        <div ref={langDropdownRef} className="relative">
          <button
            onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
            className={cn(
              "flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm min-w-[140px] transition-colors",
              isDark 
                ? "bg-white/5 text-white border border-white/10 hover:bg-white/10" 
                : "bg-gray-100 text-gray-900 hover:bg-gray-200"
            )}
          >
            <span>{languageNames[language]}</span>
            <ChevronDown className={cn(
              "w-4 h-4 transition-transform",
              isLangDropdownOpen && "rotate-180"
            )} />
          </button>
          
          <AnimatePresence>
            {isLangDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  "absolute right-0 top-full mt-1 z-50 min-w-[140px] rounded-lg border shadow-xl overflow-hidden",
                  isDark 
                    ? "bg-[#1a1a1f] border-white/10" 
                    : "bg-white border-gray-200"
                )}
              >
                {availableLanguages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageSelect(lang)}
                    className={cn(
                      "w-full px-3 py-2.5 text-sm text-left transition-colors flex items-center justify-between",
                      language === lang
                        ? isDark 
                          ? "bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)]" 
                          : "bg-blue-50 text-blue-600"
                        : isDark 
                          ? "text-white/80 hover:bg-white/5" 
                          : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <span>{languageNames[lang]}</span>
                    {language === lang && (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SettingItem>

      {/* 字体大小 - 滚轮调节 */}
      <SettingItem 
        label={t("settings.general.fontSize")} 
        description={t("settings.general.fontSizeDesc", { size: localFontSize, min: FONT_SIZE_MIN, max: FONT_SIZE_MAX })} 
        isDark={isDark}
      >
        <div 
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg cursor-ns-resize select-none transition-all",
            isDark 
              ? "bg-white/5 hover:bg-white/10 border border-white/10" 
              : "bg-gray-100 hover:bg-gray-200 border border-gray-200"
          )}
          onWheel={(e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -1 : 1;
            const newSize = Math.min(Math.max(localFontSize + delta, FONT_SIZE_MIN), FONT_SIZE_MAX);
            handleFontSizeChange(newSize);
          }}
          title="滚动鼠标滚轮调节"
        >
          <span className={cn(
            "text-lg font-bold tabular-nums min-w-[48px] text-center",
            isDark ? "text-[var(--neon-cyan)]" : "text-blue-600"
          )}>
            {localFontSize}px
          </span>
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => handleFontSizeChange(Math.min(localFontSize + 1, FONT_SIZE_MAX))}
              className={cn(
                "p-0.5 rounded transition-colors",
                isDark 
                  ? "hover:bg-white/20 text-white/50 hover:text-white" 
                  : "hover:bg-gray-300 text-gray-400 hover:text-gray-600"
              )}
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleFontSizeChange(Math.max(localFontSize - 1, FONT_SIZE_MIN))}
              className={cn(
                "p-0.5 rounded transition-colors",
                isDark 
                  ? "hover:bg-white/20 text-white/50 hover:text-white" 
                  : "hover:bg-gray-300 text-gray-400 hover:text-gray-600"
              )}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </SettingItem>

      {/* 启动页面 */}
      <SettingItem 
        label={t("settings.general.startPage")} 
        description={t("settings.general.startPageDesc")} 
        isDark={isDark}
      >
        <CustomSelect
          value={settings?.general.startPage ?? "tasks"}
          options={[
            { value: "tasks" as StartPage, label: t("nav.tasks") },
            { value: "plans" as StartPage, label: t("nav.plans") },
            { value: "notes" as StartPage, label: t("nav.notes") },
          ]}
          onChange={(value) => updateSettings.mutate({ general: { startPage: value as StartPage } })}
          isDark={isDark}
          minWidth="120px"
        />
      </SettingItem>

      {/* 最小化到托盘 */}
      <SettingItem 
        label={t("settings.general.minimizeToTray")} 
        description={t("settings.general.minimizeToTrayDesc")} 
        isDark={isDark}
      >
        <Toggle
          checked={settings?.general.minimizeToTray ?? true}
          onChange={(checked) => updateSettings.mutate({ general: { minimizeToTray: checked } })}
          isDark={isDark}
        />
      </SettingItem>
    </div>
  );
});

// ============ 外观设置 ============

const ThemeSettings = memo(function ThemeSettings({ isDark }: { isDark: boolean }) {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const { toggleTheme } = useTheme();
  const { t } = useLanguage();

  const themeModes: { value: ThemeMode; labelKey: string; icon: React.ElementType }[] = [
    { value: "light", labelKey: "settings.theme.light", icon: Sun },
    { value: "dark", labelKey: "settings.theme.dark", icon: Moon },
    { value: "system", labelKey: "settings.theme.system", icon: Monitor },
  ];

  const accentColors = [
    "#00FFFF", // Cyan
    "#FF6B6B", // Red
    "#4ECDC4", // Teal
    "#45B7D1", // Blue
    "#96CEB4", // Green
    "#FFEAA7", // Yellow
    "#DDA0DD", // Plum
    "#FF9F43", // Orange
  ];

  return (
    <div className="space-y-1">
      <SettingItem label={t("settings.theme.mode")} description={t("settings.theme.modeDesc")} isDark={isDark}>
        <div className="flex gap-1">
          {themeModes.map(({ value, labelKey, icon: Icon }) => (
            <button
              key={value}
              onClick={() => {
                updateSettings.mutate({ theme: { mode: value } });
                if (value !== "system") {
                  // 同步到主题上下文
                  if ((value === "dark") !== isDark) {
                    toggleTheme();
                  }
                }
              }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                settings?.theme.mode === value
                  ? isDark
                    ? "bg-[var(--neon-cyan)] text-black"
                    : "bg-blue-500 text-white"
                  : isDark
                    ? "bg-white/5 text-white/60 hover:bg-white/10"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              <Icon className="w-4 h-4" />
              {t(labelKey)}
            </button>
          ))}
        </div>
      </SettingItem>

      <SettingItem label={t("settings.theme.accentColor")} description={t("settings.theme.accentColorDesc")} isDark={isDark}>
        <div className="flex gap-2">
          {accentColors.map((color) => (
            <button
              key={color}
              onClick={() => updateSettings.mutate({ theme: { accentColor: color } })}
              className={cn(
                "w-7 h-7 rounded-full transition-transform hover:scale-110",
                settings?.theme.accentColor === color && "ring-2 ring-offset-2 ring-offset-black"
              )}
              style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}40` }}
            >
              {settings?.theme.accentColor === color && (
                <Check className="w-4 h-4 mx-auto text-black" />
              )}
            </button>
          ))}
        </div>
      </SettingItem>

      <SettingItem label={t("settings.theme.animations")} description={t("settings.theme.animationsDesc")} isDark={isDark}>
        <Toggle
          checked={settings?.theme.enableAnimations ?? true}
          onChange={(checked) => updateSettings.mutate({ theme: { enableAnimations: checked } })}
          isDark={isDark}
        />
      </SettingItem>

      <SettingItem label={t("settings.theme.glassEffect")} description={t("settings.theme.glassEffectDesc")} isDark={isDark}>
        <Toggle
          checked={settings?.theme.enableGlassEffect ?? true}
          onChange={(checked) => updateSettings.mutate({ theme: { enableGlassEffect: checked } })}
          isDark={isDark}
        />
      </SettingItem>
    </div>
  );
});

// ============ 灵动岛设置 ============

const IslandSettings = memo(function IslandSettings({ isDark }: { isDark: boolean }) {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const { t } = useLanguage();

  // 启用/禁用灵动岛
  const handleToggleEnabled = useCallback(async (checked: boolean) => {
    logger.debug("[IslandSettings] Toggle enabled:", checked);
    try {
      if (checked) {
        logger.debug("[IslandSettings] Calling showIsland...");
        await showIsland();
        logger.debug("[IslandSettings] showIsland completed");
      } else {
        logger.debug("[IslandSettings] Calling hideIsland...");
        await hideIsland();
        logger.debug("[IslandSettings] hideIsland completed");
      }
      updateSettings.mutate({ island: { enabled: checked } });
    } catch (error) {
      logger.error("[IslandSettings] Error:", error);
    }
  }, [updateSettings]);

  return (
    <div className="space-y-1">
      <SettingItem label={t("settings.island.enabled")} description={t("settings.island.enabledDesc")} isDark={isDark}>
        <Toggle
          checked={settings?.island.enabled ?? false}
          onChange={handleToggleEnabled}
          isDark={isDark}
        />
      </SettingItem>

      <SettingItem label={t("settings.island.autoShow")} description={t("settings.island.autoShowDesc")} isDark={isDark}>
        <Toggle
          checked={settings?.island.autoShow ?? false}
          onChange={(checked) => updateSettings.mutate({ island: { autoShow: checked } })}
          isDark={isDark}
        />
      </SettingItem>

      <SettingItem label={t("settings.island.position")} description={t("settings.island.positionDesc")} isDark={isDark}>
        <div className={cn(
          "px-3 py-1.5 rounded-lg text-sm",
          isDark ? "bg-white/5 text-white/60" : "bg-gray-100 text-gray-600"
        )}>
          {t("settings.island.freeDrag")}
        </div>
      </SettingItem>

      <SettingItem label={t("settings.island.opacity")} description={t("settings.island.opacityDesc")} isDark={isDark}>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="50"
            max="100"
            value={settings?.island.opacity ?? 90}
            onChange={(e) =>
              updateSettings.mutate({ island: { opacity: Number(e.target.value) } })
            }
            className="w-32"
          />
          <span className={cn("text-sm w-10", isDark ? "text-white/60" : "text-gray-500")}>
            {settings?.island.opacity}%
          </span>
        </div>
      </SettingItem>
    </div>
  );
});

// ============ 快捷键设置 ============

// 快捷键录制组件
const ShortcutRecorder = memo(function ShortcutRecorder({
  value,
  onChange,
  isDark,
  recordingText,
}: {
  value: string;
  onChange: (value: string) => void;
  isDark: boolean;
  recordingText: string;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [keys, setKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isRecording) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const key = e.key;
      const newKeys = new Set(keys);

      // 修饰键
      if (e.ctrlKey) newKeys.add("Ctrl");
      if (e.shiftKey) newKeys.add("Shift");
      if (e.altKey) newKeys.add("Alt");
      if (e.metaKey) newKeys.add("Meta");

      // 普通按键（排除单独的修饰键）
      if (!["Control", "Shift", "Alt", "Meta"].includes(key)) {
        newKeys.add(key.length === 1 ? key.toUpperCase() : key);
      }

      setKeys(newKeys);
    };

    const handleKeyUp = () => {
      // 当释放所有键时，保存快捷键
      if (keys.size > 0) {
        const shortcut = Array.from(keys).join("+");
        onChange(shortcut);
        setIsRecording(false);
        setKeys(new Set());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isRecording, keys, onChange]);

  const displayValue = isRecording
    ? keys.size > 0
      ? Array.from(keys).join(" + ")
      : recordingText
    : value.replace(/\+/g, " + ");

  return (
    <button
      onClick={() => setIsRecording(true)}
      onBlur={() => {
        setIsRecording(false);
        setKeys(new Set());
      }}
      className={cn(
        "px-3 py-1.5 rounded-lg text-sm font-mono transition-all outline-none min-w-[140px] text-center",
        isRecording
          ? isDark
            ? "bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500 animate-pulse"
            : "bg-blue-100 text-blue-600 border-2 border-blue-500 animate-pulse"
          : isDark
          ? "bg-white/5 text-white/60 border border-white/10 hover:border-white/30"
          : "bg-gray-100 text-gray-600 border border-gray-200 hover:border-gray-400"
      )}
    >
      {displayValue}
    </button>
  );
});

const ShortcutSettings = memo(function ShortcutSettings({ isDark }: { isDark: boolean }) {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const { t } = useLanguage();

  // 全局快捷键配置
  const globalShortcuts = [
    { key: "globalQuickCapture", labelKey: "settings.shortcuts.globalQuickCapture" },
    { key: "globalToggleIsland", labelKey: "settings.shortcuts.globalToggleIsland" },
    { key: "globalShowMain", labelKey: "settings.shortcuts.globalShowMain" },
  ] as const;

  // 更新快捷键并重新注册
  const handleShortcutChange = useCallback(async (key: string, value: string) => {
    updateSettings.mutate({ shortcuts: { [key]: value } });
    
    // 如果是全局快捷键，需要重新注册
    if (key.startsWith("global")) {
      const { registerGlobalShortcuts } = await import("@/lib/globalShortcuts");
      await registerGlobalShortcuts({
        globalQuickCapture: key === "globalQuickCapture" ? value : settings?.shortcuts.globalQuickCapture,
        globalToggleIsland: key === "globalToggleIsland" ? value : settings?.shortcuts.globalToggleIsland,
        globalShowMain: key === "globalShowMain" ? value : settings?.shortcuts.globalShowMain,
      });
    }
  }, [updateSettings, settings]);

  return (
    <div className="space-y-4">
      {/* 全局快捷键 */}
      <div>
        <h4 className={cn(
          "text-xs font-medium mb-2 uppercase tracking-wide",
          isDark ? "text-cyan-400/80" : "text-blue-600"
        )}>
          {t("settings.shortcuts.globalShortcuts")}
        </h4>
        <div className="space-y-1">
          {globalShortcuts.map(({ key, labelKey }) => (
            <SettingItem key={key} label={t(labelKey)} isDark={isDark}>
              <ShortcutRecorder
                value={settings?.shortcuts[key] ?? ""}
                onChange={(value) => handleShortcutChange(key, value)}
                isDark={isDark}
                recordingText={t("settings.shortcuts.recording")}
              />
            </SettingItem>
          ))}
        </div>
      </div>

      <p className={cn("text-xs", isDark ? "text-white/30" : "text-gray-400")}>
        {t("settings.shortcuts.hint")}
      </p>
    </div>
  );
});

// ============ 数据设置 ============

const DataSettings = memo(function DataSettings({ isDark }: { isDark: boolean }) {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const resetSettings = useResetSettings();
  const exportSettingsMutation = useExportSettings();
  const importSettingsMutation = useImportSettings();
  const { t } = useLanguage();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // 导出所有数据（任务、计划、笔记、设置）
  const handleExportAll = useCallback(async () => {
    setIsExporting(true);
    try {
      const saved = await downloadBackup();
      if (saved) {
        toast({ title: t("settings.data.exportSuccess"), description: t("settings.data.exportSuccessDesc"), variant: "success" });
      }
    } catch (error) {
      toast({ title: t("settings.data.exportFailed"), variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  }, [t]);

  // 导入所有数据
  const handleImportAll = useCallback(() => {
    if (!confirm(t("settings.data.importConfirm"))) {
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setIsImporting(true);
        try {
          const result = await importFromFile(file, true);
          if (result.success) {
            toast({ 
              title: t("settings.data.importSuccess"), 
              description: t("settings.data.importSuccessDesc", { 
                tasks: result.stats?.tasks || 0, 
                plans: result.stats?.plans || 0, 
                notes: result.stats?.notes || 0 
              }),
              variant: "success" 
            });
            setTimeout(() => window.location.reload(), 1500);
          } else {
            toast({ title: t("settings.data.importFailed"), description: result.message, variant: "destructive" });
          }
        } catch {
          toast({ title: t("settings.data.importFailed"), description: t("settings.data.importFailedDesc"), variant: "destructive" });
        } finally {
          setIsImporting(false);
        }
      }
    };
    input.click();
  }, [t]);

  // 仅导出设置
  const handleExportSettings = useCallback(async () => {
    try {
      const json = await exportSettingsMutation.mutateAsync();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cjw-settings-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: t("settings.data.settingsExportSuccess"), variant: "success" });
    } catch {
      toast({ title: t("settings.data.exportFailed"), variant: "destructive" });
    }
  }, [exportSettingsMutation, t]);

  // 仅导入设置
  const handleImportSettings = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const json = await file.text();
          await importSettingsMutation.mutateAsync(json);
          toast({ title: t("settings.data.settingsImportSuccess"), variant: "success" });
        } catch {
          toast({ title: t("settings.data.importFailed"), description: t("settings.data.importFailedDesc"), variant: "destructive" });
        }
      }
    };
    input.click();
  }, [importSettingsMutation, t]);

  const handleReset = useCallback(async () => {
    if (confirm(t("settings.data.resetConfirm"))) {
      await resetSettings.mutateAsync();
      toast({ title: t("settings.data.resetSuccess") });
    }
  }, [resetSettings, t]);

  return (
    <div className="space-y-1">
      <SettingItem label={t("settings.data.autoBackup")} description={t("settings.data.autoBackupDesc")} isDark={isDark}>
        <Toggle
          checked={settings?.data.autoBackup ?? true}
          onChange={(checked) => updateSettings.mutate({ data: { autoBackup: checked } })}
          isDark={isDark}
        />
      </SettingItem>

      {/* 完整数据备份 */}
      <div className="pt-6 space-y-3">
        <h4 className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
          {t("settings.data.fullBackup")}
        </h4>
        <p className={cn("text-xs", isDark ? "text-white/40" : "text-gray-500")}>
          {t("settings.data.fullBackupDesc")}
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleExportAll}
            disabled={isExporting}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              isDark
                ? "bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/30 border border-[var(--neon-cyan)]/30"
                : "bg-blue-500 text-white hover:bg-blue-600",
              isExporting && "opacity-50 cursor-not-allowed"
            )}
          >
            <Download className="w-4 h-4" />
            {isExporting ? t("settings.data.exporting") : t("settings.data.exportAll")}
          </button>
          <button
            onClick={handleImportAll}
            disabled={isImporting}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              isDark
                ? "bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/30 border border-[var(--neon-cyan)]/30"
                : "bg-blue-500 text-white hover:bg-blue-600",
              isImporting && "opacity-50 cursor-not-allowed"
            )}
          >
            <Upload className="w-4 h-4" />
            {isImporting ? t("settings.data.importing") : t("settings.data.importAll")}
          </button>
        </div>
      </div>

      {/* 仅设置 */}
      <div className="pt-6 space-y-3">
        <h4 className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
          {t("settings.data.settingsOnly")}
        </h4>
        <p className={cn("text-xs", isDark ? "text-white/40" : "text-gray-500")}>
          {t("settings.data.settingsOnlyDesc")}
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleExportSettings}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              isDark
                ? "bg-white/5 text-white/80 hover:bg-white/10"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            <Download className="w-4 h-4" />
            {t("settings.data.exportSettings")}
          </button>
          <button
            onClick={handleImportSettings}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              isDark
                ? "bg-white/5 text-white/80 hover:bg-white/10"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            <Upload className="w-4 h-4" />
            {t("settings.data.importSettings")}
          </button>
          <button
            onClick={handleReset}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              "text-red-500 hover:bg-red-500/10"
            )}
          >
            <RotateCcw className="w-4 h-4" />
            {t("settings.data.resetSettings")}
          </button>
        </div>
      </div>
    </div>
  );
});

// ============ 通知设置 ============

const NotificationSettings = memo(function NotificationSettings({ isDark }: { isDark: boolean }) {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const { t } = useLanguage();

  return (
    <div className="space-y-1">
      <SettingItem label={t("settings.notifications.enabled")} description={t("settings.notifications.enabledDesc")} isDark={isDark}>
        <Toggle
          checked={settings?.notifications.enabled ?? true}
          onChange={(checked) => updateSettings.mutate({ notifications: { enabled: checked } })}
          isDark={isDark}
        />
      </SettingItem>

      <SettingItem label={t("settings.notifications.taskReminder")} description={t("settings.notifications.taskReminderDesc")} isDark={isDark}>
        <Toggle
          checked={settings?.notifications.taskReminder ?? true}
          onChange={(checked) => updateSettings.mutate({ notifications: { taskReminder: checked } })}
          isDark={isDark}
        />
      </SettingItem>

      <SettingItem label={t("settings.notifications.reminderTime")} description={t("settings.notifications.reminderTimeDesc")} isDark={isDark}>
        <CustomSelect
          value={settings?.notifications.reminderMinutes ?? 15}
          options={[
            { value: 5, label: t("settings.notifications.minutes", { n: 5 }) },
            { value: 15, label: t("settings.notifications.minutes", { n: 15 }) },
            { value: 30, label: t("settings.notifications.minutes", { n: 30 }) },
            { value: 60, label: t("settings.notifications.hour") },
          ]}
          onChange={(value) => updateSettings.mutate({ notifications: { reminderMinutes: value } })}
          isDark={isDark}
          minWidth="120px"
        />
      </SettingItem>

      <SettingItem label={t("settings.notifications.sound")} description={t("settings.notifications.soundDesc")} isDark={isDark}>
        <Toggle
          checked={settings?.notifications.soundEnabled ?? true}
          onChange={(checked) => updateSettings.mutate({ notifications: { soundEnabled: checked } })}
          isDark={isDark}
        />
      </SettingItem>
    </div>
  );
});

// ============ 关于 ============

// ============ 开发者设置 ============

const WALLPAPER_TYPES: { value: LiveWallpaperType; label: string; description: string }[] = [
  { value: "none", label: "关闭", description: "不显示动态壁纸" },
  { value: "nebula", label: "流动星云", description: "缓慢流动的彩色星云效果" },
  { value: "matrix", label: "矩阵数字雨", description: "黑客帝国风格的数字下落" },
  { value: "particles", label: "粒子网络", description: "漂浮的粒子和连线" },
  { value: "waves", label: "波浪线条", description: "柔和的多彩波浪" },
];

const DeveloperSettings = memo(function DeveloperSettings({ isDark }: { isDark: boolean }) {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const { t } = useLanguage();
  
  const developerSettings = settings?.developer;

  return (
    <div className="space-y-1">
      <div className={cn(
        "rounded-xl p-4 mb-4",
        isDark ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-yellow-50 border border-yellow-200"
      )}>
        <p className={cn("text-sm", isDark ? "text-yellow-400" : "text-yellow-700")}>
          ⚠️ 开发者设置包含实验性功能，可能会影响性能或稳定性。
        </p>
      </div>

      <SettingItem 
        label="动态壁纸" 
        description="启用 WebGL 渲染的动态背景效果" 
        isDark={isDark}
      >
        <Toggle
          checked={developerSettings?.enableLiveWallpaper ?? false}
          onChange={(checked) => updateSettings.mutate({ developer: { enableLiveWallpaper: checked } })}
          isDark={isDark}
        />
      </SettingItem>

      {developerSettings?.enableLiveWallpaper && (
        <>
          <SettingItem label={t("settings.developer.wallpaperType")} description={t("settings.developer.wallpaperTypeDesc")} isDark={isDark}>
            <CustomSelect
              value={developerSettings?.liveWallpaperType ?? "nebula"}
              options={WALLPAPER_TYPES.map(({ value, label }) => ({ value, label }))}
              onChange={(value) => updateSettings.mutate({ developer: { liveWallpaperType: value as LiveWallpaperType } })}
              isDark={isDark}
              minWidth="140px"
            />
          </SettingItem>

          <SettingItem 
            label="不透明度" 
            description={`当前: ${developerSettings?.liveWallpaperOpacity ?? 30}%`} 
            isDark={isDark}
          >
            <div className="flex items-center gap-3 min-w-[200px]">
              <span className={cn("text-xs", isDark ? "text-white/40" : "text-gray-400")}>0%</span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={developerSettings?.liveWallpaperOpacity ?? 30}
                onChange={(e) => updateSettings.mutate({ developer: { liveWallpaperOpacity: Number(e.target.value) } })}
                className={cn(
                  "flex-1 h-2 rounded-full appearance-none cursor-pointer",
                  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full",
                  isDark 
                    ? "bg-white/10 [&::-webkit-slider-thumb]:bg-[var(--neon-cyan)]" 
                    : "bg-gray-200 [&::-webkit-slider-thumb]:bg-blue-500"
                )}
              />
              <span className={cn("text-xs", isDark ? "text-white/40" : "text-gray-400")}>100%</span>
            </div>
          </SettingItem>

          <SettingItem 
            label="动画速度" 
            description={`当前: ${developerSettings?.liveWallpaperSpeed?.toFixed(1) ?? "1.0"}x`} 
            isDark={isDark}
          >
            <div className="flex items-center gap-3 min-w-[200px]">
              <span className={cn("text-xs", isDark ? "text-white/40" : "text-gray-400")}>0.1x</span>
              <input
                type="range"
                min={0.1}
                max={2.0}
                step={0.1}
                value={developerSettings?.liveWallpaperSpeed ?? 1.0}
                onChange={(e) => updateSettings.mutate({ developer: { liveWallpaperSpeed: Number(e.target.value) } })}
                className={cn(
                  "flex-1 h-2 rounded-full appearance-none cursor-pointer",
                  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full",
                  isDark 
                    ? "bg-white/10 [&::-webkit-slider-thumb]:bg-[var(--neon-cyan)]" 
                    : "bg-gray-200 [&::-webkit-slider-thumb]:bg-blue-500"
                )}
              />
              <span className={cn("text-xs", isDark ? "text-white/40" : "text-gray-400")}>2.0x</span>
            </div>
          </SettingItem>
        </>
      )}

      <SettingItem 
        label="显示 FPS" 
        description="在右上角显示帧率计数器（用于调试）" 
        isDark={isDark}
      >
        <Toggle
          checked={developerSettings?.showFps ?? false}
          onChange={(checked) => updateSettings.mutate({ developer: { showFps: checked } })}
          isDark={isDark}
        />
      </SettingItem>

      {/* 壁纸类型预览 */}
      {developerSettings?.enableLiveWallpaper && (
        <div className={cn(
          "mt-4 rounded-xl p-4",
          isDark ? "bg-white/5" : "bg-gray-50"
        )}>
          <h4 className={cn("font-medium mb-2", isDark ? "text-white" : "text-gray-900")}>
            壁纸效果预览
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {WALLPAPER_TYPES.filter(t => t.value !== "none").map(({ value, label, description }) => (
              <button
                key={value}
                onClick={() => updateSettings.mutate({ developer: { liveWallpaperType: value } })}
                className={cn(
                  "p-3 rounded-lg text-left transition-all",
                  developerSettings?.liveWallpaperType === value
                    ? isDark 
                      ? "bg-[var(--neon-cyan)]/20 border border-[var(--neon-cyan)]/50" 
                      : "bg-blue-50 border border-blue-300"
                    : isDark
                      ? "bg-white/5 border border-white/10 hover:bg-white/10"
                      : "bg-white border border-gray-200 hover:bg-gray-100"
                )}
              >
                <div className={cn("font-medium text-sm", isDark ? "text-white" : "text-gray-900")}>
                  {label}
                </div>
                <div className={cn("text-xs mt-1", isDark ? "text-white/50" : "text-gray-500")}>
                  {description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// ============ 关于页面 ============

const AboutSection = memo(function AboutSection({ isDark }: { isDark: boolean }) {
  const [activeTab, setActiveTab] = useState<"about" | "features" | "shortcuts">("about");
  
  const sectionClass = cn(
    "rounded-xl p-4 mb-4",
    isDark ? "bg-white/5" : "bg-gray-50"
  );
  
  const headingClass = cn(
    "font-semibold mb-2",
    isDark ? "text-white" : "text-gray-900"
  );
  
  const textClass = cn(
    "text-sm leading-relaxed",
    isDark ? "text-white/70" : "text-gray-600"
  );
  
  const subTextClass = cn(
    "text-xs",
    isDark ? "text-white/40" : "text-gray-400"
  );

  return (
    <div className="space-y-4">
      {/* 顶部 Logo 和版本 */}
      <div className="text-center pb-4 border-b" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
        <div
          className={cn(
            "w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-3 overflow-hidden",
            isDark ? "bg-white/5" : "bg-gray-100"
          )}
        >
          <img src={logoImage} alt="Logo" className="w-14 h-14" style={{ filter: isDark ? "none" : "invert(1) hue-rotate(180deg)" }} />
        </div>
        <h3 className={cn("text-xl font-bold", isDark ? "text-white" : "text-gray-900")}>
          CJWproductivity
        </h3>
        <p className={subTextClass}>版本 0.1.0 · Capture. Journal. Wrap-up.</p>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
        {[
          { id: "about", label: "关于" },
          { id: "features", label: "功能介绍" },
          { id: "shortcuts", label: "快捷键" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              "flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
              activeTab === tab.id
                ? isDark ? "bg-white/10 text-white" : "bg-white text-gray-900 shadow-sm"
                : isDark ? "text-white/50 hover:text-white/70" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 关于 */}
      {activeTab === "about" && (
        <div className="space-y-4">
          <div className={sectionClass}>
            <h4 className={headingClass}>📌 项目简介</h4>
            <p className={textClass}>
              CJWproductivity 是一款现代化的桌面生产力工具，采用 Tauri + React + TypeScript 技术栈开发。
              集成了任务管理、计划图库、富文本笔记三大核心模块，配合灵动岛悬浮窗实现快速捕获和状态监控。
            </p>
          </div>
          
          <div className={sectionClass}>
            <h4 className={headingClass}>🛠 技术栈</h4>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[
                { name: "Tauri 2.0", desc: "跨平台框架" },
                { name: "React 18", desc: "前端框架" },
                { name: "TypeScript", desc: "类型安全" },
                { name: "TailwindCSS", desc: "样式系统" },
                { name: "Framer Motion", desc: "动画库" },
                { name: "SQLite", desc: "本地数据库" },
              ].map((tech) => (
                <div key={tech.name} className={cn("px-2 py-1.5 rounded-lg text-xs", isDark ? "bg-white/5" : "bg-white")}>
                  <span className={isDark ? "text-[var(--neon-cyan)]" : "text-blue-600"}>{tech.name}</span>
                  <span className={subTextClass}> · {tech.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-center pt-2">
            <button
              onClick={async () => {
                try {
                  const { invoke } = await import("@tauri-apps/api/core");
                  await invoke("restart_app");
                } catch (e) {
                  console.error("Failed to restart:", e);
                }
              }}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                isDark 
                  ? "bg-white/10 hover:bg-white/20 text-white" 
                  : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              )}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              重启应用
            </button>
          </div>

          <p className={cn("text-center text-xs pt-2", subTextClass)}>
            © 2024 CJW. All rights reserved.
          </p>
        </div>
      )}

      {/* 功能介绍 */}
      {activeTab === "features" && (
        <div className="space-y-3">
          <div className={sectionClass}>
            <h4 className={headingClass}>📋 待办任务</h4>
            <ul className={cn("space-y-1 text-sm", textClass)}>
              <li>• 日历视图 + 任务列表双模式</li>
              <li>• 支持计时任务、实际/预计时长追踪</li>
              <li>• 任务状态：待办 → 进行中 → 已完成</li>
              <li>• 右键菜单快捷操作</li>
            </ul>
          </div>
          
          <div className={sectionClass}>
            <h4 className={headingClass}>🖼 计划图库</h4>
            <ul className={cn("space-y-1 text-sm", textClass)}>
              <li>• 瀑布流展示手写计划图片</li>
              <li>• 支持拖拽上传、<kbd className="px-1 rounded bg-black/10">Ctrl+V</kbd> 粘贴上传</li>
              <li>• 图片预览：缩放/旋转/全屏</li>
              <li>• 按月份自动分组</li>
            </ul>
          </div>
          
          <div className={sectionClass}>
            <h4 className={headingClass}>📝 笔记</h4>
            <ul className={cn("space-y-1 text-sm", textClass)}>
              <li>• 三栏布局：文件夹 / 列表 / 编辑器</li>
              <li>• 富文本编辑器（标题、列表、代码等）</li>
              <li>• 右键菜单：置顶、移动、删除</li>
              <li>• 实时搜索过滤</li>
            </ul>
          </div>
          
          <div className={sectionClass}>
            <h4 className={headingClass}>✨ 灵动岛</h4>
            <ul className={cn("space-y-1 text-sm", textClass)}>
              <li>• 悬浮窗显示今日任务进度</li>
              <li>• 快速捕获笔记（<kbd className="px-1 rounded bg-black/10">Alt+J</kbd>）</li>
              <li>• 流光边框动画效果</li>
              <li>• 支持拖拽移动位置</li>
            </ul>
          </div>
        </div>
      )}

      {/* 快捷键 */}
      {activeTab === "shortcuts" && (
        <div className="space-y-3">
          <div className={sectionClass}>
            <h4 className={headingClass}>🌐 全局快捷键</h4>
            <div className="space-y-2 mt-2">
              {[
                { keys: "Alt + I", desc: "显示/隐藏灵动岛" },
                { keys: "Alt + J", desc: "快速捕获笔记" },
              ].map((item) => (
                <div key={item.keys} className="flex justify-between items-center">
                  <span className={textClass}>{item.desc}</span>
                  <kbd className={cn("px-2 py-1 rounded text-xs font-mono", isDark ? "bg-white/10 text-white/80" : "bg-gray-200 text-gray-700")}>{item.keys}</kbd>
                </div>
              ))}
            </div>
          </div>
          
          <div className={sectionClass}>
            <h4 className={headingClass}>🖼 图片预览快捷键</h4>
            <div className="space-y-2 mt-2">
              {[
                { keys: "+ / -", desc: "放大 / 缩小" },
                { keys: "R", desc: "旋转 90°" },
                { keys: "F", desc: "切换全屏" },
                { keys: "I", desc: "显示信息面板" },
                { keys: "0", desc: "重置缩放" },
                { keys: "← / →", desc: "上一张 / 下一张" },
                { keys: "Esc", desc: "关闭预览" },
              ].map((item) => (
                <div key={item.keys} className="flex justify-between items-center">
                  <span className={textClass}>{item.desc}</span>
                  <kbd className={cn("px-2 py-1 rounded text-xs font-mono", isDark ? "bg-white/10 text-white/80" : "bg-gray-200 text-gray-700")}>{item.keys}</kbd>
                </div>
              ))}
            </div>
          </div>
          
          <div className={sectionClass}>
            <h4 className={headingClass}>📝 笔记快速捕获</h4>
            <div className="space-y-2 mt-2">
              {[
                { keys: "Shift + Enter", desc: "保存笔记" },
                { keys: "Enter", desc: "换行" },
                { keys: "Esc", desc: "取消/关闭" },
              ].map((item) => (
                <div key={item.keys} className="flex justify-between items-center">
                  <span className={textClass}>{item.desc}</span>
                  <kbd className={cn("px-2 py-1 rounded text-xs font-mono", isDark ? "bg-white/10 text-white/80" : "bg-gray-200 text-gray-700")}>{item.keys}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// ============ 通用组件 ============

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  isDark: boolean;
}

const Toggle = memo(function Toggle({ checked, onChange, isDark }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors",
        checked
          ? "bg-[var(--neon-cyan)]"
          : isDark
            ? "bg-white/10"
            : "bg-gray-200"
      )}
    >
      <div
        className={cn(
          "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
});

export default SettingsModal;
