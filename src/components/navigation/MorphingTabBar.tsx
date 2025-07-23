import React, { useCallback, useEffect } from 'react';
import { View, Pressable, Dimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { SymbolView } from 'expo-symbols';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { ChatInput } from '~/components/chat';
import { useChatUIStore, useHistorySidebarVisible, useAppStore } from '~/store';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useUserSafe } from '~/lib/useUserSafe';
import { SPRING_PRESETS, TIMING_PRESETS } from '~/lib/animations';

interface TabIconProps {
  route: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  index: number;
}

const TabIcon = ({
  route,
  isFocused,
  onPress,
  onLongPress,
  index,
}: TabIconProps) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const backgroundColor = useSharedValue(isFocused ? 1 : 0);

  const getIcon = (routeName: string, focused: boolean) => {
    switch (routeName) {
      case 'chat':
        return focused ? 'bubble.left.fill' : 'bubble.left';
      case 'mood':
        return focused ? 'heart.fill' : 'heart';
      case 'exercises':
        return focused ? 'leaf.fill' : 'leaf';
      case 'profile':
        return focused ? 'person.fill' : 'person';
      default:
        return 'circle';
    }
  };

  // Animate background color changes
  useEffect(() => {
    backgroundColor.value = withSpring(
      isFocused ? 1 : 0,
      SPRING_PRESETS.gentle
    );
  }, [isFocused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.85, SPRING_PRESETS.snappy),
      withSpring(1, SPRING_PRESETS.bouncy)
    );

    if (!isFocused) {
      rotation.value = withSequence(
        withTiming(10, TIMING_PRESETS.fast),
        withTiming(-10, TIMING_PRESETS.fast),
        withSpring(0, SPRING_PRESETS.quick)
      );
    }

    impactAsync(ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      className="items-center justify-center px-4"
      style={{ minHeight: 60 }}
    >
      <Animated.View style={animatedStyle}>
        <Animated.View style={pillStyle}>
          <SymbolView
            name={getIcon(route, isFocused)}
            size={26}
            tintColor={isFocused ? '#2D7D6E' : '#9CA3AF'}
            weight="medium"
          />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

export function MorphingTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const currentRoute = state.routes[state.index].name;
  const isChat = currentRoute === 'chat';

  // Track active tab in Zustand store
  const setActiveTab = useAppStore((state) => state.setActiveTab);

  // Update store when tab changes
  useEffect(() => {
    setActiveTab(currentRoute);
  }, [currentRoute, setActiveTab]);

  // Animation values
  const containerHeight = useSharedValue(90);
  const borderRadius = useSharedValue(0);
  const inputOpacity = useSharedValue(0);
  const inputTranslateY = useSharedValue(20);
  const tabsTranslateY = useSharedValue(0);
  const backgroundColor = useSharedValue(0);
  const tabsBottomPosition = useSharedValue(0);
  const tabsHeight = useSharedValue(90);

  // Simple tab bar sliding animation
  const tabTranslateX = useSharedValue(0);
  // Dim effect when sidebar is open
  const tabBarOpacity = useSharedValue(1);
  const showHistorySidebar = useHistorySidebarVisible();
  // Compute sidebar width (must match ChatHistorySidebar)
  const SIDEBAR_WIDTH = Dimensions.get('window').width * 0.85;

  // Trigger animation when sidebar state changes
  useEffect(() => {
    if (showHistorySidebar) {
      // Slide tab bar right by sidebar width
      tabTranslateX.value = withTiming(SIDEBAR_WIDTH, { duration: 300 });
      // Fully fade out to avoid brightness
      tabBarOpacity.value = withTiming(0, { duration: 300 });
    } else {
      // Slide tab bar back to original position
      tabTranslateX.value = withTiming(0, { duration: 300 });
      tabBarOpacity.value = withTiming(1, { duration: 300 });
    }
  }, [showHistorySidebar, tabTranslateX, tabBarOpacity, SIDEBAR_WIDTH]);

  // Chat functionality
  const { user, isLoaded } = useUserSafe();
  const sendMainMessage = useMutation(api.mainChat.sendMainMessage);
  const { setMainChatTyping } = useChatUIStore();
  const currentMainSessionId = useQuery(
    api.mainChat.getCurrentMainSessionId,
    user ? {} : 'skip'
  );

  useEffect(() => {
    if (isChat) {
      // Morph to unified container with large input
      containerHeight.value = withSpring(180, { damping: 15, stiffness: 150 });
      borderRadius.value = withSpring(35, { damping: 15, stiffness: 150 });
      inputOpacity.value = withSpring(1, { damping: 15, stiffness: 150 });
      inputTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      tabsTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      backgroundColor.value = withSpring(1, { damping: 15, stiffness: 150 });
      tabsBottomPosition.value = withSpring(10, {
        damping: 15,
        stiffness: 150,
      });
      tabsHeight.value = withSpring(70, { damping: 15, stiffness: 150 });
    } else {
      // Separate floating pill components
      containerHeight.value = withSpring(90, { damping: 15, stiffness: 150 });
      borderRadius.value = withSpring(25, { damping: 15, stiffness: 150 });
      inputOpacity.value = withTiming(0, { duration: 200 });
      inputTranslateY.value = withSpring(30, { damping: 15, stiffness: 150 });
      tabsTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      backgroundColor.value = withSpring(1, { damping: 15, stiffness: 150 });
      tabsBottomPosition.value = withSpring(0, { damping: 15, stiffness: 150 });
      tabsHeight.value = withSpring(90, { damping: 15, stiffness: 150 });
    }
  }, [isChat]);

  // Clean slate - no sidebar animations yet

  const containerStyle = useAnimatedStyle(() => ({
    height: containerHeight.value,
    backgroundColor:
      backgroundColor.value > 0 ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
    borderRadius: borderRadius.value,
    shadowOpacity: backgroundColor.value * 0.1,
    transform: [{ translateX: tabTranslateX.value }],
    opacity: tabBarOpacity.value,
  }));

  const inputContainerStyle = useAnimatedStyle(() => ({
    opacity: inputOpacity.value,
    transform: [{ translateY: inputTranslateY.value }],
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    height: 90,
    zIndex: 1,
  }));

  const tabsContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: tabsTranslateY.value }],
    position: 'absolute',
    bottom: tabsBottomPosition.value,
    left: 0,
    right: 0,
    height: tabsHeight.value,
    zIndex: 2,
    justifyContent: 'center',
  }));

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!user || !isLoaded) return;

      await sendMainMessage({
        content: text,
        role: 'user',
        sessionId: currentMainSessionId || undefined,
      });

      setMainChatTyping(true);

      // Simulate AI response
      setTimeout(async () => {
        setMainChatTyping(false);
        await sendMainMessage({
          content: "I'm here to listen and support you. How can I help?",
          role: 'assistant',
          sessionId: currentMainSessionId || undefined,
        });
      }, 2000);
    },
    [user, isLoaded, sendMainMessage, setMainChatTyping, currentMainSessionId]
  );

  return (
    <Animated.View
      style={[
        containerStyle,
        {
          position: 'absolute',
          bottom: 25,
          left: 16,
          right: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowRadius: 10,
          // Maintain consistent shadow; dimming handled via opacity
          shadowOpacity: 0.1,
          elevation: showHistorySidebar ? 5 : 10, // Lower elevation when sidebar is open (Android)
          zIndex: showHistorySidebar ? 5 : 10,
        },
      ]}
    >
      {/* Chat Input - Only visible in chat tab */}
      {isChat && (
        <Animated.View style={inputContainerStyle}>
          <ChatInput
            onSendMessage={handleSendMessage}
            placeholder="Type a message..."
            hideBorder={true}
          />
        </Animated.View>
      )}

      {/* Tab Icons */}
      <Animated.View style={tabsContainerStyle}>
        <View
          className="flex-row items-center justify-around"
          style={{ height: '100%' }}
        >
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };
            return (
              <TabIcon
                key={route.key}
                route={route.name}
                isFocused={isFocused}
                onPress={onPress}
                onLongPress={() => {}}
                index={index}
              />
            );
          })}
        </View>
      </Animated.View>
    </Animated.View>
  );
}
