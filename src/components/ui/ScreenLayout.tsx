import React, { useMemo } from 'react';
import { View, ScrollView, ViewStyle, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from './text';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface ScreenLayoutProps {
  // Header configuration
  title?: string;
  subtitle?: string;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  headerCenter?: React.ReactNode;
  showHeader?: boolean;

  // Content configuration
  children: React.ReactNode;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;

  // Stats/summary section (common in mood, exercises, profile)
  statsSection?: React.ReactNode;

  // Layout variants
  variant?: 'default' | 'chat' | 'dashboard' | 'list';

  // Styling
  backgroundColor?: string;
  contentStyle?: ViewStyle;
  headerStyle?: ViewStyle;
  safeAreaStyle?: ViewStyle;

  // Animation
  animated?: boolean;
  animationDelay?: number;
}

// Header component
function ScreenHeader({
  title,
  subtitle,
  headerLeft,
  headerRight,
  headerCenter,
  style,
}: {
  title?: string;
  subtitle?: string;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  headerCenter?: React.ReactNode;
  style?: ViewStyle;
}) {
  if (!title && !headerCenter && !headerLeft && !headerRight) return null;

  return (
    <View
      className="flex-row justify-between items-center px-6 py-4"
      style={style}
    >
      {/* Left section */}
      <View className="flex-1 items-start">{headerLeft}</View>

      {/* Center section */}
      <View className="flex-2 items-center">
        {headerCenter || (
          <View className="items-center">
            {title && (
              <Text className="text-[#5A4A3A] text-xl font-bold text-center">
                {title}
              </Text>
            )}
            {subtitle && (
              <Text
                variant="caption1"
                className="text-[#5A4A3A]/70 text-center mt-1"
              >
                {subtitle}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Right section */}
      <View className="flex-1 items-end">{headerRight}</View>
    </View>
  );
}

// Stats section wrapper (common across mood/exercises/profile screens)
function StatsSection({ children }: { children: React.ReactNode }) {
  return <View className="px-6 py-4 mb-4">{children}</View>;
}

// Content wrapper based on variant
function ContentWrapper({
  children,
  variant,
  scrollable,
  refreshing,
  onRefresh,
  contentStyle,
}: {
  children: React.ReactNode;
  variant: 'default' | 'chat' | 'dashboard' | 'list';
  scrollable: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: ViewStyle;
}) {
  const refreshControl = useMemo(() => {
    if (!onRefresh) return undefined;
    return <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />;
  }, [refreshing, onRefresh]);

  // Chat variant - no scrolling, full height
  if (variant === 'chat') {
    return (
      <View className="flex-1" style={contentStyle}>
        {children}
      </View>
    );
  }

  // List variant - no padding, let list handle its own styling
  if (variant === 'list') {
    if (scrollable) {
      return (
        <ScrollView
          className="flex-1"
          style={contentStyle}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      );
    }
    return (
      <View className="flex-1" style={contentStyle}>
        {children}
      </View>
    );
  }

  // Dashboard/default variants - with padding
  const paddingClass = variant === 'dashboard' ? 'px-6' : 'px-4';

  if (scrollable) {
    return (
      <ScrollView
        className={`flex-1 ${paddingClass}`}
        style={contentStyle}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View className={`flex-1 ${paddingClass}`} style={contentStyle}>
      {children}
    </View>
  );
}

export function ScreenLayout({
  title,
  subtitle,
  headerLeft,
  headerRight,
  headerCenter,
  showHeader = true,
  children,
  scrollable = true,
  refreshing = false,
  onRefresh,
  statsSection,
  variant = 'default',
  backgroundColor = '#F2FAF9', // Default mental health app background
  contentStyle,
  headerStyle,
  safeAreaStyle,
  animated = false,
  animationDelay = 0,
}: ScreenLayoutProps) {
  const content = (
    <SafeAreaView
      className="flex-1"
      style={[{ backgroundColor }, safeAreaStyle]}
    >
      {/* Header */}
      {showHeader && (
        <ScreenHeader
          title={title}
          subtitle={subtitle}
          headerLeft={headerLeft}
          headerRight={headerRight}
          headerCenter={headerCenter}
          style={headerStyle}
        />
      )}

      {/* Stats section */}
      {statsSection && <StatsSection>{statsSection}</StatsSection>}

      {/* Main content */}
      <ContentWrapper
        variant={variant}
        scrollable={scrollable}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentStyle={contentStyle}
      >
        {children}
      </ContentWrapper>
    </SafeAreaView>
  );

  if (animated) {
    return (
      <Animated.View
        entering={FadeInDown.delay(animationDelay)}
        className="flex-1"
      >
        {content}
      </Animated.View>
    );
  }

  return content;
}

// Preset configurations for common screen types
export const ScreenPresets = {
  // Dashboard layout (mood, exercises screens)
  dashboard: {
    variant: 'dashboard' as const,
    scrollable: true,
    animated: true,
    backgroundColor: '#F2FAF9',
  },

  // Chat layout
  chat: {
    variant: 'chat' as const,
    scrollable: false,
    showHeader: false,
    backgroundColor: '#FFFFFF',
  },

  // Profile/settings layout
  profile: {
    variant: 'default' as const,
    scrollable: true,
    backgroundColor: '#F2FAF9',
  },

  // List layout (exercise details, etc.)
  list: {
    variant: 'list' as const,
    scrollable: false,
    backgroundColor: '#F2FAF9',
  },
};

// Convenience components with presets
export function DashboardLayout(props: Omit<ScreenLayoutProps, 'variant'>) {
  return <ScreenLayout {...props} {...ScreenPresets.dashboard} />;
}

export function ChatLayout(
  props: Omit<ScreenLayoutProps, 'variant' | 'showHeader' | 'scrollable'>
) {
  return <ScreenLayout {...props} {...ScreenPresets.chat} />;
}

export function ProfileLayout(props: Omit<ScreenLayoutProps, 'variant'>) {
  return <ScreenLayout {...props} {...ScreenPresets.profile} />;
}

export function ListLayout(
  props: Omit<ScreenLayoutProps, 'variant' | 'scrollable'>
) {
  return <ScreenLayout {...props} {...ScreenPresets.list} />;
}
