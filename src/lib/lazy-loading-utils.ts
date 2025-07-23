/**
 * Lazy Loading Utilities
 * Helper functions for managing lazy-loaded components and performance
 */

import { Platform } from 'react-native';
import { recordLazyStart, recordLazyComplete } from './performance-monitor';

/**
 * Preload a lazy component when conditions are optimal
 */
export const preloadComponent = async (
  importFn: () => Promise<any>
): Promise<void> => {
  try {
    // Only preload on good network conditions
    if (Platform.OS === 'web') {
      const connection = (navigator as any)?.connection;
      if (connection && (connection.downlink < 1.5 || connection.saveData)) {
        return; // Skip preloading on slow connections
      }
    }

    // Preload with a small delay to not interfere with initial render
    setTimeout(async () => {
      try {
        await importFn();
        console.log('Component preloaded successfully');
      } catch (error) {
        console.warn('Component preload failed:', error);
      }
    }, 1000);
  } catch (error) {
    console.warn('Preload check failed:', error);
  }
};

/**
 * Performance monitoring for lazy loading
 */
export class LazyLoadingMetrics {
  private static loadTimes = new Map<string, number>();
  private static loadStartTimes = new Map<string, number>();

  static startLoad(componentName: string): void {
    this.loadStartTimes.set(componentName, Date.now());
    recordLazyStart(componentName);
  }

  static endLoad(componentName: string): void {
    const startTime = this.loadStartTimes.get(componentName);
    if (startTime) {
      const loadTime = Date.now() - startTime;
      this.loadTimes.set(componentName, loadTime);
      recordLazyComplete(componentName);
      console.log(`Lazy load: ${componentName} took ${loadTime}ms`);
    }
  }

  static getMetrics(): { [key: string]: number } {
    return Object.fromEntries(this.loadTimes.entries());
  }

  static getAverageLoadTime(): number {
    const times = Array.from(this.loadTimes.values());
    return times.length > 0
      ? times.reduce((a, b) => a + b, 0) / times.length
      : 0;
  }
}

/**
 * Smart preloading strategies
 */
export const preloadStrategies = {
  /**
   * Preload likely-to-be-used tab screens based on user patterns
   */
  preloadLikelyTabs: () => {
    // This could be enhanced with user behavior analytics
    // For now, preload the most commonly used tabs
    setTimeout(() => {
      preloadComponent(() => import('../screens/tabs/mood'));
    }, 2000);
  },

  /**
   * Preload components when user hovers/focuses on related UI
   */
  onUserIntent: (componentName: string, importFn: () => Promise<any>) => {
    preloadComponent(importFn);
  },

  /**
   * Preload during idle time
   */
  onIdle: (importFn: () => Promise<any>) => {
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(() => preloadComponent(importFn));
    } else {
      // Fallback for React Native
      setTimeout(() => preloadComponent(importFn), 3000);
    }
  },
};
