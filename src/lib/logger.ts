/**
 * App Logger
 * Centralized logging utility with different levels and environment awareness
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: string;
  timestamp: string;
  data?: any;
}

class Logger {
  private isDevelopment: boolean;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;

  constructor() {
    this.isDevelopment = __DEV__ ?? false;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: string,
    data?: any
  ): LogEntry {
    return {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      data,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (!this.isDevelopment) {
      return level === 'warn' || level === 'error';
    }
    return true;
  }

  private formatMessage(entry: LogEntry): string {
    const prefix = entry.context ? `[${entry.context}]` : '';
    return `${prefix} ${entry.message}`;
  }

  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
  }

  debug(message: string, context?: string, data?: any): void {
    const entry = this.createLogEntry('debug', message, context, data);
    this.addToBuffer(entry);

    if (this.shouldLog('debug')) {
      console.log(`🐛 ${this.formatMessage(entry)}`, data || '');
    }
  }

  info(message: string, context?: string, data?: any): void {
    const entry = this.createLogEntry('info', message, context, data);
    this.addToBuffer(entry);

    if (this.shouldLog('info')) {
      console.log(`ℹ️ ${this.formatMessage(entry)}`, data || '');
    }
  }

  warn(message: string, context?: string, data?: any): void {
    const entry = this.createLogEntry('warn', message, context, data);
    this.addToBuffer(entry);

    if (this.shouldLog('warn')) {
      console.warn(`⚠️ ${this.formatMessage(entry)}`, data || '');
    }
  }

  error(message: string, context?: string, error?: Error | any): void {
    const entry = this.createLogEntry('error', message, context, error);
    this.addToBuffer(entry);

    if (this.shouldLog('error')) {
      console.error(`❌ ${this.formatMessage(entry)}`, error || '');
    }
  }

  // Specialized logging methods for common use cases

  storeError(message: string, storeContext: string, error?: Error | any): void {
    this.error(message, `Store:${storeContext}`, error);
  }

  apiError(message: string, endpoint: string, error?: Error | any): void {
    this.error(message, `API:${endpoint}`, error);
  }

  uiError(message: string, component: string, error?: Error | any): void {
    this.error(message, `UI:${component}`, error);
  }

  performance(message: string, data?: any): void {
    this.info(message, 'Performance', data);
  }

  security(message: string, data?: any): void {
    this.warn(message, 'Security', data);
  }

  // Development-only methods

  devLog(message: string, data?: any): void {
    if (this.isDevelopment) {
      this.debug(message, 'Dev', data);
    }
  }

  // Get recent logs for debugging
  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  // Get logs by level
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logBuffer.filter((entry) => entry.level === level);
  }

  // Clear log buffer
  clearLogs(): void {
    this.logBuffer = [];
  }

  // Export logs for debugging (development only)
  exportLogs(): string {
    if (!this.isDevelopment) {
      return 'Log export not available in production';
    }

    return JSON.stringify(this.logBuffer, null, 2);
  }
}

// Create singleton instance
export const logger = new Logger();

// Convenience exports for common use cases
export const devLog = logger.devLog.bind(logger);
export const logError = logger.error.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logDebug = logger.debug.bind(logger);

// Specialized exports
export const storeError = logger.storeError.bind(logger);
export const apiError = logger.apiError.bind(logger);
export const uiError = logger.uiError.bind(logger);
export const performanceLog = logger.performance.bind(logger);
export const securityLog = logger.security.bind(logger);
