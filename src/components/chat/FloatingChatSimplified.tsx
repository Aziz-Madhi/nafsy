import React, { useEffect, useCallback, memo } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  withSpring,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { SymbolView } from 'expo-symbols';
import { Text } from '~/components/ui/text';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useUserData } from '~/hooks/useSharedData';
import { useChatUIStore } from '~/store';
import { SPRING_PRESETS } from '~/lib/animations/presets';

// Message bubble component with native iOS styling
const MessageBubble = memo(function MessageBubble({
  text,
  isUser,
  isAnimating = false,
}: {
  text: string;
  isUser: boolean;
  isAnimating?: boolean;
}) {
  const shadowOpacity = useSharedValue(isAnimating ? 0 : 0.15);
  const messageScale = useSharedValue(isAnimating ? 0.95 : 1);
  const messageOpacity = useSharedValue(isAnimating ? 0 : 1);

  useEffect(() => {
    if (isAnimating) {
      // Animate in with subtle spring
      messageScale.value = withSpring(1, SPRING_PRESETS.gentle);
      messageOpacity.value = withSpring(1, SPRING_PRESETS.gentle);
      shadowOpacity.value = withDelay(
        100,
        withSpring(0.15, SPRING_PRESETS.gentle)
      );
    }
  }, [isAnimating, messageOpacity, messageScale, shadowOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: messageScale.value }],
    opacity: messageOpacity.value,
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    shadowOpacity: shadowOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        shadowStyle,
        {
          alignSelf: isUser ? 'flex-end' : 'flex-start',
          backgroundColor: isUser ? '#9CC99A' : '#7BA7D9',
          borderRadius: 20,
          paddingHorizontal: 16,
          paddingVertical: 12,
          maxWidth: '75%',
          shadowColor: isUser ? '#9CC99A' : '#7BA7D9',
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 8,
          elevation: 4,
        },
      ]}
    >
      <Text
        style={{
          color: 'white',
          fontSize: 16,
          fontWeight: isUser ? '500' : '400',
          lineHeight: 22,
        }}
      >
        {text}
      </Text>
    </Animated.View>
  );
});

// Message pair component for clean transitions
const MessagePair = memo(function MessagePair({
  userMessage,
  aiMessage,
  isExiting = false,
}: {
  userMessage: string | null;
  aiMessage: string | null;
  isExiting?: boolean;
}) {
  const pairOpacity = useSharedValue(isExiting ? 1 : 0);
  const pairTranslateY = useSharedValue(isExiting ? 0 : 10);

  useEffect(() => {
    if (isExiting) {
      // Fade out and slide up
      pairOpacity.value = withSpring(0, SPRING_PRESETS.gentle);
      pairTranslateY.value = withSpring(-8, SPRING_PRESETS.gentle);
    } else {
      // Fade in and settle
      pairOpacity.value = withSpring(1, SPRING_PRESETS.gentle);
      pairTranslateY.value = withSpring(0, SPRING_PRESETS.gentle);
    }
  }, [isExiting, pairOpacity, pairTranslateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pairOpacity.value,
    transform: [{ translateY: pairTranslateY.value }],
  }));

  if (!userMessage) return null;

  return (
    <Animated.View style={[animatedStyle, { gap: 16 }]}>
      <MessageBubble
        text={userMessage}
        isUser={true}
        isAnimating={!isExiting}
      />
      {aiMessage && (
        <MessageBubble
          text={aiMessage}
          isUser={false}
          isAnimating={!isExiting}
        />
      )}
    </Animated.View>
  );
});

// Typing indicator component
const TypingIndicator = memo(function TypingIndicator() {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    // Staggered bouncing dots
    dot1.value = withDelay(
      0,
      withSequence(
        withSpring(-5, { damping: 8, stiffness: 200 }),
        withSpring(0, { damping: 8, stiffness: 200 })
      )
    );
    dot2.value = withDelay(
      100,
      withSequence(
        withSpring(-5, { damping: 8, stiffness: 200 }),
        withSpring(0, { damping: 8, stiffness: 200 })
      )
    );
    dot3.value = withDelay(
      200,
      withSequence(
        withSpring(-5, { damping: 8, stiffness: 200 }),
        withSpring(0, { damping: 8, stiffness: 200 })
      )
    );

    const interval = setInterval(() => {
      dot1.value = withSequence(
        withSpring(-5, { damping: 8, stiffness: 200 }),
        withSpring(0, { damping: 8, stiffness: 200 })
      );
      dot2.value = withDelay(
        100,
        withSequence(
          withSpring(-5, { damping: 8, stiffness: 200 }),
          withSpring(0, { damping: 8, stiffness: 200 })
        )
      );
      dot3.value = withDelay(
        200,
        withSequence(
          withSpring(-5, { damping: 8, stiffness: 200 }),
          withSpring(0, { damping: 8, stiffness: 200 })
        )
      );
    }, 1200);

    return () => clearInterval(interval);
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
    <View
      className="flex-row bg-brand-dark-blue rounded-xl px-4 py-3 self-start"
      style={{ gap: 4 }}
    >
      <Animated.View
        style={[
          dot1Style,
          { width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' },
        ]}
      />
      <Animated.View
        style={[
          dot2Style,
          { width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' },
        ]}
      />
      <Animated.View
        style={[
          dot3Style,
          { width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' },
        ]}
      />
    </View>
  );
});

// Main floating chat component
export const FloatingChatSimplified = memo(function FloatingChatSimplified() {
  // Zustand store
  const visible = useChatUIStore((state) => state.isFloatingChatVisible);
  const { setFloatingChatVisible } = useChatUIStore();
  const [inputText, setInputText] = React.useState('');
  const [currentUserMessage, setCurrentUserMessage] = React.useState<
    string | null
  >(null);
  const [currentAIMessage, setCurrentAIMessage] = React.useState<string | null>(
    null
  );
  const [previousUserMessage, setPreviousUserMessage] = React.useState<
    string | null
  >(null);
  const [previousAIMessage, setPreviousAIMessage] = React.useState<
    string | null
  >(null);
  const [isAITyping, setIsAITyping] = React.useState(false);

  // Convex integration
  const { currentUser, isUserReady } = useUserData();
  const sendMainMessage = useMutation(api.mainChat.sendMainMessage);
  const currentMainSessionId = useQuery(
    api.mainChat.getCurrentMainSessionId,
    isUserReady ? {} : 'skip'
  );

  // Animation values
  const sendButtonScale = useSharedValue(1);

  // Send button animated style
  const sendButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendButtonScale.value }],
    opacity: inputText.trim() ? 1 : 0.5,
  }));

  const handleClose = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    setFloatingChatVisible(false);
  }, [setFloatingChatVisible]);

  const handleSend = useCallback(async () => {
    const message = inputText.trim();
    if (!message || !currentUser) return;

    // Haptic feedback
    impactAsync(ImpactFeedbackStyle.Medium);

    // Animate send button
    sendButtonScale.value = withSequence(
      withSpring(0.9, SPRING_PRESETS.quick),
      withSpring(1.05, SPRING_PRESETS.bouncy),
      withSpring(1, SPRING_PRESETS.snappy)
    );

    // Move current to previous
    if (currentUserMessage) {
      setPreviousUserMessage(currentUserMessage);
      setPreviousAIMessage(currentAIMessage);
    }

    // Set new message
    setCurrentUserMessage(message);
    setCurrentAIMessage(null);
    setIsAITyping(true);
    setInputText('');

    try {
      // Send to Convex
      await sendMainMessage({
        content: message,
        role: 'user',
        sessionId: currentMainSessionId || undefined,
      });

      // Generate AI response
      setTimeout(async () => {
        try {
          const aiResponse = getContextualResponse(message);

          await sendMainMessage({
            content: aiResponse,
            role: 'assistant',
            sessionId: currentMainSessionId || undefined,
          });

          setCurrentAIMessage(aiResponse);
          setIsAITyping(false);
          impactAsync(ImpactFeedbackStyle.Light);
        } catch (error) {
          console.error('Error sending AI response:', error);
          setIsAITyping(false);
        }
      }, 1500);
    } catch (error) {
      console.error('Error sending message:', error);
      setInputText(message); // Restore on error
      setIsAITyping(false);
    }
  }, [
    inputText,
    currentUser,
    currentMainSessionId,
    currentUserMessage,
    currentAIMessage,
    sendMainMessage,
    sendButtonScale,
  ]);

  // Clear state when modal closes
  useEffect(() => {
    if (!visible) {
      setInputText('');
      setCurrentUserMessage(null);
      setCurrentAIMessage(null);
      setPreviousUserMessage(null);
      setPreviousAIMessage(null);
      setIsAITyping(false);
    }
  }, [visible]);

  // Helper function for contextual responses
  const getContextualResponse = (message: string): string => {
    const lower = message.toLowerCase();

    if (lower.includes('stress') || lower.includes('overwhelm')) {
      return "I hear you're feeling overwhelmed. Let's take this one step at a time.";
    } else if (lower.includes('anxious') || lower.includes('anxiety')) {
      return "Anxiety can be really tough. Remember, you're safe right now.";
    } else if (lower.includes('sad') || lower.includes('down')) {
      return "It's okay to feel sad. I'm here to listen without judgment.";
    } else if (lower.includes('angry') || lower.includes('frustrated')) {
      return 'Your feelings are valid. Sometimes we need to express our frustration.';
    } else if (lower.includes('lonely') || lower.includes('alone')) {
      return "Feeling lonely is hard. You're not alone in this moment.";
    }

    return "I'm here to listen and support you. Tell me more about how you're feeling.";
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View
        entering={FadeIn.duration(300)}
        exiting={FadeOut.duration(200)}
        style={{ flex: 1 }}
      >
        <BlurView
          intensity={40}
          tint="systemThinMaterialDark"
          style={{ flex: 1 }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            {/* Close button */}
            <Animated.View
              entering={FadeIn.delay(200)}
              style={{
                position: 'absolute',
                top: 60,
                right: 20,
                zIndex: 10,
              }}
            >
              <Pressable
                onPress={handleClose}
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SymbolView
                  name="xmark"
                  size={20}
                  tintColor="white"
                  weight="medium"
                />
              </Pressable>
            </Animated.View>

            {/* Message area */}
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                paddingHorizontal: 24,
                paddingBottom: 100,
              }}
            >
              <View style={{ gap: 20 }}>
                {/* Previous message pair (fading out) */}
                {previousUserMessage && (
                  <MessagePair
                    userMessage={previousUserMessage}
                    aiMessage={previousAIMessage}
                    isExiting={true}
                  />
                )}

                {/* Current message pair */}
                {currentUserMessage && (
                  <MessagePair
                    userMessage={currentUserMessage}
                    aiMessage={currentAIMessage}
                    isExiting={false}
                  />
                )}

                {/* Typing indicator */}
                {isAITyping && (
                  <Animated.View entering={FadeIn.delay(200)}>
                    <TypingIndicator />
                  </Animated.View>
                )}

                {/* Welcome message when empty */}
                {!currentUserMessage && !previousUserMessage && (
                  <Animated.View
                    entering={FadeIn}
                    style={{
                      alignSelf: 'center',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 20,
                      paddingHorizontal: 24,
                      paddingVertical: 16,
                    }}
                  >
                    <Text
                      style={{
                        color: 'white',
                        fontSize: 16,
                        textAlign: 'center',
                        opacity: 0.9,
                      }}
                    >
                      I&apos;m here to listen. What&apos;s on your mind?
                    </Text>
                  </Animated.View>
                )}
              </View>
            </View>

            {/* Input area */}
            <Animated.View
              entering={SlideInDown.springify().damping(20).stiffness(300)}
              style={{
                position: 'absolute',
                bottom: 30,
                left: 20,
                right: 20,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: 28,
                  paddingLeft: 20,
                  paddingRight: 4,
                  paddingVertical: 4,
                }}
              >
                <TextInput
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Share your thoughts..."
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  style={{
                    flex: 1,
                    color: 'white',
                    fontSize: 16,
                    paddingVertical: 12,
                    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
                  }}
                  autoFocus
                  returnKeyType="send"
                  onSubmitEditing={handleSend}
                />
                <Animated.View style={sendButtonStyle}>
                  <Pressable
                    onPress={handleSend}
                    disabled={!inputText.trim()}
                    style={{
                      width: 48,
                      height: 48,
                      backgroundColor: inputText.trim()
                        ? '#7BA7D9'
                        : 'rgba(123, 167, 217, 0.3)',
                      borderRadius: 24,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <SymbolView
                      name="arrow.up.circle.fill"
                      size={28}
                      tintColor="white"
                    />
                  </Pressable>
                </Animated.View>
              </View>
            </Animated.View>

            {/* Tap to dismiss */}
            <Pressable
              onPress={handleClose}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: -1,
              }}
            />
          </KeyboardAvoidingView>
        </BlurView>
      </Animated.View>
    </Modal>
  );
});

export default FloatingChatSimplified;
