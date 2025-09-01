import React, { useCallback, useEffect } from 'react';
import { View, Pressable, Platform, TextInput, Keyboard } from 'react-native';
import { MessageCircle, Heart, Activity, ArrowUp } from 'lucide-react-native';
import { SoundWaveIcon } from '~/components/ui/SoundWaveIcon';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useColors } from '~/hooks/useColors';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { withOpacity } from '~/lib/colors';
import { useTranslation } from '~/hooks/useTranslation';
import {
  useChatUIStore,
  ChatType,
  useVentChatVisible,
} from '~/store/useChatUIStore';
import { getChatStyles, getChatPlaceholder } from '~/lib/chatStyles';
import { useNetworkStatus } from '~/hooks/useOfflineData';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
} from 'react-native-reanimated';

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

interface FloatingTabBarProps extends BottomTabBarProps {
  onSendMessage?: (message: string) => void;
  onVoicePress?: () => void;
}

export function FloatingTabBar({
  state,
  navigation,
  onSendMessage,
  onVoicePress,
}: FloatingTabBarProps) {
  const colors = useColors();
  const { i18n } = useTranslation();
  const { isOnline } = useNetworkStatus();
  const activeChatType = useChatUIStore((state) => state.activeChatType);
  const isVentOpen = useVentChatVisible();
  const setCoachChatInput = useChatUIStore((s) => s.setCoachChatInput);
  const clearCoachChatInput = useChatUIStore((s) => s.clearCoachChatInput);
  const setCompanionChatInput = useChatUIStore((s) => s.setCompanionChatInput);
  const clearCompanionChatInput = useChatUIStore(
    (s) => s.clearCompanionChatInput
  );
  const setMainChatInput = useChatUIStore((s) => s.setMainChatInput);
  const clearMainChatInput = useChatUIStore((s) => s.clearMainChatInput);
  const setChatInputFocused = useChatUIStore((s) => s.setChatInputFocused);

  // Animation values
  const isChatExpanded = useSharedValue(0);
  const inputOpacity = useSharedValue(0);
  const iconTransition = useSharedValue(0);

  // State for input
  const [message, setMessage] = React.useState('');
  const sendingRef = React.useRef(false);
  const [isInputFocused, setIsInputFocused] = React.useState(false);
  const inputRef = React.useRef<TextInput>(null);

  // Check if we're on the chat tab
  const isChatTab = state.routes[state.index].name === 'chat';

  // Chat personality styles
  const chatStyles = getChatStyles(activeChatType as ChatType);
  const isArabic = i18n.language === 'ar';
  const defaultPlaceholder = getChatPlaceholder(
    activeChatType as ChatType,
    isArabic
  );
  const placeholder = !isOnline
    ? 'You need to be online to chat'
    : defaultPlaceholder;

  // Animate when switching to/from chat - using timing for smooth linear animation
  useEffect(() => {
    if (isChatTab) {
      isChatExpanded.value = withTiming(1, { duration: 200 });
      inputOpacity.value = withTiming(1, { duration: 150 });
    } else {
      isChatExpanded.value = withTiming(0, { duration: 200 });
      inputOpacity.value = withTiming(0, { duration: 100 });
      // Dismiss keyboard when leaving chat
      Keyboard.dismiss();
    }
  }, [isChatTab, isChatExpanded, inputOpacity]);

  const handleTabPress = useCallback(
    async (route: any, isFocused: boolean) => {
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

  const handleSend = useCallback(async () => {
    if (!message.trim() || !onSendMessage) return;
    if (sendingRef.current) return;
    sendingRef.current = true;

    const messageText = message.trim();
    setMessage('');
    // Clear shared draft for current personality so intro can reappear
    if (activeChatType === 'companion') {
      clearCompanionChatInput();
    } else {
      clearCoachChatInput();
      clearMainChatInput();
    }
    await impactAsync(ImpactFeedbackStyle.Medium);
    try {
      await Promise.resolve(onSendMessage(messageText));
    } finally {
      sendingRef.current = false;
    }
  }, [
    message,
    onSendMessage,
    activeChatType,
    clearCoachChatInput,
    clearCompanionChatInput,
    clearMainChatInput,
  ]);

  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(isChatExpanded.value, [0, 1], [72, 120]);
    return {
      height,
    };
  });

  const inputContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: inputOpacity.value,
      transform: [
        {
          translateY: interpolate(isChatExpanded.value, [0, 1], [20, 0]),
        },
      ],
    };
  });

  const isIOS = Platform.OS === 'ios';
  const hasText = !!message.trim();

  // Update icon transition when hasText changes
  useEffect(() => {
    iconTransition.value = withSpring(hasText ? 1 : 0, {
      damping: 15,
      stiffness: 300,
    });
  }, [hasText, iconTransition]);

  // Voice handler
  const handleVoicePress = useCallback(async () => {
    await impactAsync(ImpactFeedbackStyle.Medium);

    if (onVoicePress) {
      onVoicePress();
    } else {
      // Placeholder for voice recording functionality
      console.log('Voice recording would start here');
    }
  }, [onVoicePress]);

  // Animated styles for crossfade effect
  const micIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(iconTransition.value, [0, 1], [1, 0]),
    position: 'absolute',
  }));

  const sendIconStyle = useAnimatedStyle(() => ({
    opacity: interpolate(iconTransition.value, [0, 1], [0, 1]),
    position: 'absolute',
  }));

  // If private overlay is open, render nothing while keeping hooks order stable
  if (isVentOpen) {
    return <View />;
  }

  return (
    <View className="absolute bottom-0 left-0 right-0 px-4 pb-8">
      <Animated.View
        style={[
          containerAnimatedStyle,
          {
            backgroundColor: isIOS ? 'transparent' : colors.card + 'F0',
            borderRadius: 24,
            overflow: 'hidden',
          },
        ]}
        className="shadow-lg"
      >
        {isIOS ? (
          <BlurView
            intensity={80}
            tint={colors.background === '#0A1514' ? 'dark' : 'light'}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 24,
            }}
          />
        ) : null}

        <View
          style={{
            backgroundColor: isIOS
              ? withOpacity(colors.card, 0.65)
              : 'transparent',
            flex: 1,
            borderRadius: 24,
          }}
        >
          {/* Input Section - Only visible in chat */}
          {isChatTab && (
            <Animated.View
              style={[
                inputContainerStyle,
                { paddingHorizontal: 12, paddingTop: 8 },
              ]}
            >
              {/* Row layout with explicit spacing */}
              <View className="flex-row items-end gap-7 pr-3">
                {/* Text Input */}
                <View className="flex-1" style={{ maxWidth: '82%' }}>
                  <TextInput
                    ref={inputRef}
                    value={message}
                    onChangeText={(text) => {
                      setMessage(text);
                      if (activeChatType === 'companion') {
                        setCompanionChatInput(text);
                      } else {
                        setCoachChatInput(text);
                        setMainChatInput(text);
                      }
                    }}
                    onFocus={() => {
                      setIsInputFocused(true);
                      setChatInputFocused(true);
                    }}
                    onBlur={() => {
                      setIsInputFocused(false);
                      setChatInputFocused(false);
                    }}
                    placeholder={placeholder}
                    placeholderTextColor={withOpacity(colors.foreground, 0.45)}
                    className="text-foreground text-base px-3 py-2"
                    style={{
                      backgroundColor: colors.background + '30',
                      borderRadius: 16,
                      minHeight: 36,
                      textAlign: isArabic ? 'right' : 'left',
                      writingDirection: isArabic ? 'rtl' : 'ltr',
                      opacity: !isOnline ? 0.6 : 1,
                      ...Platform.select({
                        web: { outlineStyle: 'none' as any },
                        default: {},
                      }),
                    }}
                    multiline
                    maxLength={1000}
                    returnKeyType="send"
                    onSubmitEditing={handleSend}
                    editable={isOnline}
                  />
                </View>

                {/* Voice/Send button */}
                <View
                  className="rounded-full"
                  style={{
                    width: 40,
                    height: 40,
                    backgroundColor:
                      colors.background === '#0A1514'
                        ? 'rgba(255, 255, 255, 0.15)'
                        : 'rgba(255, 255, 255, 0.4)',
                    borderColor:
                      colors.background === '#0A1514'
                        ? 'rgba(255, 255, 255, 0.25)'
                        : 'rgba(255, 255, 255, 0.6)',
                    borderWidth: 0.5,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.15,
                    shadowRadius: 6,
                    elevation: 5,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 4,
                  }}
                >
                  <Pressable
                    onPress={hasText ? handleSend : handleVoicePress}
                    disabled={!isOnline}
                    style={({ pressed }) => ({
                      opacity: !isOnline ? 0.5 : pressed ? 0.9 : 1,
                      transform: [{ scale: pressed ? 0.95 : 1 }],
                      width: '100%',
                      height: '100%',
                      alignItems: 'center',
                      justifyContent: 'center',
                    })}
                  >
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Animated.View style={micIconStyle}>
                        <SoundWaveIcon
                          size={24}
                          color={chatStyles.primaryColor}
                          strokeWidth={2}
                        />
                      </Animated.View>
                      <Animated.View style={sendIconStyle}>
                        <ArrowUp
                          size={24}
                          color={chatStyles.primaryColor}
                          strokeWidth={2}
                        />
                      </Animated.View>
                    </View>
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Tab Icons - No scaling animation */}
          <View
            className="flex-row items-center justify-evenly"
            style={{ flex: 1 }}
          >
            {state.routes.map((route, index) => {
              const isFocused = state.index === index;
              const Icon = getIconForRoute(route.name);
              const isChat = route.name === 'chat';

              return (
                <Pressable
                  key={route.key}
                  onPress={() => handleTabPress(route, isFocused)}
                  className="flex-1 items-center justify-center"
                  style={({ pressed }) => ({
                    transform: [{ scale: pressed ? 0.85 : 1 }],
                  })}
                >
                  <View
                    className="items-center justify-center rounded-full p-2"
                    style={{
                      backgroundColor: isFocused
                        ? isChat && isChatTab
                          ? chatStyles.primaryColor + '20'
                          : colors.primary + '15'
                        : 'transparent',
                    }}
                  >
                    <Icon
                      size={22}
                      color={
                        isFocused
                          ? isChat && isChatTab
                            ? chatStyles.primaryColor
                            : colors.tabActive
                          : colors.tabInactive
                      }
                      fill="none"
                      strokeWidth={isFocused ? 2.5 : 2}
                    />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

// Standalone floating chat input used by the private overlay
// Reuses the same visuals and behavior as the tab bar's input section
export function FloatingChatInputStandalone({
  onSendMessage,
  chatType = 'coach',
  dark = true,
}: {
  onSendMessage: (message: string) => void | Promise<void>;
  chatType?: ChatType;
  dark?: boolean; // render dark container suitable for black overlay
}) {
  const colors = useColors();
  const { i18n } = useTranslation();
  const inputRef = React.useRef<TextInput>(null);
  const [message, setMessage] = React.useState('');
  const sendingRef = React.useRef(false);
  const [isInputFocused, setIsInputFocused] = React.useState(false);
  const isIOS = Platform.OS === 'ios';
  const hasText = !!message.trim();

  // Use event styling for accent in private mode
  const chatStyles = getChatStyles(chatType);
  const isArabic = i18n.language === 'ar';
  const placeholder = getChatPlaceholder(chatType, isArabic);

  // Private vent input uses a dedicated style (no mic crossfade)

  const handleSend = useCallback(async () => {
    if (!message.trim()) return;
    if (sendingRef.current) return;
    sendingRef.current = true;
    const text = message.trim();
    setMessage('');
    await impactAsync(ImpactFeedbackStyle.Medium);
    try {
      await Promise.resolve(onSendMessage(text));
    } finally {
      sendingRef.current = false;
    }
  }, [message, onSendMessage]);

  // Layout box keeps input position; visual card is trimmed inside
  const CONTAINER_HEIGHT = 92; // outer box height (increased to push down)
  const CARD_HEIGHT = 72; // inner card visual height

  return (
    <View
      className="absolute left-0 right-0 px-4"
      style={{ bottom: -10, paddingBottom: 64 }}
    >
      <View style={{ height: CONTAINER_HEIGHT }}>
        <View
          className="rounded-3xl overflow-hidden shadow-lg"
          style={{
            backgroundColor: dark
              ? 'rgba(20,20,20,0.95)'
              : isIOS
                ? 'transparent'
                : colors.card + 'F0',
            height: CARD_HEIGHT,
          }}
        >
          {isIOS && !dark ? (
            <BlurView
              intensity={80}
              tint={colors.background === '#0A1514' ? 'dark' : 'light'}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
          ) : null}

          <View
            style={{
              backgroundColor: dark
                ? 'transparent'
                : isIOS
                  ? withOpacity(colors.card, 0.65)
                  : 'transparent',
              borderRadius: 24,
              height: '100%',
              paddingHorizontal: 12,
              paddingBottom: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View className="flex-row items-center gap-2 pr-3">
              {/* Text Input */}
              <View className="flex-1">
                <TextInput
                  ref={inputRef}
                  value={message}
                  onChangeText={setMessage}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  placeholder={placeholder}
                  placeholderTextColor={
                    dark
                      ? 'rgba(255,255,255,0.55)'
                      : withOpacity(colors.foreground, 0.45)
                  }
                  className={
                    dark
                      ? 'text-white text-base px-3 py-2'
                      : 'text-foreground text-base px-3 py-2'
                  }
                  style={{
                    backgroundColor: 'transparent',
                    borderRadius: 0,
                    minHeight: 36,
                    borderWidth: 0,
                    borderColor: 'transparent',
                    textAlign: isArabic ? 'right' : 'left',
                    writingDirection: isArabic ? 'rtl' : 'ltr',
                    ...Platform.select({
                      web: {
                        outlineStyle: 'none' as any,
                        outline: 'none',
                      },
                      default: {},
                    }),
                  }}
                  multiline
                  maxLength={1000}
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                />
              </View>

              {/* Send button with glass morphic circle */}
              <View
                className="rounded-full"
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: dark
                    ? 'rgba(255, 255, 255, 0.15)'
                    : 'rgba(255, 255, 255, 0.4)',
                  borderColor: dark
                    ? 'rgba(255, 255, 255, 0.25)'
                    : 'rgba(255, 255, 255, 0.6)',
                  borderWidth: 0.5,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.15,
                  shadowRadius: 6,
                  elevation: 5,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Pressable
                  onPress={handleSend}
                  disabled={!hasText}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                    width: '100%',
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                  })}
                >
                  <ArrowUp
                    size={24}
                    color={hasText ? '#FFFFFF' : 'rgba(255,255,255,0.75)'}
                    strokeWidth={2}
                  />
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
