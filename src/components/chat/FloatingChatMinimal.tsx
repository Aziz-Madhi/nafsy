import React, { useEffect, useCallback, memo } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  StatusBar,
} from 'react-native';
// Removed gesture handler imports - causing crashes with Modal
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  FadeInUp,
  interpolate,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { MotiView, AnimatePresence } from 'moti';
import { SymbolView } from 'expo-symbols';
import { Text } from '~/components/ui/text';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useUserData } from '~/hooks/useSharedData';
import { useChatUIStore } from '~/store';
import { StreamingText } from './StreamingText';
import { AnimatedWelcomeText } from './AnimatedWelcomeText';
import { SPRING_PRESETS } from '~/lib/animations';
import { useColors } from '~/hooks/useColors';
import { useTranslation } from '~/hooks/useTranslation';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Removed iOS animation configs - now using Moti's simpler approach

// Enhanced message display with better animations and layout
const MinimalMessage = memo(function MinimalMessage({
  text,
  isUser,
  showAnimation = true,
  isStreaming = false,
  onStreamComplete,
}: {
  text: string;
  isUser: boolean;
  showAnimation?: boolean;
  isStreaming?: boolean;
  onStreamComplete?: () => void;
}) {
  const scale = useSharedValue(0.95);
  const translateY = useSharedValue(isUser ? 10 : 0);

  useEffect(() => {
    if (showAnimation) {
      scale.value = withSpring(1, SPRING_PRESETS.gentle);
      translateY.value = withSpring(0, SPRING_PRESETS.gentle);
    }
  }, [showAnimation, scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.View
      entering={showAnimation ? FadeInUp.duration(400).springify() : undefined}
      exiting={FadeOut.duration(300)}
      style={[
        {
          alignSelf: 'center',
          maxWidth: SCREEN_WIDTH * 0.85,
          paddingVertical: 8,
        },
        animatedStyle,
      ]}
    >
      {isStreaming && !isUser ? (
        <StreamingText
          text={text}
          onComplete={onStreamComplete}
          style={{
            color: 'rgba(255, 255, 255, 0.85)',
            fontSize: 17,
            fontWeight: '400',
            lineHeight: 26,
            textAlign: 'center',
            letterSpacing: 0.3,
            fontFamily: isUser
              ? Platform.OS === 'ios'
                ? 'SF Pro Display'
                : 'Roboto'
              : 'CrimsonPro-Regular', // AI uses serif font for differentiation
          }}
          baseSpeed={25}
          punctuationPause={100}
        />
      ) : (
        <Text
          style={{
            color: isUser
              ? 'rgba(255, 255, 255, 0.95)'
              : 'rgba(255, 255, 255, 0.85)',
            fontSize: isUser ? 18 : 17,
            fontWeight: isUser ? '500' : '400',
            lineHeight: 26,
            textAlign: 'center',
            letterSpacing: 0.3,
            fontFamily: isUser
              ? Platform.OS === 'ios'
                ? 'SF Pro Display'
                : 'Roboto'
              : 'CrimsonPro-Regular', // AI uses serif font for differentiation
            ...(isUser
              ? {}
              : {
                  shadowColor: '#2F6A8D',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.3,
                  shadowRadius: 20,
                }),
          }}
        >
          {text}
        </Text>
      )}
    </Animated.View>
  );
});

// Message history display with fade animations
const MessageHistoryDisplay = memo(function MessageHistoryDisplay({
  messages,
  isStreaming,
  onStreamComplete,
}: {
  messages: { text: string; isUser: boolean; id: string }[];
  isStreaming: boolean;
  onStreamComplete?: () => void;
}) {
  if (messages.length === 0) return null;

  return (
    <View style={{ gap: 20 }}>
      {messages.map((message, index) => {
        const isLastMessage = index === messages.length - 1;
        const isStreamingMessage =
          isLastMessage && !message.isUser && isStreaming;
        const showSeparator =
          message.isUser &&
          index < messages.length - 1 &&
          !messages[index + 1].isUser;

        return (
          <Animated.View
            key={message.id}
            entering={FadeInUp.duration(400).springify()}
            exiting={FadeOut.duration(300)}
          >
            <MinimalMessage
              text={message.text}
              isUser={message.isUser}
              isStreaming={isStreamingMessage}
              onStreamComplete={
                isStreamingMessage ? onStreamComplete : undefined
              }
            />

            {/* Separator line between user and AI messages */}
            {showSeparator && (
              <View style={{ alignSelf: 'center', paddingVertical: 12 }}>
                <Animated.View
                  entering={FadeIn.duration(400).delay(200)}
                  style={{
                    width: 40,
                    height: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    alignSelf: 'center',
                  }}
                />
              </View>
            )}
          </Animated.View>
        );
      })}
    </View>
  );
});

// Enhanced typing indicator with animated dots
const EnhancedTypingIndicator = memo(function EnhancedTypingIndicator() {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    // Staggered bouncy animations for dots
    dot1.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 200 }),
        withSpring(-8, SPRING_PRESETS.bouncy),
        withSpring(0, SPRING_PRESETS.bouncy)
      ),
      -1
    );

    const timeout1 = setTimeout(() => {
      dot2.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 200 }),
          withSpring(-8, SPRING_PRESETS.bouncy),
          withSpring(0, SPRING_PRESETS.bouncy)
        ),
        -1
      );
    }, 150);

    const timeout2 = setTimeout(() => {
      dot3.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 200 }),
          withSpring(-8, SPRING_PRESETS.bouncy),
          withSpring(0, SPRING_PRESETS.bouncy)
        ),
        -1
      );
    }, 300);

    return () => {
      // Cancel animations and timeouts on cleanup
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      dot1.value = 0;
      dot2.value = 0;
      dot3.value = 0;
    };
  }, [dot1, dot2, dot3]);

  const dot1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot1.value }],
  }));

  const dot2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot2.value }],
  }));

  const dot3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: dot3.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(300).springify()}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}
    >
      <Animated.View style={dot1Style}>
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            shadowColor: '#ffffff',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 4,
          }}
        />
      </Animated.View>
      <Animated.View style={dot2Style}>
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            shadowColor: '#ffffff',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 4,
          }}
        />
      </Animated.View>
      <Animated.View style={dot3Style}>
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            shadowColor: '#ffffff',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 4,
          }}
        />
      </Animated.View>
    </Animated.View>
  );
});

// Main floating chat component - minimal design
export const FloatingChatMinimal = memo(function FloatingChatMinimal() {
  const colors = useColors();
  const { t } = useTranslation();

  // Component mount tracking to prevent state updates on unmounted component
  const isMountedRef = React.useRef(true);

  // Zustand store
  const visible = useChatUIStore((state) => state.isFloatingChatVisible);
  const { setFloatingChatVisible } = useChatUIStore();
  const [isAnimating, setIsAnimating] = React.useState(visible);
  const [inputText, setInputText] = React.useState('');
  // Message history - keep track of all messages
  const [messages, setMessages] = React.useState<
    { text: string; isUser: boolean; id: string }[]
  >([]);
  const [isAITyping, setIsAITyping] = React.useState(false);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const MAX_VISIBLE_MESSAGES = 6; // Show max 3 exchanges (6 messages)

  // Store timeout refs for cleanup
  const timeoutRefs = React.useRef<NodeJS.Timeout[]>([]);

  // Convex integration - using ventChat for separate sessions
  const { currentUser, isUserReady } = useUserData();
  const sendVentMessage = useMutation(api.ventChat.sendVentMessage);
  const currentVentSessionId = useQuery(
    api.ventChat.getCurrentVentSessionId,
    isUserReady ? {} : 'skip'
  );

  // Enhanced input and button animations
  const inputScale = useSharedValue(1);
  const inputGlow = useSharedValue(0);
  const sendButtonScale = useSharedValue(1);
  const sendButtonOpacity = useSharedValue(0.6);

  const inputContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: inputScale.value }],
    shadowOpacity: interpolate(inputGlow.value, [0, 1], [0.1, 0.3], 'clamp'),
  }));

  const sendButtonStyle = useAnimatedStyle(() => ({
    opacity: inputText.trim() ? 1 : sendButtonOpacity.value,
    transform: [{ scale: sendButtonScale.value }],
  }));

  const handleInputFocus = () => {
    inputScale.value = withSpring(1.02, SPRING_PRESETS.gentle);
    inputGlow.value = withTiming(1, { duration: 300 });
  };

  const handleInputBlur = () => {
    inputScale.value = withSpring(1, SPRING_PRESETS.gentle);
    inputGlow.value = withTiming(0, { duration: 300 });
  };

  const handleClose = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    setIsAnimating(false);
    // Delay the actual modal close to allow exit animation
    setTimeout(() => {
      setFloatingChatVisible(false);
    }, 300);
  }, [setFloatingChatVisible]);

  const handleSend = useCallback(async () => {
    const message = inputText.trim();
    if (!message || !currentUser || !isMountedRef.current) return;

    // Enhanced haptic feedback
    impactAsync(ImpactFeedbackStyle.Medium);

    // Add user message to history
    const userMessageId = Date.now().toString();
    if (isMountedRef.current) {
      setMessages((prev) => [
        ...prev,
        { text: message, isUser: true, id: userMessageId },
      ]);
      setIsAITyping(true);
      setInputText('');
    }

    try {
      // Send to Convex ventChat
      await sendVentMessage({
        content: message,
        role: 'user',
        sessionId: currentVentSessionId || undefined,
      });

      // Generate AI response with timeout tracking
      const timeoutId = setTimeout(async () => {
        if (!isMountedRef.current) return;

        try {
          const aiResponse = getContextualResponse(message);

          await sendVentMessage({
            content: aiResponse,
            role: 'assistant',
            sessionId: currentVentSessionId || undefined,
          });

          // Add AI response to history only if component is still mounted
          if (isMountedRef.current) {
            const aiMessageId = (Date.now() + 1).toString();
            setMessages((prev) => {
              const newMessages = [
                ...prev,
                { text: aiResponse, isUser: false, id: aiMessageId },
              ];
              // Keep only the last MAX_VISIBLE_MESSAGES
              if (newMessages.length > MAX_VISIBLE_MESSAGES) {
                return newMessages.slice(-MAX_VISIBLE_MESSAGES);
              }
              return newMessages;
            });
            setIsAITyping(false);
            setIsStreaming(true); // Start streaming the text
          }
        } catch (error) {
          console.error('Error sending AI response:', error);
          if (isMountedRef.current) {
            setIsAITyping(false);
          }
        }
      }, 1500);

      // Track timeout for cleanup
      timeoutRefs.current.push(timeoutId);
    } catch (error) {
      console.error('Error sending message:', error);
      if (isMountedRef.current) {
        setInputText(message); // Restore on error
        setIsAITyping(false);
      }
    }
  }, [inputText, currentUser, currentVentSessionId, sendVentMessage]);

  // Removed complex animation shared values - now handled by Moti

  // Handle animation state
  useEffect(() => {
    if (visible) {
      setIsAnimating(true);
    }
  }, [visible]);

  // Clear state when modal closes
  useEffect(() => {
    if (!visible) {
      // Only reset animations if component is still mounted
      if (isMountedRef.current) {
        // Reset input animations safely
        try {
          inputScale.value = 1;
          inputGlow.value = 0;
          sendButtonScale.value = 1;
        } catch (error) {
          // Ignore animation errors during unmount
          console.warn('Animation cleanup error (safe to ignore):', error);
        }

        // Clear React state
        setInputText('');
        setMessages([]);
        setIsAITyping(false);
        setIsStreaming(false);
      }

      // Clear all pending timeouts
      timeoutRefs.current.forEach(clearTimeout);
      timeoutRefs.current = [];
    }
  }, [visible, inputScale, inputGlow, sendButtonScale]);

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      // Mark component as unmounted
      isMountedRef.current = false;

      // Clear all pending timeouts
      timeoutRefs.current.forEach(clearTimeout);
      timeoutRefs.current = [];

      // Don't set animation values during unmount as it can cause crashes
      // The worklets may already be deallocated
    };
  }, []);

  // Helper function for contextual responses
  const getContextualResponse = (message: string): string => {
    const lower = message.toLowerCase();

    if (lower.includes('stress') || lower.includes('overwhelm')) {
      return t('chat.responses.stress');
    } else if (lower.includes('anxious') || lower.includes('anxiety')) {
      return t('chat.responses.anxiety');
    } else if (lower.includes('sad') || lower.includes('down')) {
      return t('chat.responses.sad');
    } else if (lower.includes('angry') || lower.includes('frustrated')) {
      return t('chat.responses.angry');
    } else if (lower.includes('lonely') || lower.includes('alone')) {
      return t('chat.responses.lonely');
    } else if (lower.includes('scared') || lower.includes('afraid')) {
      return t('chat.responses.scared');
    }

    return t('chat.defaultResponse');
  };

  // Removed old animated styles - now using Moti

  // Double tap tracking
  const lastTapRef = React.useRef(0);

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      handleClose();
    }
    lastTapRef.current = now;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      {/* Backdrop with fade animation */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: isAnimating ? 1 : 0 }}
        transition={{ type: 'timing', duration: 250 }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
        }}
      />

      {/* Modal container - fade only, no scale to avoid box edges */}
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: isAnimating ? 1 : 0 }}
        transition={{
          type: 'timing',
          duration: 300,
          delay: isAnimating ? 50 : 0, // Slight delay on enter for smoother effect
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(20, 20, 20, 0.95)',
        }}
      >
        <Pressable onPress={handleDoubleTap} style={{ flex: 1 }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            {/* Content container with delayed fade-in */}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: isAnimating ? 1 : 0 }}
              transition={{
                type: 'timing',
                duration: 400,
                delay: isAnimating ? 200 : 0, // Content appears after background
              }}
              style={{ flex: 1 }}
            >
              {/* Conversation area with iOS-style layout */}
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  paddingHorizontal: 24, // iOS spacing
                  paddingBottom: 120,
                  paddingTop: StatusBar.currentHeight || 44, // Safe area
                }}
              >
                {/* Enhanced welcome state with animated text */}
                {messages.length === 0 && (
                  <Animated.View
                    entering={FadeIn.duration(600).delay(300)}
                    style={{ alignItems: 'center' }}
                  >
                    <AnimatedWelcomeText
                      text={t('chat.floatingChat.welcomeMessage')}
                      style={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: 17,
                        textAlign: 'center',
                        lineHeight: 26,
                        letterSpacing: 0.5,
                        fontFamily:
                          Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
                      }}
                      wordDelay={100}
                    />
                  </Animated.View>
                )}

                {/* Message history */}
                {messages.length > 0 && (
                  <MessageHistoryDisplay
                    messages={messages}
                    isStreaming={isStreaming}
                    onStreamComplete={() => {
                      setIsStreaming(false);
                      impactAsync(ImpactFeedbackStyle.Light);
                    }}
                  />
                )}

                {/* Enhanced typing indicator */}
                {isAITyping && (
                  <Animated.View
                    entering={FadeIn.duration(300)}
                    style={{ marginTop: 20, alignItems: 'center' }}
                  >
                    <EnhancedTypingIndicator />
                  </Animated.View>
                )}
              </View>

              {/* iOS-style input area with native blur */}
              <Animated.View
                style={{
                  position: 'absolute',
                  bottom: Platform.OS === 'ios' ? 44 : 30, // iOS safe area
                  left: 20,
                  right: 20,
                }}
              >
                {/* Input container */}
                <View style={{ borderRadius: 32, overflow: 'hidden' }}>
                  <Animated.View
                    style={[
                      {
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: 32,
                        paddingLeft: 20,
                        paddingRight: 4,
                        paddingVertical: 4,
                        borderWidth: 0.5,
                        borderColor: 'rgba(255, 255, 255, 0.15)',
                        // iOS-style shadow
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 4,
                      },
                      inputContainerStyle,
                    ]}
                  >
                    <TextInput
                      value={inputText}
                      onChangeText={setInputText}
                      placeholder={t('chat.floatingChat.placeholder')}
                      placeholderTextColor="rgba(255, 255, 255, 0.4)"
                      style={{
                        flex: 1,
                        color: 'rgba(255, 255, 255, 0.95)',
                        fontSize: 17, // iOS standard
                        paddingVertical: 14,
                        letterSpacing: -0.1, // iOS tight spacing
                        fontFamily:
                          Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
                        fontWeight: '400',
                      }}
                      autoFocus
                      returnKeyType="send"
                      onSubmitEditing={handleSend}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      maxLength={500}
                      multiline={false}
                      textAlignVertical="center"
                    />
                    <Animated.View style={sendButtonStyle}>
                      <Pressable
                        onPress={handleSend}
                        onPressIn={() => {
                          if (inputText.trim()) {
                            sendButtonScale.value = withSpring(
                              0.88,
                              SPRING_PRESETS.quick
                            );
                          }
                        }}
                        onPressOut={() => {
                          if (inputText.trim()) {
                            sendButtonScale.value = withSpring(
                              1,
                              SPRING_PRESETS.bouncy
                            );
                          }
                        }}
                        disabled={!inputText.trim()}
                        style={{
                          width: 52, // Slightly larger for iOS
                          height: 52,
                          backgroundColor: inputText.trim()
                            ? 'rgba(0, 122, 255, 0.8)' // iOS blue
                            : 'rgba(255, 255, 255, 0.08)',
                          borderRadius: 26,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: inputText.trim() ? 0 : 0.5,
                          borderColor: 'rgba(255, 255, 255, 0.15)',
                          // iOS button shadow
                          shadowColor: inputText.trim() ? '#007AFF' : '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: inputText.trim() ? 0.3 : 0.05,
                          shadowRadius: inputText.trim() ? 4 : 2,
                        }}
                      >
                        <SymbolView
                          name="arrow.up"
                          size={22}
                          tintColor={
                            inputText.trim()
                              ? 'rgba(255, 255, 255, 0.95)'
                              : 'rgba(255, 255, 255, 0.5)'
                          }
                          weight="semibold"
                        />
                      </Pressable>
                    </Animated.View>
                  </Animated.View>
                </View>
              </Animated.View>
            </MotiView>
          </KeyboardAvoidingView>
        </Pressable>
      </MotiView>
    </Modal>
  );
});

export default FloatingChatMinimal;
