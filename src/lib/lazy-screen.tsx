/**
 * Lazy Screen Loader for React Native
 * Provides lazy loading with proper Suspense fallback for tab screens
 */

import React, { Suspense, ComponentType, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Text } from '~/components/ui/text';
import { LazyLoadingMetrics } from './lazy-loading-utils';

// Fallback component for lazy-loaded screens
const LazyScreenFallback: React.FC<{ screenName?: string }> = ({
  screenName,
}) => {
  useEffect(() => {
    if (screenName) {
      LazyLoadingMetrics.startLoad(screenName);
    }
  }, [screenName]);

  return (
    <View className="flex-1 justify-center items-center bg-background">
      <View className="items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text variant="body" className="mt-4 text-muted-foreground">
          {screenName ? `Loading ${screenName}...` : 'Loading...'}
        </Text>
      </View>
    </View>
  );
};

/**
 * Higher-order component that wraps a lazy-loaded screen with Suspense
 */
export function withLazyScreen<P extends object>(
  LazyComponent: React.LazyExoticComponent<ComponentType<P>>,
  screenName?: string
) {
  const WrappedComponent: React.FC<P> = (props) => {
    useEffect(() => {
      if (screenName) {
        LazyLoadingMetrics.endLoad(screenName);
      }
    }, []);

    return (
      <Suspense fallback={<LazyScreenFallback screenName={screenName} />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };

  WrappedComponent.displayName = `LazyScreen(${LazyComponent.name || screenName || 'Unknown'})`;

  return WrappedComponent;
}

/**
 * Create a lazy-loaded screen with automatic Suspense wrapper
 */
export function createLazyScreen<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  screenName?: string
) {
  const LazyComponent = React.lazy(importFn);
  return withLazyScreen(LazyComponent, screenName);
}
