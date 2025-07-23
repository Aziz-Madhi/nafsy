/**
 * Performance Monitoring System
 * Comprehensive performance tracking for React Native app optimization validation
 */

import { Platform } from 'react-native';
import { mmkvJSON } from './mmkv-storage';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'startup' | 'navigation' | 'render' | 'memory' | 'network';
  metadata?: Record<string, any>;
}

interface AppStartupMetrics {
  appLaunchTime: number;
  jsLoadTime: number;
  firstRenderTime: number;
  timeToInteractive: number;
  initialMemoryUsage: number;
}

interface BundleMetrics {
  totalBundleSize?: number;
  criticalPathSize: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private startupMetrics: Partial<AppStartupMetrics> = {};
  private bundleMetrics: BundleMetrics = {
    criticalPathSize: 0,
  };

  private static instance: PerformanceMonitor;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  constructor() {
    this.initializeMonitoring();
    this.loadPersistedMetrics();
  }

  private initializeMonitoring(): void {
    if (Platform.OS === 'web') {
      // Web-specific performance monitoring
      this.monitorWebPerformance();
    } else {
      // React Native performance monitoring
      this.monitorNativePerformance();
    }
  }

  private monitorWebPerformance(): void {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = window.performance.getEntriesByType(
        'navigation'
      )[0] as any;

      if (navigation) {
        this.startupMetrics.appLaunchTime =
          navigation.loadEventEnd - navigation.navigationStart;
        this.startupMetrics.jsLoadTime =
          navigation.domContentLoadedEventEnd -
          navigation.domContentLoadedEventStart;
        this.startupMetrics.firstRenderTime =
          navigation.domComplete - navigation.navigationStart;
      }
    }
  }

  private monitorNativePerformance(): void {
    // React Native startup time estimation
    const startTime = Date.now();

    setTimeout(() => {
      const estimatedStartupTime = Date.now() - startTime;
      this.recordMetric({
        name: 'estimated_startup_time',
        value: estimatedStartupTime,
        timestamp: Date.now(),
        type: 'startup',
      });
    }, 100);
  }

  // Startup Performance Tracking
  markAppLaunchStart(): void {
    this.startupMetrics.appLaunchTime = Date.now();
    this.recordMetric({
      name: 'app_launch_start',
      value: Date.now(),
      timestamp: Date.now(),
      type: 'startup',
    });
  }

  markFirstRender(): void {
    const renderTime = Date.now();
    if (this.startupMetrics.appLaunchTime) {
      const timeToFirstRender = renderTime - this.startupMetrics.appLaunchTime;
      this.startupMetrics.firstRenderTime = timeToFirstRender;

      this.recordMetric({
        name: 'time_to_first_render',
        value: timeToFirstRender,
        timestamp: Date.now(),
        type: 'startup',
        metadata: { critical: true },
      });
    }
  }

  markTimeToInteractive(): void {
    const interactiveTime = Date.now();
    if (this.startupMetrics.appLaunchTime) {
      const timeToInteractive =
        interactiveTime - this.startupMetrics.appLaunchTime;
      this.startupMetrics.timeToInteractive = timeToInteractive;

      this.recordMetric({
        name: 'time_to_interactive',
        value: timeToInteractive,
        timestamp: Date.now(),
        type: 'startup',
        metadata: { critical: true },
      });
    }
  }

  // Memory Usage Tracking
  recordMemoryUsage(context: string): void {
    if (Platform.OS === 'web' && (performance as any).memory) {
      const memory = (performance as any).memory;
      this.recordMetric({
        name: 'memory_usage',
        value: memory.usedJSHeapSize,
        timestamp: Date.now(),
        type: 'memory',
        metadata: {
          context,
          totalHeapSize: memory.totalJSHeapSize,
          heapSizeLimit: memory.jsHeapSizeLimit,
        },
      });
    } else {
      // Estimate memory for React Native (placeholder)
      this.recordMetric({
        name: 'memory_usage_estimate',
        value: Math.random() * 100 + 50, // Placeholder estimation
        timestamp: Date.now(),
        type: 'memory',
        metadata: { context, platform: Platform.OS },
      });
    }
  }

  // Navigation Performance
  startNavigationTimer(screenName: string): void {
    this.recordMetric({
      name: `navigation_start_${screenName}`,
      value: Date.now(),
      timestamp: Date.now(),
      type: 'navigation',
      metadata: { screenName, phase: 'start' },
    });
  }

  endNavigationTimer(screenName: string): void {
    const startMetric = this.metrics
      .filter((m) => m.name === `navigation_start_${screenName}`)
      .pop();

    if (startMetric) {
      const navigationTime = Date.now() - startMetric.value;
      this.recordMetric({
        name: `navigation_duration_${screenName}`,
        value: navigationTime,
        timestamp: Date.now(),
        type: 'navigation',
        metadata: {
          screenName,
          phase: 'complete',
          duration: navigationTime,
        },
      });
    }
  }

  // Bundle Analysis
  recordBundleMetric(metric: 'critical-path-size', size: number): void {
    this.bundleMetrics.criticalPathSize += size;

    this.recordMetric({
      name: `bundle_${metric.replace('-', '_')}`,
      value: size,
      timestamp: Date.now(),
      type: 'network',
      metadata: { bundleType: metric },
    });
  }

  // Core metric recording
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only last 1000 metrics to prevent memory issues
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }

    // Persist critical metrics
    if (metric.metadata?.critical) {
      this.persistMetric(metric);
    }

    // Log significant metrics
    if (this.shouldLogMetric(metric)) {
      console.log(
        `🚀 Performance: ${metric.name} = ${metric.value}ms`,
        metric.metadata
      );
    }
  }

  private shouldLogMetric(metric: PerformanceMetric): boolean {
    // Log startup metrics, slow navigations, and memory issues
    return (
      metric.type === 'startup' ||
      (metric.type === 'navigation' && metric.value > 500) ||
      (metric.type === 'memory' && metric.metadata?.critical)
    );
  }

  private persistMetric(metric: PerformanceMetric): void {
    try {
      const persistedMetrics = mmkvJSON.get('performance_metrics', []);
      persistedMetrics.push(metric);

      // Keep only last 50 persisted metrics
      const recentMetrics = persistedMetrics.slice(-50);
      mmkvJSON.set('performance_metrics', recentMetrics);
    } catch (error) {
      console.warn('Failed to persist performance metric:', error);
    }
  }

  private loadPersistedMetrics(): void {
    try {
      const persistedMetrics = mmkvJSON.get('performance_metrics', []);
      console.log(
        `📊 Loaded ${persistedMetrics.length} persisted performance metrics`
      );
    } catch (error) {
      console.warn('Failed to load persisted metrics:', error);
    }
  }

  // Analytics and Reporting
  getStartupMetrics(): AppStartupMetrics {
    return {
      appLaunchTime: this.startupMetrics.appLaunchTime || 0,
      jsLoadTime: this.startupMetrics.jsLoadTime || 0,
      firstRenderTime: this.startupMetrics.firstRenderTime || 0,
      timeToInteractive: this.startupMetrics.timeToInteractive || 0,
      initialMemoryUsage: this.startupMetrics.initialMemoryUsage || 0,
    };
  }

  getBundleMetrics(): BundleMetrics {
    return { ...this.bundleMetrics };
  }

  getOptimizationReport(): {
    totalBundleSize: number;
    performanceScore: number;
  } {
    const totalBundleSize = this.bundleMetrics.criticalPathSize;

    // Simple performance score (0-100) - focus on startup and navigation
    let performanceScore = 100;
    if (
      this.startupMetrics.timeToInteractive &&
      this.startupMetrics.timeToInteractive > 3000
    )
      performanceScore -= 30;
    if (
      this.startupMetrics.firstRenderTime &&
      this.startupMetrics.firstRenderTime > 2000
    )
      performanceScore -= 20;

    return {
      totalBundleSize,
      performanceScore: Math.max(0, performanceScore),
    };
  }

  // Development helpers
  logAllMetrics(): void {
    console.group('📊 Performance Metrics Summary');
    console.log('Startup:', this.getStartupMetrics());
    console.log('Bundle:', this.getBundleMetrics());
    console.log('Optimization Report:', this.getOptimizationReport());
    console.groupEnd();
  }

  exportMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  clearMetrics(): void {
    this.metrics = [];
    this.startupMetrics = {};
    this.bundleMetrics = {
      criticalPathSize: 0,
    };
  }
}

// Singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Convenience functions
export const markAppStart = () => performanceMonitor.markAppLaunchStart();
export const markFirstRender = () => performanceMonitor.markFirstRender();
export const markInteractive = () => performanceMonitor.markTimeToInteractive();
export const recordMemory = (context: string) =>
  performanceMonitor.recordMemoryUsage(context);
export const startNavigation = (screen: string) =>
  performanceMonitor.startNavigationTimer(screen);
export const endNavigation = (screen: string) =>
  performanceMonitor.endNavigationTimer(screen);
