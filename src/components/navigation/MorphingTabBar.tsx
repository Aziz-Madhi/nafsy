import React, { useCallback, useEffect } from 'react';
import { View, Pressable, Dimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { SymbolView } from 'expo-symbols';
import { MessageCircle, Heart, Activity, User } from 'lucide-react-native';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ChatInput } from '~/components/chat';
import { MotiView } from 'moti';
import { useChatUIStore, useHistorySidebarVisible, useAppStore } from '~/store';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useUserSafe } from '~/lib/useUserSafe';
import { useNavigationColors, useColors } from '~/hooks/useColors';

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
  const navColors = useNavigationColors();

  const getIcon = (routeName: string, focused: boolean) => {
    const iconColor = focused ? navColors.active : navColors.inactive;
    const strokeWidth = focused ? 2.5 : 2;
    const size = 26;

    switch (routeName) {
      case 'chat':
        return (
          <MessageCircle
            size={size}
            color={iconColor}
            fill="none"
            strokeWidth={strokeWidth}
          />
        );
      case 'mood':
        return (
          <Heart
            size={size}
            color={iconColor}
            fill="none"
            strokeWidth={strokeWidth}
          />
        );
      case 'exercises':
        return (
          <Activity
            size={size}
            color={iconColor}
            fill="none"
            strokeWidth={strokeWidth}
          />
        );
      case 'profile':
        return (
          <User
            size={size}
            color={iconColor}
            fill="none"
            strokeWidth={strokeWidth}
          />
        );
      default:
        return (
          <MessageCircle
            size={size}
            color={iconColor}
            fill="none"
            strokeWidth={strokeWidth}
          />
        );
    }
  };

  const handlePress = () => {
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
      <View className="bg-transparent rounded-2xl px-4 py-2">
        {getIcon(route, isFocused)}
      </View>
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

  // Input text state
  const [inputText, setInputText] = React.useState('');

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
      // Subtle morph to unified container with large input
      containerHeight.value = withTiming(140, { duration: 200 });
      borderRadius.value = withTiming(35, { duration: 200 }); // Keep rounded top corners
      inputOpacity.value = withTiming(1, { duration: 150 });
      inputTranslateY.value = withTiming(0, { duration: 200 });
      tabsTranslateY.value = withTiming(0, { duration: 200 });
      backgroundColor.value = withTiming(1, { duration: 200 });
      tabsBottomPosition.value = withTiming(10, { duration: 200 });
      tabsHeight.value = withTiming(60, { duration: 200 });
    } else {
      // Subtle morph to separate floating pill components
      containerHeight.value = withTiming(90, { duration: 200 });
      borderRadius.value = withTiming(25, { duration: 200 }); // Keep rounded top corners
      inputOpacity.value = withTiming(0, { duration: 100 });
      inputTranslateY.value = withTiming(30, { duration: 200 });
      tabsTranslateY.value = withTiming(0, { duration: 200 });
      backgroundColor.value = withTiming(1, { duration: 200 });
      tabsBottomPosition.value = withTiming(0, { duration: 200 });
      tabsHeight.value = withTiming(90, { duration: 200 });
    }
  }, [isChat]);

  // Clean slate - no sidebar animations yet

  const colors = useColors();

  const containerStyle = useAnimatedStyle(() => ({
    height: containerHeight.value,
    backgroundColor:
      backgroundColor.value > 0 ? colors.cardElevated : 'transparent',
    borderRadius: borderRadius.value,
    shadowOpacity: backgroundColor.value * 0.1,
    transform: [{ translateX: tabTranslateX.value }],
    opacity: tabBarOpacity.value,
  }));

  const inputContainerStyle = useAnimatedStyle(() => ({
    opacity: inputOpacity.value,
    transform: [{ translateY: inputTranslateY.value }],
    position: 'absolute',
    top: 25,
    left: 0,
    right: 0,
    height: 65,
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
      setInputText(''); // Clear the external input state

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

  // Track input changes from ChatInput
  const handleInputChange = useCallback((text: string) => {
    setInputText(text);
  }, []);

  return (
    <Animated.View
      style={[
        containerStyle,
        {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          shadowColor: colors.shadow,
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
        <Animated.View style={[inputContainerStyle, { paddingHorizontal: 16 }]}>
          {/* Chat Input with integrated button */}
          <ChatInput
            onSendMessage={handleSendMessage}
            placeholder="Type a message..."
            hideBorder={true}
            hideButton={false}
            value={inputText}
            onChangeText={handleInputChange}
          />
        </Animated.View>
      )}

      {/* Tab Icons */}
      <Animated.View style={tabsContainerStyle}>
        <View
          className="flex-row items-center justify-around"
          style={{ height: '100%', paddingHorizontal: 16 }}
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
