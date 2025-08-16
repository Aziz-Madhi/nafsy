import React, { useMemo, useCallback, memo } from 'react';
import {
  View,
  ScrollView,
  ViewStyle,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from './text';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSegments, router } from 'expo-router';
import { useScreenPadding } from '~/hooks/useScreenPadding';
import { User } from 'lucide-react-native';
import { useColors } from '~/hooks/useColors';
import { useIsRTL } from '~/store/useAppStore';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';

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
  showSettingsIcon?: boolean;

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

// Settings Icon Component
function SettingsIcon() {
  const colors = useColors();

  const handlePress = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    router.push('/settings');
  }, []);

  return (
    <Pressable
      onPress={handlePress}
      className="w-10 h-10 items-center justify-center rounded-full bg-black/[0.05] dark:bg-white/[0.05]"
    >
      <User size={20} color={colors.foreground} />
    </Pressable>
  );
}

// Header component
function ScreenHeader({
  title,
  subtitle,
  headerLeft,
  headerRight,
  headerCenter,
  style,
  showSettingsIcon = true,
}: {
  title?: string;
  subtitle?: string;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
  headerCenter?: React.ReactNode;
  style?: ViewStyle;
  showSettingsIcon?: boolean;
}) {
  const isRTL = useIsRTL();

  if (!title && !headerCenter && !headerLeft && !headerRight) return null;

  return (
    <View
      className="flex-row justify-between items-center px-6 py-1"
      style={style}
    >
      {/* Title section */}
      <View className="flex-1">
        {headerLeft || (
          <View style={{ width: '100%' }}>
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

      {/* Right section */}
      <View className="flex-1 items-end">
        {headerRight || (showSettingsIcon && <SettingsIcon />)}
      </View>
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
  // Use physical horizontal padding to avoid RTL mirroring issues
  const screenPadding = useScreenPadding('list');
  const baseHorizontalPadding = screenPadding.horizontal; // 8px by default

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
  // IMPORTANT: Use explicit paddingHorizontal so RTL does not skew spacing
  const computedHorizontalPadding =
    variant === 'dashboard' ? baseHorizontalPadding : baseHorizontalPadding * 2;

  // Put bottom space and horizontal padding into contentContainerStyle so it
  // affects inner content equally in RTL and LTR. Allow screen `contentStyle`
  // to override if it specifies its own padding.
  const scrollViewContentContainerStyle = [
    { paddingBottom: navigationBarPadding },
    { paddingHorizontal: computedHorizontalPadding },
    contentStyle,
  ];

  if (scrollable) {
    return (
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerStyle={scrollViewContentContainerStyle}
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
    <View
      className="flex-1"
      style={{ paddingHorizontal: computedHorizontalPadding }}
    >
      {/* Stats section for non-scrollable content */}
      {statsSection && <StatsSection>{statsSection}</StatsSection>}
      {children}
    </View>
  );
}

function ScreenLayoutComponent({
  title,
  subtitle,
  headerLeft,
  headerRight,
  headerCenter,
  showHeader = true,
  showSettingsIcon = true,
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
  // Note: reserved for RN-only styles if needed
  // const colors = useColors();
  const topPadding = useNavigationBarTopPadding();

  const content = (
    <SafeAreaView
      className="flex-1 bg-background"
      style={[{ paddingTop: topPadding }, safeAreaStyle]}
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
          showSettingsIcon={showSettingsIcon}
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

export const ScreenLayout = memo(ScreenLayoutComponent);

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
export const DashboardLayout = memo(function DashboardLayout(
  props: Omit<ScreenLayoutProps, 'variant'>
) {
  return <ScreenLayout {...props} {...ScreenPresets.dashboard} />;
});

export const ChatLayout = memo(function ChatLayout(
  props: Omit<ScreenLayoutProps, 'variant' | 'showHeader' | 'scrollable'>
) {
  return <ScreenLayout {...props} {...ScreenPresets.chat} />;
});

export const ProfileLayout = memo(function ProfileLayout(
  props: Omit<ScreenLayoutProps, 'variant'>
) {
  return <ScreenLayout {...props} {...ScreenPresets.profile} />;
});

export const ListLayout = memo(function ListLayout(
  props: Omit<ScreenLayoutProps, 'variant' | 'scrollable'>
) {
  return <ScreenLayout {...props} {...ScreenPresets.list} />;
});
