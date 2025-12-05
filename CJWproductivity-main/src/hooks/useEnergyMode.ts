import { useState, useEffect } from "react";

export type EnergyMode = "FOCUS" | "ADMIN" | "RECHARGE";

interface EnergyModeConfig {
  mode: EnergyMode;
  label: string;
  description: string;
  theme: {
    glassOpacity: number;
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
  };
}

const ENERGY_CONFIGS: Record<EnergyMode, EnergyModeConfig> = {
  FOCUS: {
    mode: "FOCUS",
    label: "专注模式",
    description: "深度工作时间 - 只显示正在执行的任务",
    theme: {
      glassOpacity: 0.15,
      primaryColor: "#3B82F6", // Blue
      backgroundColor: "#0f172a",
      textColor: "#ffffff",
    },
  },
  ADMIN: {
    mode: "ADMIN",
    label: "管理模式",
    description: "计划与整理时间 - 显示所有任务栏",
    theme: {
      glassOpacity: 0.2,
      primaryColor: "#8B5CF6", // Purple
      backgroundColor: "#1e1b4b",
      textColor: "#f1f5f9",
    },
  },
  RECHARGE: {
    mode: "RECHARGE",
    label: "充电模式",
    description: "休息时间 - 界面淡化，准备明天",
    theme: {
      glassOpacity: 0.1,
      primaryColor: "#6366F1", // Indigo
      backgroundColor: "#0c0a09",
      textColor: "#a1a1aa",
    },
  },
};

function getCurrentEnergyMode(): EnergyMode {
  const now = new Date();
  const hour = now.getHours();

  // Focus Mode: 09:00 - 12:00
  if (hour >= 9 && hour < 12) {
    return "FOCUS";
  }
  // Admin Mode: 14:00 - 18:00
  if (hour >= 14 && hour < 18) {
    return "ADMIN";
  }
  // Recharge Mode: 20:00+ or before 9:00
  if (hour >= 20 || hour < 9) {
    return "RECHARGE";
  }
  // Default to ADMIN for lunch (12:00-14:00) and evening (18:00-20:00)
  return "ADMIN";
}

export function useEnergyMode() {
  const [mode, setMode] = useState<EnergyMode>(getCurrentEnergyMode);
  const [manualOverride, setManualOverride] = useState<EnergyMode | null>(null);

  // Update mode every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (!manualOverride) {
        setMode(getCurrentEnergyMode());
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [manualOverride]);

  const currentMode = manualOverride || mode;
  const config = ENERGY_CONFIGS[currentMode];

  const setManualMode = (newMode: EnergyMode | null) => {
    setManualOverride(newMode);
    if (newMode) {
      setMode(newMode);
    } else {
      setMode(getCurrentEnergyMode());
    }
  };

  return {
    mode: currentMode,
    config,
    isManualOverride: !!manualOverride,
    setManualMode,
    resetToAuto: () => setManualMode(null),
    allModes: Object.values(ENERGY_CONFIGS),
  };
}

export { ENERGY_CONFIGS };
