import { MMKV } from 'react-native-mmkv';

interface StoreMetrics {
  storeName: string;
  hydrationTime: number;
  operationsCount: number;
  errorCount: number;
  lastError: Error | null;
  lastSuccessTime: number;
  averageOperationTime: number;
}

interface PerformanceSnapshot {
  timestamp: number;
  storeMetrics: Map<string, StoreMetrics>;
  memoryUsage?: number;
  storageSize?: number;
}

class StorePerformanceMonitor {
  private metrics: Map<string, StoreMetrics> = new Map();
  private operationTimes: Map<string, number[]> = new Map();
  private isMonitoringEnabled: boolean = false;
  private monitoringStorage: MMKV;

  constructor() {
    try {
      this.monitoringStorage = new MMKV({
        id: 'store-performance-monitoring',
        encryptionKey: 'store-monitor-key-v1',
      });
      this.loadPersistedMetrics();
    } catch (error) {
      console.warn(
        'StorePerformanceMonitor: Failed to initialize storage:',
        error
      );
      // Fallback to in-memory only
    }
  }

  /**
   * Enable performance monitoring
   */
  enable(): void {
    this.isMonitoringEnabled = true;
    console.log('Store performance monitoring enabled');
  }

  /**
   * Disable performance monitoring
   */
  disable(): void {
    this.isMonitoringEnabled = false;
    console.log('Store performance monitoring disabled');
  }

  /**
   * Record store hydration performance
   */
  recordHydration(storeName: string, startTime: number, endTime: number): void {
    if (!this.isMonitoringEnabled) return;

    const hydrationTime = endTime - startTime;

    if (!this.metrics.has(storeName)) {
      this.metrics.set(storeName, {
        storeName,
        hydrationTime: 0,
        operationsCount: 0,
        errorCount: 0,
        lastError: null,
        lastSuccessTime: Date.now(),
        averageOperationTime: 0,
      });
    }

    const metrics = this.metrics.get(storeName)!;
    metrics.hydrationTime = hydrationTime;
    metrics.lastSuccessTime = Date.now();

    this.persistMetrics();

    console.log(`Store ${storeName} hydrated in ${hydrationTime}ms`);
  }

  /**
   * Record store operation performance
   */
  recordOperation(
    storeName: string,
    operationType: string,
    duration: number
  ): void {
    if (!this.isMonitoringEnabled) return;

    const metrics = this.getOrCreateMetrics(storeName);
    metrics.operationsCount++;

    // Track operation times for average calculation
    const operationKey = `${storeName}_${operationType}`;
    if (!this.operationTimes.has(operationKey)) {
      this.operationTimes.set(operationKey, []);
    }

    const times = this.operationTimes.get(operationKey)!;
    times.push(duration);

    // Keep only last 50 operations for average
    if (times.length > 50) {
      times.shift();
    }

    // Update average operation time
    metrics.averageOperationTime =
      times.reduce((a, b) => a + b, 0) / times.length;
    metrics.lastSuccessTime = Date.now();

    this.persistMetrics();

    // Log slow operations
    if (duration > 100) {
      console.warn(
        `Slow store operation: ${storeName}.${operationType} took ${duration}ms`
      );
    }
  }

  /**
   * Record store error
   */
  recordError(storeName: string, error: Error): void {
    if (!this.isMonitoringEnabled) return;

    const metrics = this.getOrCreateMetrics(storeName);
    metrics.errorCount++;
    metrics.lastError = error;

    this.persistMetrics();

    console.error(`Store error in ${storeName}:`, error);
  }

  /**
   * Get performance metrics for a specific store
   */
  getStoreMetrics(storeName: string): StoreMetrics | null {
    return this.metrics.get(storeName) || null;
  }

  /**
   * Get performance metrics for all stores
   */
  getAllMetrics(): Map<string, StoreMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Create performance snapshot
   */
  createSnapshot(): PerformanceSnapshot {
    const snapshot: PerformanceSnapshot = {
      timestamp: Date.now(),
      storeMetrics: new Map(this.metrics),
    };

    // Add memory usage if available (React Native specific)
    try {
      if (global.performance && global.performance.memory) {
        snapshot.memoryUsage = global.performance.memory.usedJSHeapSize;
      }
    } catch (error) {
      // Memory info not available
    }

    // Add storage size
    try {
      if (this.monitoringStorage) {
        const keys = this.monitoringStorage.getAllKeys();
        snapshot.storageSize = keys.length;
      }
    } catch (error) {
      // Storage size not available
    }

    return snapshot;
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const snapshot = this.createSnapshot();
    const lines: string[] = [];

    lines.push(
      `Store Performance Report - ${new Date(snapshot.timestamp).toISOString()}`
    );
    lines.push('='.repeat(60));

    if (snapshot.storeMetrics.size === 0) {
      lines.push('No store metrics available');
      return lines.join('\n');
    }

    snapshot.storeMetrics.forEach((metrics, storeName) => {
      lines.push(`\nStore: ${storeName}`);
      lines.push(`  Hydration Time: ${metrics.hydrationTime}ms`);
      lines.push(`  Operations Count: ${metrics.operationsCount}`);
      lines.push(`  Error Count: ${metrics.errorCount}`);
      lines.push(
        `  Average Operation Time: ${metrics.averageOperationTime.toFixed(2)}ms`
      );
      lines.push(
        `  Last Success: ${new Date(metrics.lastSuccessTime).toLocaleString()}`
      );

      if (metrics.lastError) {
        lines.push(`  Last Error: ${metrics.lastError.message}`);
      }
    });

    if (snapshot.memoryUsage) {
      lines.push(
        `\nMemory Usage: ${(snapshot.memoryUsage / 1024 / 1024).toFixed(2)} MB`
      );
    }

    if (snapshot.storageSize) {
      lines.push(`Storage Keys: ${snapshot.storageSize}`);
    }

    return lines.join('\n');
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
    this.operationTimes.clear();

    try {
      this.monitoringStorage?.clearAll();
    } catch (error) {
      console.warn('Failed to clear monitoring storage:', error);
    }

    console.log('Store performance metrics reset');
  }

  /**
   * Check for performance issues
   */
  checkHealth(): { isHealthy: boolean; issues: string[] } {
    const issues: string[] = [];
    let isHealthy = true;

    this.metrics.forEach((metrics, storeName) => {
      // Check hydration time
      if (metrics.hydrationTime > 2000) {
        issues.push(
          `${storeName}: Slow hydration (${metrics.hydrationTime}ms)`
        );
        isHealthy = false;
      }

      // Check error rate
      const errorRate =
        metrics.errorCount / Math.max(metrics.operationsCount, 1);
      if (errorRate > 0.1) {
        issues.push(
          `${storeName}: High error rate (${(errorRate * 100).toFixed(1)}%)`
        );
        isHealthy = false;
      }

      // Check average operation time
      if (metrics.averageOperationTime > 50) {
        issues.push(
          `${storeName}: Slow operations (${metrics.averageOperationTime.toFixed(2)}ms avg)`
        );
        isHealthy = false;
      }

      // Check last success time (stale data)
      const timeSinceLastSuccess = Date.now() - metrics.lastSuccessTime;
      if (timeSinceLastSuccess > 5 * 60 * 1000) {
        // 5 minutes
        issues.push(
          `${storeName}: Stale data (${Math.round(timeSinceLastSuccess / 1000 / 60)} min ago)`
        );
        isHealthy = false;
      }
    });

    return { isHealthy, issues };
  }

  private getOrCreateMetrics(storeName: string): StoreMetrics {
    if (!this.metrics.has(storeName)) {
      this.metrics.set(storeName, {
        storeName,
        hydrationTime: 0,
        operationsCount: 0,
        errorCount: 0,
        lastError: null,
        lastSuccessTime: Date.now(),
        averageOperationTime: 0,
      });
    }
    return this.metrics.get(storeName)!;
  }

  private persistMetrics(): void {
    if (!this.monitoringStorage) return;

    try {
      const serializedMetrics = JSON.stringify(
        Array.from(this.metrics.entries())
      );
      this.monitoringStorage.set('store_metrics', serializedMetrics);
    } catch (error) {
      console.warn('Failed to persist store metrics:', error);
    }
  }

  private loadPersistedMetrics(): void {
    if (!this.monitoringStorage) return;

    try {
      const serializedMetrics =
        this.monitoringStorage.getString('store_metrics');
      if (serializedMetrics) {
        const entries = JSON.parse(serializedMetrics);
        this.metrics = new Map(entries);
      }
    } catch (error) {
      console.warn('Failed to load persisted store metrics:', error);
    }
  }
}

// Singleton instance
export const storePerformanceMonitor = new StorePerformanceMonitor();

// Development helper - enable monitoring in development
if (__DEV__) {
  storePerformanceMonitor.enable();
}

/**
 * Higher-order function to add performance monitoring to store operations
 */
export function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  storeName: string,
  operationType: string,
  fn: T
): T {
  return ((...args: any[]) => {
    const startTime = performance.now();

    try {
      const result = fn(...args);

      // Handle async operations
      if (result && typeof result.then === 'function') {
        return result
          .then((value: any) => {
            const endTime = performance.now();
            storePerformanceMonitor.recordOperation(
              storeName,
              operationType,
              endTime - startTime
            );
            return value;
          })
          .catch((error: Error) => {
            storePerformanceMonitor.recordError(storeName, error);
            throw error;
          });
      }

      // Handle sync operations
      const endTime = performance.now();
      storePerformanceMonitor.recordOperation(
        storeName,
        operationType,
        endTime - startTime
      );
      return result;
    } catch (error) {
      storePerformanceMonitor.recordError(storeName, error as Error);
      throw error;
    }
  }) as T;
}

export type { StoreMetrics, PerformanceSnapshot };
