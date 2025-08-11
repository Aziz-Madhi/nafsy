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
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { Text } from '~/components/ui/text';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useUserData } from '~/hooks/useSharedData';
import { useChatUIStore } from '~/store';
import { SPRING_PRESETS } from '~/lib/animations/presets';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Thought Card component - unique design for messages
const ThoughtCard = memo(function ThoughtCard({
  text,
  isUser,
  isAnimating = false,
}: {
  text: string;
  isUser: boolean;
  isAnimating?: boolean;
}) {
  const cardScale = useSharedValue(isAnimating ? 0.8 : 1);
  const cardOpacity = useSharedValue(isAnimating ? 0 : 1);
  const cardRotation = useSharedValue(isAnimating ? -2 : 0);
  const shadowOpacity = useSharedValue(isAnimating ? 0 : 0.3);

  useEffect(() => {
    if (isAnimating) {
      // Animate in with organic movement
      cardScale.value = withSpring(1, {
        damping: 18,
        stiffness: 200,
        mass: 1,
      });
      cardOpacity.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
      cardRotation.value = withSequence(
        withSpring(2, { damping: 8, stiffness: 100 }),
        withSpring(0, { damping: 12, stiffness: 150 })
      );
      shadowOpacity.value = withDelay(
        200,
        withSpring(0.3, { damping: 15, stiffness: 100 })
      );
    }
  }, [isAnimating, cardScale, cardOpacity, cardRotation, shadowOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: cardScale.value },
      { rotate: `${cardRotation.value}deg` },
    ],
    opacity: cardOpacity.value,
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    shadowOpacity: shadowOpacity.value,
  }));

  // Breathing animation for active card
  const breathingScale = useSharedValue(1);

  useEffect(() => {
    if (!isAnimating) {
      // Gentle breathing effect
      const breathe = () => {
        breathingScale.value = withSequence(
          withSpring(1.02, { duration: 2000 }),
          withSpring(1, { duration: 2000 })
        );
      };
      breathe();
      const interval = setInterval(breathe, 4000);
      return () => clearInterval(interval);
    }
  }, [isAnimating, breathingScale]);

  const breathingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: breathingScale.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, breathingStyle]}>
      <Animated.View
        style={[shadowStyle, { maxWidth: SCREEN_WIDTH * 0.8, alignSelf: 'center' }]}
        className={isUser ? 'rounded-3xl px-6 py-4 bg-green-400' : 'rounded-3xl px-6 py-4 bg-brand-dark-blue'}
      >
        <Text
          style={{
            color: 'white',
            fontSize: 17,
            fontWeight: '400',
            lineHeight: 24,
            textAlign: 'center',
            letterSpacing: 0.2,
          }}
        >
          {text}
        </Text>
      </Animated.View>
    </Animated.View>
  );
});

// Conversation Pair - manages the face-to-face layout
const ConversationPair = memo(function ConversationPair({
  userMessage,
  aiMessage,
  isExiting = false,
}: {
  userMessage: string | null;
  aiMessage: string | null;
  isExiting?: boolean;
}) {
  const pairOpacity = useSharedValue(isExiting ? 1 : 0);
  const pairScale = useSharedValue(isExiting ? 1 : 0.9);

  useEffect(() => {
    if (isExiting) {
      // Fade and scale out
      pairOpacity.value = withSpring(0, SPRING_PRESETS.gentle);
      pairScale.value = withSpring(0.85, SPRING_PRESETS.gentle);
    } else {
      // Fade and scale in
      pairOpacity.value = withDelay(200, withSpring(1, SPRING_PRESETS.gentle));
      pairScale.value = withDelay(200, withSpring(1, SPRING_PRESETS.gentle));
    }
  }, [isExiting, pairOpacity, pairScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pairOpacity.value,
    transform: [{ scale: pairScale.value }],
  }));

  if (!userMessage) return null;

  return (
    <Animated.View style={[animatedStyle, { gap: 20, paddingHorizontal: 20 }]}>
      <ThoughtCard text={userMessage} isUser={true} isAnimating={!isExiting} />
      {aiMessage && (
        <ThoughtCard text={aiMessage} isUser={false} isAnimating={!isExiting} />
      )}
    </Animated.View>
  );
});

// Organic typing indicator
const OrganicTypingIndicator = memo(function OrganicTypingIndicator() {
  const lineWidth1 = useSharedValue(0);
  const lineWidth2 = useSharedValue(0);
  const lineWidth3 = useSharedValue(0);

  useEffect(() => {
    // Simulate handwriting motion
    const animate = () => {
      lineWidth1.value = withSequence(
        withSpring(20, { damping: 8, stiffness: 100 }),
        withDelay(500, withSpring(0, { damping: 8, stiffness: 100 }))
      );
      lineWidth2.value = withDelay(
        200,
        withSequence(
          withSpring(30, { damping: 8, stiffness: 100 }),
          withDelay(400, withSpring(0, { damping: 8, stiffness: 100 }))
        )
      );
      lineWidth3.value = withDelay(
        400,
        withSequence(
          withSpring(25, { damping: 8, stiffness: 100 }),
          withDelay(300, withSpring(0, { damping: 8, stiffness: 100 }))
        )
      );
    };

    animate();
    const interval = setInterval(animate, 2000);
    return () => clearInterval(interval);
  }, [lineWidth1, lineWidth2, lineWidth3]);

  const line1Style = useAnimatedStyle(() => ({
    width: lineWidth1.value,
  }));

  const line2Style = useAnimatedStyle(() => ({
    width: lineWidth2.value,
  }));

  const line3Style = useAnimatedStyle(() => ({
    width: lineWidth3.value,
  }));

  return (
    <View className="bg-brand-dark-blue rounded-2xl p-4 self-center" style={{ gap: 4 }}>
      <Animated.View
        style={[
          line1Style,
          { height: 2, backgroundColor: 'white', borderRadius: 1 },
        ]}
      />
      <Animated.View
        style={[
          line2Style,
          { height: 2, backgroundColor: 'white', borderRadius: 1 },
        ]}
      />
      <Animated.View
        style={[
          line3Style,
          { height: 2, backgroundColor: 'white', borderRadius: 1 },
        ]}
      />
    </View>
  );
});

// Main floating chat component with personal feel
export const FloatingChatPersonal = memo(function FloatingChatPersonal() {
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

  // Convex integration - using ventChat for separate sessions
  const { currentUser, isUserReady } = useUserData();
  const sendVentMessage = useMutation(api.ventChat.sendVentMessage);
  const currentVentSessionId = useQuery(
    api.ventChat.getCurrentVentSessionId,
    isUserReady ? {} : 'skip'
  );

  // Animation values
  const sendButtonScale = useSharedValue(1);
  const backgroundScale = useSharedValue(0.95);

  // Entrance animation for background
  useEffect(() => {
    if (visible) {
      backgroundScale.value = withSpring(1, SPRING_PRESETS.gentle);
    } else {
      backgroundScale.value = withSpring(0.95, SPRING_PRESETS.quick);
    }
  }, [visible, backgroundScale]);

  const backgroundStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backgroundScale.value }],
  }));

  // Send button animated style
  const sendButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendButtonScale.value }],
    opacity: inputText.trim() ? 1 : 0.6,
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
      withSpring(0.85, SPRING_PRESETS.quick),
      withSpring(1.1, SPRING_PRESETS.bouncy),
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
      // Send to Convex ventChat
      await sendVentMessage({
        content: message,
        role: 'user',
        sessionId: currentVentSessionId || undefined,
      });

      // Generate AI response
      setTimeout(async () => {
        try {
          const aiResponse = getPersonalResponse(message);

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
      }, 1800);
    } catch (error) {
      console.error('Error sending message:', error);
      setInputText(message); // Restore on error
      setIsAITyping(false);
    }
  }, [
    inputText,
    currentUser,
    currentVentSessionId,
    currentUserMessage,
    currentAIMessage,
    sendVentMessage,
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

  // Helper function for personal, empathetic responses
  const getPersonalResponse = (message: string): string => {
    const lower = message.toLowerCase();

    if (lower.includes('stress') || lower.includes('overwhelm')) {
      return "I feel the weight you're carrying. Let's breathe through this together.";
    } else if (lower.includes('anxious') || lower.includes('anxiety')) {
      return "Your anxiety is real and valid. You're safe in this moment with me.";
    } else if (lower.includes('sad') || lower.includes('down')) {
      return "Your sadness matters. I'm here, holding space for whatever you need to share.";
    } else if (lower.includes('angry') || lower.includes('frustrated')) {
      return 'Your anger deserves to be heard. This is your space to let it all out.';
    } else if (lower.includes('lonely') || lower.includes('alone')) {
      return "I'm right here with you. In this space, you're never truly alone.";
    } else if (lower.includes('scared') || lower.includes('afraid')) {
      return "Fear can feel so overwhelming. I'm here to sit with you through it.";
    }

    return "Whatever you're feeling right now is valid. This is your safe space to express it all.";
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View
        entering={FadeIn.duration(400)}
        exiting={FadeOut.duration(300)}
        style={{ flex: 1 }}
      >
        {/* Solid gradient background for complete privacy */}
        <Animated.View style={[backgroundStyle, { flex: 1 }]}>
          <LinearGradient
            colors={['#1a1f36', '#2d3561', '#1a1f36']}
            style={{ flex: 1 }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
              {/* Close button - subtle and minimal */}
              <Animated.View
                entering={FadeIn.delay(300)}
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
                    width: 40,
                    height: 40,
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <SymbolView
                    name="xmark"
                    size={18}
                    tintColor="rgba(255, 255, 255, 0.6)"
                    weight="medium"
                  />
                </Pressable>
              </Animated.View>

              {/* Conversation area - centered and intimate */}
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  paddingBottom: 120,
                }}
              >
                <View style={{ gap: 30 }}>
                  {/* Previous conversation pair (fading out) */}
                  {previousUserMessage && (
                    <ConversationPair
                      userMessage={previousUserMessage}
                      aiMessage={previousAIMessage}
                      isExiting={true}
                    />
                  )}

                  {/* Current conversation pair */}
                  {currentUserMessage && (
                    <ConversationPair
                      userMessage={currentUserMessage}
                      aiMessage={currentAIMessage}
                      isExiting={false}
                    />
                  )}

                  {/* Typing indicator */}
                  {isAITyping && (
                    <Animated.View entering={FadeIn.delay(300)}>
                      <OrganicTypingIndicator />
                    </Animated.View>
                  )}

                  {/* Welcome state - warm and inviting */}
                  {!currentUserMessage && !previousUserMessage && (
                    <Animated.View
                      entering={FadeIn.delay(200)}
                      style={{
                        alignSelf: 'center',
                        maxWidth: SCREEN_WIDTH * 0.8,
                      }}
                    >
                      <Text
                        style={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: 18,
                          textAlign: 'center',
                          lineHeight: 26,
                          letterSpacing: 0.3,
                        }}
                      >
                        This is your private space.{'\n'}Whatever you share
                        stays between us.
                      </Text>
                    </Animated.View>
                  )}
                </View>
              </View>

              {/* Input area - warm and inviting */}
              <Animated.View
                entering={SlideInDown.springify().damping(25).stiffness(250)}
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
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: 30,
                    paddingLeft: 24,
                    paddingRight: 4,
                    paddingVertical: 4,
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <TextInput
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Share what's on your heart..."
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    style={{
                      flex: 1,
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontSize: 16,
                      paddingVertical: 14,
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
                        width: 52,
                        height: 52,
                        backgroundColor: inputText.trim()
                          ? '#7BA7D9'
                          : 'rgba(123, 167, 217, 0.2)',
                        borderRadius: 26,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <SymbolView
                        name="heart.fill"
                        size={24}
                        tintColor="white"
                      />
                    </Pressable>
                  </Animated.View>
                </View>
              </Animated.View>
            </KeyboardAvoidingView>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
});

export default FloatingChatPersonal;
