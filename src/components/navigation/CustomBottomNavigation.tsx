import React, { useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { MessageCircle, Heart, Activity } from 'lucide-react-native';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { getNavigationIconClass } from '~/lib/color-helpers';

interface TabItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  label: string;
}

const tabs: TabItem[] = [
  {
    name: 'chat',
    href: '/tabs/chat',
    icon: MessageCircle,
    label: 'Chat',
  },
  {
    name: 'mood',
    href: '/tabs/mood',
    icon: Heart,
    label: 'Mood',
  },
  {
    name: 'exercises',
    href: '/tabs/exercises',
    icon: Activity,
    label: 'Exercises',
  },
];

export function CustomBottomNavigation() {
  const router = useRouter();
  const segments = useSegments();

  // Get current active tab from route segments
  const activeTab = segments[1] || 'chat'; // Default to chat if no segment

  // Animation values
  const tabScale = useSharedValue(1);

  const handleTabPress = useCallback(
    async (href: string, tabName: string) => {
      // Quick scale animation for feedback
      tabScale.value = withSpring(0.95, { duration: 100 }, () => {
        tabScale.value = withSpring(1, { duration: 150 });
      });

      // Add haptic feedback
      await impactAsync(ImpactFeedbackStyle.Light);

      // Navigate to tab if not already active
      if (activeTab !== tabName) {
        router.push(href);
      }
    },
    [router, activeTab, tabScale]
  );

  // Animated style for tab scale
  const tabScaleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: tabScale.value }],
    };
  });

  return (
    <View className="absolute bottom-0 left-0 right-0 h-20 bg-card-elevated">
      {/* Tab buttons */}
      <View className="flex-row items-center justify-evenly h-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.name;

          return (
            <Pressable
              key={tab.name}
              onPress={() => handleTabPress(tab.href, tab.name)}
              className="flex-1 items-center justify-center py-4"
              android_ripple={{
                color: 'rgba(0, 0, 0, 0.1)',
                borderless: true,
                radius: 32,
              }}
            >
              <Animated.View
                style={isActive ? tabScaleStyle : undefined}
                className="items-center justify-center"
              >
                <Icon
                  size={24}
                  className={getNavigationIconClass(isActive)}
                  fill={isActive ? 'currentColor' : 'none'}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
