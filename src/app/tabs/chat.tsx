import React, { useRef, useCallback, useEffect, Suspense } from 'react';
import { View, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { FlashList } from '@shopify/flash-list';
import { Text } from '~/components/ui/text';
import {
  ChatBubble,
  TypingIndicator,
  QuickReplyButton,
  FloatingChat,
  ChatHistorySidebar,
} from '~/components/chat';
import Animated, {
  FadeInDown,
  runOnJS,
  LinearTransition,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@clerk/clerk-expo';
import { useUserSafe } from '~/lib/useUserSafe';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  useFloatingChatVisible,
  useMainChatTyping,
  useShowQuickReplies,
  useHistorySidebarVisible,
  useChatUIStore,
} from '~/store';
import { useTranslation } from '~/hooks/useTranslation';

// Auth is now handled at tab layout level - no need for wrapper

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
}

const getWelcomeMessage = (t: any) =>
  t('chat.welcomeMessage') ||
  "Hello! I'm here to support your mental wellness journey.";

const getQuickReplies = (t: any) => [
  { text: t('chat.quickReplies.anxious') || "I'm feeling anxious", icon: '😟' },
  {
    text: t('chat.quickReplies.needTalk') || 'I need someone to talk to',
    icon: '💭',
  },
  {
    text: t('chat.quickReplies.trackMood') || 'I want to track my mood',
    icon: '📊',
  },
  {
    text: t('chat.quickReplies.showExercises') || 'Show me exercises',
    icon: '🧘',
  },
];

export default function ChatScreen() {
  // ===== ALL HOOKS FIRST (before any early returns) =====
  const { user, isLoaded } = useUserSafe();
  const { isSignedIn } = useAuth();
  const { t } = useTranslation();

  // Zustand hooks
  const isTyping = useMainChatTyping();
  const showFloatingChat = useFloatingChatVisible();
  const showQuickReplies = useShowQuickReplies();
  const showHistorySidebar = useHistorySidebarVisible();
  const {
    setFloatingChatVisible,
    setMainChatTyping,
    setShowQuickReplies,
    setHistorySidebarVisible,
  } = useChatUIStore();

  const flashListRef = useRef<FlashList<Message>>(null);

  // Convex hooks - only execute when auth is stable
  const currentUser = useQuery(
    api.users.getCurrentUser,
    isSignedIn && isLoaded ? {} : 'skip'
  );
  const mainChatMessages = useQuery(
    api.mainChat.getMainChatMessages,
    isSignedIn ? { limit: 50 } : 'skip'
  );
  const sendMainMessage = useMutation(api.mainChat.sendMainMessage);
  const createUser = useMutation(api.users.createUser);
  const currentMainSessionId = useQuery(
    api.mainChat.getCurrentMainSessionId,
    isSignedIn ? {} : 'skip'
  );

  // Auth is handled at tab layout level - no early returns needed

  // Create user if doesn't exist
  useEffect(() => {
    if (user && isSignedIn && isLoaded && currentUser === null && user.id) {
      createUser({
        clerkId: user.id,
        email: user.emailAddresses?.[0]?.emailAddress || '',
        name: user.fullName || user.firstName || undefined,
        avatarUrl: user.imageUrl || undefined,
      });
    }
  }, [user, isSignedIn, isLoaded, currentUser, createUser]);

  // Send welcome message on first load
  useEffect(() => {
    if (
      currentUser &&
      isSignedIn &&
      isLoaded &&
      mainChatMessages &&
      mainChatMessages.length === 0
    ) {
      sendMainMessage({
        content: getWelcomeMessage(t),
        role: 'assistant',
        sessionId: currentMainSessionId || undefined,
      });
    }
  }, [
    currentUser,
    isSignedIn,
    isLoaded,
    mainChatMessages,
    sendMainMessage,
    currentMainSessionId,
    t,
  ]);

  // Transform Convex main chat messages to UI format
  const messages: Message[] =
    mainChatMessages
      ?.map((msg) => ({
        id: msg._id,
        text: msg.content || '', // Ensure text is never undefined
        isUser: msg.role === 'user',
        timestamp: new Date(msg.createdAt).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      }))
      .reverse() || [];

  // FlashList render functions
  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => (
      <ChatBubble
        message={item.text}
        isUser={item.isUser}
        timestamp={item.timestamp}
        index={index}
      />
    ),
    []
  );

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const getItemType = useCallback(
    (item: Message) => (item.isUser ? 'user' : 'assistant'),
    []
  );

  // Simple chat content animation
  const chatTranslateX = useSharedValue(0);

  // Compute sidebar width (must match ChatHistorySidebar)
  const SIDEBAR_WIDTH = Dimensions.get('window').width * 0.85;
  
  // Trigger animation when sidebar state changes
  useEffect(() => {
    if (showHistorySidebar) {
      // Slide chat content right by sidebar width
      chatTranslateX.value = withTiming(SIDEBAR_WIDTH, { duration: 300 });
    } else {
      // Slide chat content back to original position
      chatTranslateX.value = withTiming(0, { duration: 300 });
    }
  }, [showHistorySidebar, chatTranslateX, SIDEBAR_WIDTH]);
  
  const chatAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: chatTranslateX.value }],
  }));

  // Auto-scroll to end when new messages arrive with smooth animation
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flashListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Native gesture handler for double-tap (worklet-optimized)
  const openFloatingChat = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFloatingChatVisible(true);
  }, [setFloatingChatVisible]);

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      'worklet';
      runOnJS(openFloatingChat)();
    });

  // Simple sidebar handlers
  const handleOpenSidebar = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHistorySidebarVisible(true);
  }, [setHistorySidebarVisible]);

  const handleCloseSidebar = useCallback(() => {
    setHistorySidebarVisible(false);
  }, [setHistorySidebarVisible]);

  const handleSessionSelect = useCallback(
    (sessionId: string) => {
      // For now, just close the sidebar - session switching can be implemented later
      // This removes the complex session management that was causing infinite loops
      setHistorySidebarVisible(false);

      // Scroll to top
      setTimeout(() => {
        flashListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    },
    [setHistorySidebarVisible]
  );

  // Note: handleSendMessage is now managed by MorphingTabBar

  const handleQuickReply = useCallback(
    async (text: string) => {
      if (!currentUser || !isSignedIn || !isLoaded) return;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Hide quick replies after first message
      setShowQuickReplies(false);

      // Send user message to main chat
      await sendMainMessage({
        content: text,
        role: 'user',
        sessionId: currentMainSessionId || undefined,
      });

      // Update UI state with Zustand
      setMainChatTyping(true);

      // Simulate AI response
      setTimeout(async () => {
        setMainChatTyping(false);

        // Generate contextual AI response based on user input
        let aiResponseText =
          "I hear you. Let's work through this together. Can you tell me more about what's on your mind?";

        if (
          text.toLowerCase().includes('anxious') ||
          text.toLowerCase().includes('anxiety')
        ) {
          aiResponseText =
            "I understand you're feeling anxious. That can be really challenging. Would you like to try a breathing exercise together, or would you prefer to talk about what's making you feel this way?";
        } else if (
          text.toLowerCase().includes('sad') ||
          text.toLowerCase().includes('depressed')
        ) {
          aiResponseText =
            "I'm sorry you're feeling sad. It's okay to feel this way, and I'm here to support you. Would you like to share what's been weighing on your mind?";
        } else if (text.toLowerCase().includes('mood')) {
          aiResponseText =
            "Tracking your mood is a great step! You can use the Mood tab to log how you're feeling. Would you like me to guide you through it?";
        } else if (text.toLowerCase().includes('exercise')) {
          aiResponseText =
            "Great choice! We have various exercises including breathing techniques, mindfulness, and movement. Check out the Exercises tab, or I can recommend one based on how you're feeling.";
        }

        await sendMainMessage({
          content: aiResponseText,
          role: 'assistant',
          sessionId: currentMainSessionId || undefined,
        });
      }, 2000);
    },
    [
      currentUser,
      sendMainMessage,
      setShowQuickReplies,
      setMainChatTyping,
      currentMainSessionId,
      isSignedIn,
      isLoaded,
    ]
  );

  return (
    <View className="flex-1 bg-[#F2FAF9]">
      <Animated.View style={[chatAnimatedStyle, { flex: 1 }]}>
        <GestureDetector gesture={doubleTapGesture}>
          <Animated.View className="flex-1">
            {/* Floating sidebar button */}
            <Pressable
              onPress={handleOpenSidebar}
              className="absolute top-16 left-4 p-2 z-10"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <SymbolView
                name="line.horizontal.3"
                size={24}
                tintColor="#2D7D6E"
              />
            </Pressable>
            <FlashList
              ref={flashListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={keyExtractor}
              getItemType={getItemType}
              estimatedItemSize={100}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 0,
              }}
              ListHeaderComponent={() => (
                <Animated.View
                  entering={FadeInDown.springify().damping(15).stiffness(150)}
                  layout={LinearTransition.springify()}
                  className="items-center mb-8 mt-4"
                >
                  <View
                    className="w-20 h-20 rounded-full items-center justify-center mb-4"
                    style={{
                      backgroundColor: 'rgba(45, 125, 110, 0.1)',
                      shadowColor: '#2D7D6E',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.15,
                      shadowRadius: 12,
                      elevation: 6,
                    }}
                  >
                    <Text variant="title1" style={{ fontSize: 36 }}>
                      🌱
                    </Text>
                  </View>
                  <Text
                    variant="subhead"
                    className="text-gray-600 text-center px-8"
                    enableRTL={false}
                  >
                    {t('chat.welcomeSubtitle') ||
                      'Your safe space for mental wellness'}
                  </Text>
                </Animated.View>
              )}
              ListFooterComponent={() => (
                <View className="pb-6">
                  {isTyping && <TypingIndicator />}

                  {/* Quick Replies */}
                  {showQuickReplies && messages.length === 1 && (
                    <View className="flex-row flex-wrap mt-4">
                      {getQuickReplies(t).map((reply: any, index: number) => (
                        <QuickReplyButton
                          key={reply.text}
                          text={reply.text}
                          icon={reply.icon}
                          onPress={() => handleQuickReply(reply.text)}
                          delay={index * 100}
                        />
                      ))}
                    </View>
                  )}

                  {/* Padding for tab bar */}
                  <View className="h-52" />
                </View>
              )}
            />
          </Animated.View>
        </GestureDetector>

        {/* Floating Chat */}
        <Suspense fallback={null}>
          <FloatingChat
            visible={showFloatingChat}
            onClose={() => setFloatingChatVisible(false)}
          />
        </Suspense>
      </Animated.View>

      {/* Chat History Sidebar (always mounted for smooth animations) */}
      <ChatHistorySidebar
        visible={showHistorySidebar}
        onClose={handleCloseSidebar}
        onSessionSelect={handleSessionSelect}
        currentSessionId={undefined}
      />
    </View>
  );
}
