import React, { useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { MessageCircle, Heart, Activity } from 'lucide-react-native';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useColors } from '~/hooks/useColors';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const getIconForRoute = (routeName: string) => {
  switch (routeName) {
    case 'chat':
      return MessageCircle;
    case 'mood':
      return Heart;
    case 'exercises':
      return Activity;
    default:
      return MessageCircle;
  }
};

export function CustomBottomNavigation({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const colors = useColors();

  const handleTabPress = useCallback(
    async (route: any, isFocused: boolean) => {
      // Add haptic feedback
      await impactAsync(ImpactFeedbackStyle.Light);

      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    },
    [navigation]
  );

  return (
    <View
      className="absolute bottom-0 left-0 right-0 h-20 rounded-t-2xl"
      style={{ backgroundColor: colors.card }}
    >
      {/* Tab buttons */}
      <View className="flex-row items-center justify-evenly h-full">
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const Icon = getIconForRoute(route.name);

          return (
            <Pressable
              key={route.key}
              onPress={() => handleTabPress(route, isFocused)}
              className="flex-1 items-center justify-center py-4"
              android_ripple={{
                color: 'rgba(0, 0, 0, 0.1)',
                borderless: true,
                radius: 32,
              }}
            >
              <View className="items-center justify-center">
                <Icon
                  size={24}
                  color={isFocused ? colors.tabActive : colors.tabInactive}
                  fill="none"
                  strokeWidth={isFocused ? 2.5 : 2}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
