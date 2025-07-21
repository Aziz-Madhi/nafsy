import React, { Suspense } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Text } from './text';

interface LazyModalProps {
  visible: boolean;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  fallback?: React.ReactNode;
  [key: string]: any;
}

const DefaultFallback = () => (
  <View
    style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    }}
  >
    <View
      style={{
        backgroundColor: 'white',
        padding: 32,
        borderRadius: 16,
        alignItems: 'center',
      }}
    >
      <ActivityIndicator size="large" color="#2196F3" />
      <Text variant="body" className="text-[#5A4A3A] mt-4">
        Loading...
      </Text>
    </View>
  </View>
);

export const LazyModal = React.memo(function LazyModal({
  visible,
  component: Component,
  fallback = <DefaultFallback />,
  ...props
}: LazyModalProps) {
  // Only render when visible to enable true lazy loading
  if (!visible) {
    return null;
  }

  return (
    <Suspense fallback={fallback}>
      <Component visible={visible} {...props} />
    </Suspense>
  );
});
