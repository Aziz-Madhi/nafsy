import React, { useCallback, useEffect } from 'react';
import {
  View,
  Pressable,
  Platform,
  TextInput,
  Keyboard,
  Dimensions,
} from 'react-native';
import { MessageCircle, Heart, Activity, ArrowUp } from 'lucide-react-native';
import { SoundWaveIcon } from '~/components/ui/SoundWaveIcon';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { safeHaptics } from '~/lib/haptics';
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
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function normalizeRouteName(routeName: string) {
  // Expo Router 6 exposes group-qualified names (e.g. '/(app)/tabs/chat').
  // Reduce them to the leaf screen so icon mapping and state checks stay stable.
  if (!routeName) return routeName;
  const segments = routeName.split('/').filter(Boolean);
  if (segments.length === 0) return routeName;
  const last = segments[segments.length - 1];
  if (last === 'index' && segments.length > 1) {
    return segments[segments.length - 2];
  }
  return last;
}

const getIconForRoute = (routeName: string) => {
  const key = normalizeRouteName(routeName);
  switch (key) {
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

// Unified visual constants so all screens share the same tab bar sizing
const TABBAR_RADIUS = 24;
const TABBAR_PADDING_VERTICAL = 12;
const TABBAR_GAP = 12;
// Fixed overlay heights
const BAR_HEIGHT_CHAT_REST = 120; // chat with composer visible
const BAR_HEIGHT_CHAT_COMPACT = 96; // chat when keyboard visible (compact composer)
const BAR_HEIGHT_SIMPLE = 72; // non-chat tabs (no composer space)
const COMPOSER_HEIGHT_REST = 52;
const COMPOSER_HEIGHT_COMPACT = 46;
const ICON_BUTTON_SIZE = 40;
const ICON_BUTTON_SIZE_COMPACT = 34;
const ICON_SIZE = 24;
const ICON_SIZE_COMPACT = 20;

function useKeyboardOffset(): number {
  const [offset, setOffset] = React.useState(0);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const changeEvent =
      Platform.OS === 'ios'
        ? 'keyboardWillChangeFrame'
        : 'keyboardDidChangeFrame';

    const calcHeight = (event: {
      endCoordinates?: { height?: number; screenY?: number };
    }) => {
      const end = event?.endCoordinates as
        | { height?: number; screenY?: number }
        | undefined;
      let height = end?.height ?? 0;
      if (!height && typeof end?.screenY === 'number') {
        const windowH = Dimensions.get('window').height;
        height = Math.max(0, windowH - (end?.screenY ?? windowH));
      }
      setOffset(height);
    };

    const handleHide = () => setOffset(0);

    const showSub = Keyboard.addListener(showEvent, calcHeight);
    const hideSub = Keyboard.addListener(hideEvent, handleHide);
    const changeSub = Keyboard.addListener(changeEvent, calcHeight);

    return () => {
      showSub.remove();
      hideSub.remove();
      changeSub.remove();
    };
  }, []);

  return offset;
}

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
  // Avoid early returns before hooks; treat props as present (as per Expo Tabs contract)

  const colors = useColors();
  const { i18n } = useTranslation();
  const { isOnline } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const keyboardOffset = useKeyboardOffset();
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

  // Animation value for icon crossfade only
  const iconTransition = useSharedValue(0);

  // State for input
  const [message, setMessage] = React.useState('');
  const sendingRef = React.useRef(false);
  const inputRef = React.useRef<TextInput>(null);

  // Check if we're on the chat tab
  const activeRouteName = normalizeRouteName(state.routes[state.index]?.name);
  const isChatTab = activeRouteName === 'chat';

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

  // Dismiss keyboard when leaving chat to avoid odd offsets
  useEffect(() => {
    if (!isChatTab) Keyboard.dismiss();
  }, [isChatTab]);

  const handleTabPress = useCallback(
    async (route: any, isFocused: boolean) => {
      await safeHaptics.impact(ImpactFeedbackStyle.Light);

      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name as never);
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
    await safeHaptics.impact(ImpactFeedbackStyle.Medium);
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

  const keyboardVisible = keyboardOffset > 0;
  const baseBottomSpacing = Math.max(insets.bottom, 8);
  const bottomOffset = keyboardVisible
    ? Math.max(0, keyboardOffset - insets.bottom - 2)
    : baseBottomSpacing;
  // Stretch edge-to-edge when keyboard is visible for a more immersive input
  const horizontalPadding = keyboardVisible ? 0 : 16;
  const buttonSize = keyboardVisible
    ? ICON_BUTTON_SIZE_COMPACT
    : ICON_BUTTON_SIZE;
  const innerIconSize = keyboardVisible ? ICON_SIZE_COMPACT : ICON_SIZE;
  const barHeight = isChatTab
    ? keyboardVisible
      ? BAR_HEIGHT_CHAT_COMPACT
      : BAR_HEIGHT_CHAT_REST
    : BAR_HEIGHT_SIMPLE;
  const composerRowHeight = isChatTab
    ? keyboardVisible
      ? COMPOSER_HEIGHT_COMPACT
      : COMPOSER_HEIGHT_REST
    : 0;
  const containerJustify = isChatTab ? 'space-between' : 'center';
  const iconsVerticalNudge = isChatTab ? -8 : -3; // move icons up slightly; more on chat

  const composer = (
    <View
      style={{
        height: composerRowHeight,
        flexDirection: 'row',
        alignItems: 'center',
        gap: keyboardVisible ? 8 : 14,
        paddingHorizontal: keyboardVisible ? 16 : 20,
      }}
    >
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
        onFocus={() => setChatInputFocused(true)}
        onBlur={() => setChatInputFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={withOpacity(colors.foreground, 0.45)}
        className="text-foreground text-base"
        style={{
          flex: 1,
          backgroundColor: colors.background + '30',
          borderRadius: keyboardVisible ? 12 : 16,
          paddingHorizontal: 12,
          paddingVertical: keyboardVisible ? 6 : 10,
          minHeight: keyboardVisible ? 22 : 36,
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

      <Pressable
        onPress={hasText ? handleSend : handleVoicePress}
        disabled={!isOnline}
        style={({ pressed }) => ({
          opacity: !isOnline ? 0.5 : pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        })}
      >
        <View
          className="rounded-full"
          style={{
            width: buttonSize,
            height: buttonSize,
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
            shadowOffset: { width: 0, height: keyboardVisible ? 0 : 3 },
            shadowOpacity: keyboardVisible ? 0.05 : 0.15,
            shadowRadius: keyboardVisible ? 2 : 6,
            elevation: 5,
            alignItems: 'center',
            justifyContent: 'center',
            // Slight visual nudge to keep icons optically centered without clipping
            transform: [{ translateY: -1 }],
          }}
        >
          <View
            style={{
              width: innerIconSize,
              height: innerIconSize,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Animated.View style={micIconStyle}>
              <SoundWaveIcon
                size={innerIconSize}
                color={chatStyles.primaryColor}
                strokeWidth={2}
              />
            </Animated.View>
            <Animated.View style={sendIconStyle}>
              <ArrowUp
                size={innerIconSize}
                color={chatStyles.primaryColor}
                strokeWidth={2}
              />
            </Animated.View>
          </View>
        </View>
      </Pressable>
    </View>
  );

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: horizontalPadding,
        right: horizontalPadding,
        bottom: bottomOffset,
      }}
    >
      <Animated.View
        style={{
          backgroundColor: isIOS ? 'transparent' : colors.card + 'F0',
          borderRadius: TABBAR_RADIUS,
          overflow: 'hidden',
          height: barHeight,
        }}
        className={keyboardVisible ? undefined : 'shadow-lg'}
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
              borderRadius: TABBAR_RADIUS,
            }}
          />
        ) : null}

        <View
          style={{
            backgroundColor: isIOS
              ? withOpacity(colors.card, 0.65)
              : 'transparent',
            borderRadius: TABBAR_RADIUS,
            paddingVertical: keyboardVisible ? 4 : TABBAR_PADDING_VERTICAL,
            gap: keyboardVisible ? 6 : TABBAR_GAP,
            height: '100%',
            justifyContent: containerJustify,
          }}
        >
          {/* Composer row only when on chat; no extra space otherwise */}
          <View style={{ height: composerRowHeight }}>
            {isChatTab ? composer : null}
          </View>

          {!keyboardVisible && (
            <View
              className="flex-row items-center justify-evenly"
              style={{
                paddingBottom: isChatTab ? 0 : 2,
                transform: [{ translateY: iconsVerticalNudge }],
              }}
            >
              {state.routes.map((route, index) => {
                const isFocused = state.index === index;
                const routeKey = normalizeRouteName(route.name);
                const Icon = getIconForRoute(route.name);
                const isChat = routeKey === 'chat';

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
                        // Keep visual alignment identical across all screens
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
          )}
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
  const insets = useSafeAreaInsets();
  const keyboardOffset = useKeyboardOffset();
  const inputRef = React.useRef<TextInput>(null);
  const [message, setMessage] = React.useState('');
  const sendingRef = React.useRef(false);
  // Local focus state not required; alignment controlled via padding
  const isIOS = Platform.OS === 'ios';
  const hasText = !!message.trim();

  // Use event styling for accent in private mode (colors from theme only here)
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

  const basePaddingBottom = 24;
  const keyboardVisible = keyboardOffset > 0;
  const restingBottom = basePaddingBottom + Math.max(insets.bottom, 16);
  // In overlay (dark=true), we wrap content in a KeyboardAvoidingView, so when
  // the keyboard is visible we only need a small safe-area offset.
  const bottomOffset = keyboardVisible
    ? dark
      ? 0
      : Math.max(12, keyboardOffset - insets.bottom + 4)
    : restingBottom;
  // Keep the same horizontal padding regardless of keyboard to maintain one design
  const horizontalPadding = 16;
  // no compact height when keeping consistent design

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: horizontalPadding,
        right: horizontalPadding,
        bottom: bottomOffset,
      }}
    >
      <View style={{ height: CONTAINER_HEIGHT }}>
        <View
          className={
            keyboardVisible ? 'overflow-hidden' : 'overflow-hidden shadow-lg'
          }
          style={{
            borderRadius: 24,
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
            <View
              className="flex-row items-center gap-2"
              style={{ paddingRight: 12 }}
            >
              {/* Text Input */}
              <View className="flex-1">
                <TextInput
                  ref={inputRef}
                  value={message}
                  onChangeText={setMessage}
                  onFocus={() => {}}
                  onBlur={() => {}}
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
                  transform: [{ translateY: -1 }],
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
