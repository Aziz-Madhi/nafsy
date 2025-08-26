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
import { useChatUIStore, ChatType } from '~/store/useChatUIStore';
import { getChatStyles, getChatPlaceholder } from '~/lib/chatStyles';
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
  const activeChatType = useChatUIStore((state) => state.activeChatType);

  // Animation values
  const isChatExpanded = useSharedValue(0);
  const inputOpacity = useSharedValue(0);
  const iconTransition = useSharedValue(0);

  // State for input
  const [message, setMessage] = React.useState('');
  const [isInputFocused, setIsInputFocused] = React.useState(false);
  const inputRef = React.useRef<TextInput>(null);

  // Check if we're on the chat tab
  const isChatTab = state.routes[state.index].name === 'chat';

  // Chat personality styles
  const chatStyles = getChatStyles(activeChatType as ChatType);
  const placeholder = getChatPlaceholder(
    activeChatType as ChatType,
    i18n.language === 'ar'
  );

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
    if (message.trim() && onSendMessage) {
      const messageText = message.trim();
      setMessage('');
      await impactAsync(ImpactFeedbackStyle.Medium);
      onSendMessage(messageText);
    }
  }, [message, onSendMessage]);

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
                    onChangeText={setMessage}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    placeholder={placeholder}
                    placeholderTextColor={withOpacity(colors.foreground, 0.45)}
                    className="text-foreground text-base px-3 py-2"
                    style={{
                      backgroundColor: isInputFocused
                        ? chatStyles.primaryColor + '12'
                        : colors.background + '30',
                      borderRadius: 16,
                      minHeight: 36,
                    }}
                    multiline
                    maxLength={1000}
                    returnKeyType="send"
                    onSubmitEditing={handleSend}
                  />
                </View>

                {/* Voice/Send button */}
                <Pressable
                  onPress={hasText ? handleSend : handleVoicePress}
                  className="rounded-full bg-white dark:bg-card-elevated border border-border/10"
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.9 : 1,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                    width: 48,
                    height: 48,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: colors.shadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.12,
                    shadowRadius: 4,
                    elevation: 3,
                  })}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Animated.View style={micIconStyle}>
                      <SoundWaveIcon
                        size={28}
                        color={chatStyles.primaryColor}
                        strokeWidth={2}
                      />
                    </Animated.View>
                    <Animated.View style={sendIconStyle}>
                      <ArrowUp
                        size={28}
                        color={chatStyles.primaryColor}
                        strokeWidth={2}
                      />
                    </Animated.View>
                  </View>
                </Pressable>
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
