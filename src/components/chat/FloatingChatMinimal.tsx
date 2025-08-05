import React, { useEffect, useCallback, memo } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';
import { Text } from '~/components/ui/text';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useUserData } from '~/hooks/useSharedData';
import { useChatUIStore } from '~/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Minimal message display - no bubbles, just text
const MinimalMessage = memo(function MinimalMessage({
  text,
  isUser,
  showAnimation = true,
}: {
  text: string;
  isUser: boolean;
  showAnimation?: boolean;
}) {
  return (
    <Animated.View
      entering={showAnimation ? FadeIn.duration(400) : undefined}
      exiting={FadeOut.duration(300)}
      style={{
        alignSelf: 'center',
        maxWidth: SCREEN_WIDTH * 0.85,
        paddingVertical: 8,
      }}
    >
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
        }}
      >
        {text}
      </Text>
    </Animated.View>
  );
});

// Conversation display with simple fade transitions
const ConversationDisplay = memo(function ConversationDisplay({
  userMessage,
  aiMessage,
}: {
  userMessage: string | null;
  aiMessage: string | null;
}) {
  if (!userMessage) return null;

  return (
    <View style={{ gap: 24 }}>
      <MinimalMessage text={userMessage} isUser={true} />

      {userMessage && aiMessage && (
        <View style={{ alignSelf: 'center', paddingVertical: 8 }}>
          <View
            style={{
              width: 40,
              height: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              alignSelf: 'center',
            }}
          />
        </View>
      )}

      {aiMessage && <MinimalMessage text={aiMessage} isUser={false} />}
    </View>
  );
});

// Simple typing indicator
const SimpleTypingIndicator = memo(function SimpleTypingIndicator() {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    const interval = setInterval(() => {
      opacity.value = withTiming(opacity.value === 0.3 ? 1 : 0.3, {
        duration: 800,
      });
    }, 800);

    return () => clearInterval(interval);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View entering={FadeIn.duration(300)} style={animatedStyle}>
      <Text
        style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: 16,
          textAlign: 'center',
          fontStyle: 'italic',
        }}
      >
        typing...
      </Text>
    </Animated.View>
  );
});

// Main floating chat component - minimal design
export const FloatingChatMinimal = memo(function FloatingChatMinimal() {
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
  const [isAITyping, setIsAITyping] = React.useState(false);

  // Convex integration - using ventChat for separate sessions
  const { currentUser, isUserReady } = useUserData();
  const sendVentMessage = useMutation(api.ventChat.sendVentMessage);
  const currentVentSessionId = useQuery(
    api.ventChat.getCurrentVentSessionId,
    isUserReady ? {} : 'skip'
  );

  // Simple send button animation
  const sendButtonOpacity = useSharedValue(0.6);

  const sendButtonStyle = useAnimatedStyle(() => ({
    opacity: inputText.trim() ? 1 : sendButtonOpacity.value,
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

    // Clear previous messages when sending new one
    setCurrentUserMessage(message);
    setCurrentAIMessage(null);
    setIsAITyping(true);
    setInputText('');

    try {
      // Send to Convex ventChat
      await sendVentMessage({
        content: message,
        role: 'user',
        sessionId: currentVentSessionId || undefined,
      });

      // Generate AI response
      setTimeout(async () => {
        try {
          const aiResponse = getContextualResponse(message);

          await sendVentMessage({
            content: aiResponse,
            role: 'assistant',
            sessionId: currentVentSessionId || undefined,
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
  }, [inputText, currentUser, currentVentSessionId, sendVentMessage]);

  // Clear state when modal closes
  useEffect(() => {
    if (!visible) {
      setInputText('');
      setCurrentUserMessage(null);
      setCurrentAIMessage(null);
      setIsAITyping(false);
    }
  }, [visible]);

  // Helper function for contextual responses
  const getContextualResponse = (message: string): string => {
    const lower = message.toLowerCase();

    if (lower.includes('stress') || lower.includes('overwhelm')) {
      return "I feel the weight of what you're carrying. Let's take this moment together.";
    } else if (lower.includes('anxious') || lower.includes('anxiety')) {
      return "Your anxiety is real. You're safe here with me.";
    } else if (lower.includes('sad') || lower.includes('down')) {
      return "Your sadness matters. I'm here, holding space for all of it.";
    } else if (lower.includes('angry') || lower.includes('frustrated')) {
      return 'Your anger is valid. This is your space to express it.';
    } else if (lower.includes('lonely') || lower.includes('alone')) {
      return "I'm right here with you. You're not alone in this.";
    } else if (lower.includes('scared') || lower.includes('afraid')) {
      return "Fear can be overwhelming. I'm here to sit with you through it.";
    }

    return "Whatever you're feeling is valid. This is your safe space.";
  };

  // Double tap gesture to close
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      impactAsync(ImpactFeedbackStyle.Light);
      handleClose();
    });

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
        {/* Solid background - new color */}
        <GestureDetector gesture={doubleTap}>
          <View style={{ flex: 1, backgroundColor: '#2F6A8D' }}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
              {/* Conversation area - centered and minimal */}
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  paddingHorizontal: 30,
                  paddingBottom: 120,
                }}
              >
                {/* Welcome state */}
                {!currentUserMessage && (
                  <Animated.View entering={FadeIn.duration(600)}>
                    <Text
                      style={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: 17,
                        textAlign: 'center',
                        lineHeight: 26,
                        letterSpacing: 0.5,
                      }}
                    >
                      This is your private space.{'\n'}Share what&apos;s on your
                      mind.
                    </Text>
                  </Animated.View>
                )}

                {/* Current conversation */}
                {currentUserMessage && (
                  <ConversationDisplay
                    userMessage={currentUserMessage}
                    aiMessage={currentAIMessage}
                  />
                )}

                {/* Typing indicator */}
                {isAITyping && (
                  <View style={{ marginTop: 20 }}>
                    <SimpleTypingIndicator />
                  </View>
                )}
              </View>

              {/* Input area - minimal design */}
              <Animated.View
                entering={SlideInDown.duration(400)}
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
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 28,
                    paddingLeft: 20,
                    paddingRight: 4,
                    paddingVertical: 4,
                  }}
                >
                  <TextInput
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Type your thoughts..."
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    style={{
                      flex: 1,
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: 16,
                      paddingVertical: 12,
                      letterSpacing: 0.2,
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
                          ? 'rgba(255, 255, 255, 0.2)'
                          : 'rgba(255, 255, 255, 0.08)',
                        borderRadius: 24,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <SymbolView
                        name="arrow.up"
                        size={20}
                        tintColor="rgba(255, 255, 255, 0.9)"
                        weight="medium"
                      />
                    </Pressable>
                  </Animated.View>
                </View>
              </Animated.View>
            </KeyboardAvoidingView>
          </View>
        </GestureDetector>
      </Animated.View>
    </Modal>
  );
});

export default FloatingChatMinimal;
