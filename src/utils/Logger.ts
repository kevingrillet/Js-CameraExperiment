/**
 * Logger - Centralized logging utility to replace console.* calls
 * Provides structured logging with error tracking
 */

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: string;
  error?: Error;
}

export class Logger {
  private static entries: LogEntry[] = [];
  private static maxEntries = 100;
  private static isDevelopment =
    typeof import.meta !== "undefined" &&
    typeof (import.meta as { env?: { DEV?: boolean } }).env?.DEV ===
      "boolean" &&
    (import.meta as unknown as { env: { DEV: boolean } }).env.DEV;

  /**
   * Log an informational message
   */
  static info(message: string, context?: string): void {
    this.log("info", message, context);
  }

  /**
   * Log a warning message
   */
  static warn(message: string, context?: string): void {
    this.log("warn", message, context);
  }

  /**
   * Log an error message
   */
  static error(message: string, error?: Error, context?: string): void {
    this.log("error", message, context, error);
  }

  /**
   * Log a debug message (only in development)
   */
  static debug(message: string, context?: string): void {
    if (this.isDevelopment) {
      this.log("debug", message, context);
    }
  }

  /**
   * Internal logging method
   */
  private static log(
    level: LogLevel,
    message: string,
    context?: string,
    error?: Error
  ): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      ...(context !== undefined && { context }),
      ...(error !== undefined && { error }),
    };

    // Store entry
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    // Output to console in development only
    if (this.isDevelopment) {
      const prefix = context !== undefined ? `[${context}]` : "";
      const fullMessage = `${prefix} ${message}`;

      switch (level) {
        case "error":
          console.error(fullMessage, error ?? "");
          break;
        case "warn":
          console.warn(fullMessage);
          break;
        case "debug":
          // eslint-disable-next-line no-console
          console.debug(fullMessage);
          break;
        default:
          // eslint-disable-next-line no-console
          console.log(fullMessage);
          break;
      }
    }
  }

  /**
   * Get all log entries
   */
  static getEntries(): LogEntry[] {
    return [...this.entries];
  }

  /**
   * Get entries filtered by level
   */
  static getEntriesByLevel(level: LogLevel): LogEntry[] {
    return this.entries.filter((entry) => entry.level === level);
  }

  /**
   * Clear all log entries
   */
  static clear(): void {
    this.entries = [];
  }

  /**
   * Export logs as JSON string
   */
  static export(): string {
    return JSON.stringify(this.entries, null, 2);
  }
}
