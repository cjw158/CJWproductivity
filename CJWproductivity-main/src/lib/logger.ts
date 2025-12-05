/**
 * @file logger.ts
 * @description 生产级日志工具
 * 
 * 功能：
 * 1. 开发环境输出到控制台
 * 2. 生产环境静默或上报到监控服务
 * 3. 支持日志级别
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerConfig {
  level: LogLevel;
  enableInProd: boolean;
}

const config: LoggerConfig = {
  level: import.meta.env.DEV ? "debug" : "warn",
  enableInProd: false,
};

const levels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  if (import.meta.env.PROD && !config.enableInProd && level !== "error") {
    return false;
  }
  return levels[level] >= levels[config.level];
}

function formatMessage(level: LogLevel, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
}

export const logger = {
  debug(message: string, ...args: unknown[]) {
    if (shouldLog("debug")) {
      console.debug(formatMessage("debug", message), ...args);
    }
  },

  info(message: string, ...args: unknown[]) {
    if (shouldLog("info")) {
      console.info(formatMessage("info", message), ...args);
    }
  },

  warn(message: string, ...args: unknown[]) {
    if (shouldLog("warn")) {
      console.warn(formatMessage("warn", message), ...args);
    }
  },

  error(message: string, ...args: unknown[]) {
    if (shouldLog("error")) {
      console.error(formatMessage("error", message), ...args);
      
      // 生产环境可以上报错误
      if (import.meta.env.PROD) {
        // 这里可以集成错误上报服务
        // reportError(message, args);
      }
    }
  },

  // 用于快捷键等操作的简短日志
  action(action: string) {
    if (import.meta.env.DEV) {
      console.log(`[ACTION] ${action}`);
    }
  },
};

export default logger;
