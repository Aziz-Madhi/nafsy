import React, { useMemo, useEffect } from 'react';
import {
  View,
  ScrollView,
  ViewStyle,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from './text';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSegments } from 'expo-router';
import { useScreenPadding } from '~/hooks/useScreenPadding';
import { useTranslation } from '~/hooks/useTranslation';
import { useColors } from '~/hooks/useColors';

// Calculate top padding for navigation bar only
function useNavigationBarTopPadding(): number {
  const screenPadding = useScreenPadding('list');
  return screenPadding.top;
}

// Calculate bottom padding based on current route (unchanged)
function useNavigationBarPadding(): number {
  const segments = useSegments();

  return useMemo(() => {
    // Get the current tab from segments (e.g., ['tabs', 'chat'])
    const currentTab = segments.length > 1 ? segments[1] : 'mood';

    // Use smaller, more reasonable values for bottom padding
    const baseHeight = currentTab === 'chat' ? 100 : 80; // Reduced from 180/90
    const bottomMargin = 25; // Reduced from 50

    return baseHeight + bottomMargin;
  }, [segments]);
}

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

  // Scroll control
  scrollViewRef?: React.RefObject<ScrollView>;
  onScroll?: (event: any) => void;
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
  const { isRTL } = useTranslation();

  if (!title && !headerCenter && !headerLeft && !headerRight) return null;

  return (
    <View
      className="flex-row justify-between items-center px-6 py-1"
      style={[style, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
    >
      {/* Title section - positioned based on language direction */}
      <View
        className="flex-1"
        style={{ alignItems: isRTL ? 'flex-start' : 'flex-start' }}
      >
        {headerLeft || (
          <View
            style={{
              alignItems: isRTL ? 'flex-start' : 'flex-start',
              width: '100%',
            }}
          >
            {title && (
              <Text
                className="text-foreground"
                style={{
                  fontFamily: 'CrimsonPro-Bold',
                  fontSize: 28, // Reduced from 34 to prevent wrapping
                  fontWeight: 'normal',
                  lineHeight: 34, // Reduced from 42 for better mobile spacing
                  textAlign: isRTL ? 'right' : 'left',
                  width: '100%',
                }}
              >
                {title}
              </Text>
            )}
            {subtitle && (
              <Text
                variant="caption1"
                className="text-muted-foreground mt-1"
                style={{
                  textAlign: isRTL ? 'right' : 'left',
                  width: '100%',
                }}
              >
                {subtitle}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Center section */}
      <View className="flex-2 items-center">{headerCenter}</View>

      {/* Right section (becomes left in RTL) */}
      <View className="flex-1 items-end">{headerRight}</View>
    </View>
  );
}

// Stats section wrapper (common across mood/exercises/profile screens)
// Note: No horizontal padding since ContentWrapper handles it
function StatsSection({ children }: { children: React.ReactNode }) {
  return <View>{children}</View>;
}

// Content wrapper based on variant
function ContentWrapper({
  children,
  variant,
  scrollable,
  refreshing,
  onRefresh,
  contentStyle,
  statsSection,
  scrollViewRef,
  onScroll,
}: {
  children: React.ReactNode;
  variant: 'default' | 'chat' | 'dashboard' | 'list';
  scrollable: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: ViewStyle;
  statsSection?: React.ReactNode;
  scrollViewRef?: React.RefObject<ScrollView>;
  onScroll?: (event: any) => void;
}) {
  const navigationBarPadding = useNavigationBarPadding();

  const refreshControl = useMemo(() => {
    if (!onRefresh) return undefined;
    return <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} />;
  }, [refreshing, onRefresh]);

  // Chat variant - no scrolling, full height, no padding (chat handles its own)
  if (variant === 'chat') {
    return (
      <View className="flex-1" style={contentStyle}>
        {children}
      </View>
    );
  }

  // List variant - add navigation bar padding
  if (variant === 'list') {
    const listContentStyle = [
      contentStyle,
      { paddingBottom: navigationBarPadding },
    ];

    if (scrollable) {
      return (
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          style={listContentStyle}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {/* Stats section at top of scrollable content */}
          {statsSection && <StatsSection>{statsSection}</StatsSection>}
          {children}
        </ScrollView>
      );
    }
    return (
      <View className="flex-1" style={listContentStyle}>
        {/* Stats section for non-scrollable list */}
        {statsSection && <StatsSection>{statsSection}</StatsSection>}
        {children}
      </View>
    );
  }

  // Dashboard/default variants - with padding and navigation bar clearance
  const paddingClass = variant === 'dashboard' ? 'px-2' : 'px-4';
  const dashboardContentStyle = [
    contentStyle,
    { paddingBottom: navigationBarPadding },
  ];

  if (scrollable) {
    return (
      <ScrollView
        ref={scrollViewRef}
        className={`flex-1 ${paddingClass}`}
        style={dashboardContentStyle}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {/* Stats section at top of scrollable content */}
        {statsSection && <StatsSection>{statsSection}</StatsSection>}
        {children}
      </ScrollView>
    );
  }

  return (
    <View className={`flex-1 ${paddingClass}`} style={dashboardContentStyle}>
      {/* Stats section for non-scrollable content */}
      {statsSection && <StatsSection>{statsSection}</StatsSection>}
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
  backgroundColor,
  contentStyle,
  headerStyle,
  safeAreaStyle,
  animated = false,
  scrollViewRef,
  onScroll,
}: ScreenLayoutProps) {
  const colors = useColors();
  const topPadding = useNavigationBarTopPadding();

  const content = (
    <SafeAreaView
      className="flex-1 bg-background"
      style={[{ paddingTop: topPadding }, backgroundColor ? { backgroundColor } : {}, safeAreaStyle]}
      edges={[]}
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

      {/* Main content with stats section inside */}
      <ContentWrapper
        variant={variant}
        scrollable={scrollable}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentStyle={contentStyle}
        statsSection={statsSection}
        scrollViewRef={scrollViewRef}
        onScroll={onScroll}
      >
        {children}
      </ContentWrapper>
    </SafeAreaView>
  );

  if (animated) {
    return (
      <Animated.View entering={FadeInDown} className="flex-1">
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
  },

  // Chat layout
  chat: {
    variant: 'chat' as const,
    scrollable: false,
    showHeader: false,
  },

  // Profile/settings layout
  profile: {
    variant: 'default' as const,
    scrollable: true,
  },

  // List layout (exercise details, etc.)
  list: {
    variant: 'list' as const,
    scrollable: false,
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
