export type LogLevel = "debug" | "info" | "warn" | "error";

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class ConsoleLogger implements Logger {
  private level: LogLevel;

  constructor(level?: LogLevel) {
    if (level) {
      this.level = level;
    } else if (typeof process !== "undefined" && process.env?.NODE_ENV !== "production") {
      this.level = "debug";
    } else {
      this.level = "warn";
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog("debug")) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog("info")) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog("warn")) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog("error")) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }
}

export const logger = new ConsoleLogger();

export function createLogger(level?: LogLevel): Logger {
  return new ConsoleLogger(level);
}