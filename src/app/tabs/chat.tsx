import React, { useRef, useCallback, useEffect, Suspense } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Pressable, ActivityIndicator } from 'react-native';
import { TapGestureHandler, State } from 'react-native-gesture-handler';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { ChatBubble, ChatInput, TypingIndicator, QuickReplyButton, FloatingChat } from '~/components/chat';
import Animated, { FadeInDown, useAnimatedGestureHandler, runOnJS, LinearTransition } from 'react-native-reanimated';
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
  useChatUIStore 
} from '~/store';
import { useTranslation } from '~/hooks/useTranslation';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
}

const getWelcomeMessage = (t: any) => t('chat.welcomeMessage');

const getQuickReplies = (t: any) => [
  { text: t('chat.quickReplies.anxious'), icon: "😟" },
  { text: t('chat.quickReplies.needTalk'), icon: "💭" },
  { text: t('chat.quickReplies.trackMood'), icon: "📊" },
  { text: t('chat.quickReplies.showExercises'), icon: "🧘" },
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
  const { 
    setFloatingChatVisible, 
    setMainChatTyping,
    setShowQuickReplies 
  } = useChatUIStore();
  
  const flashListRef = useRef<FlashList<Message>>(null);
  const doubleTapRef = useRef<TapGestureHandler>(null);

  // Convex hooks
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user && isSignedIn ? { clerkId: user.id } : 'skip'
  );
  const mainChatMessages = useQuery(
    api.mainChat.getMainChatMessages,
    currentUser ? { userId: currentUser._id, limit: 50 } : 'skip'
  );
  const sendMainMessage = useMutation(api.mainChat.sendMainMessage);
  const createUser = useMutation(api.users.createUser);
  const currentMainSessionId = useQuery(
    api.mainChat.getCurrentMainSessionId,
    currentUser ? { userId: currentUser._id } : 'skip'
  );

  // ===== EARLY RETURNS AFTER ALL HOOKS =====
  // Show loading state if Clerk hasn't loaded yet
  if (!isLoaded) {
    return (
      <SafeAreaView className="flex-1 bg-[#F2FAF9]" edges={['top']}>
        <View className="flex-1 justify-center items-center">
          <Text variant="body" className="text-muted-foreground">{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!isSignedIn || !user) {
    return (
      <SafeAreaView className="flex-1 bg-[#F2FAF9]" edges={['top']}>
        <View className="flex-1 justify-center items-center">
          <Text variant="body" className="text-muted-foreground">{t('common.pleaseSignIn')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Create user if doesn't exist
  useEffect(() => {
    if (user && currentUser === null) {
      createUser({
        clerkId: user.id,
        email: user.emailAddresses?.[0]?.emailAddress || '',
        name: user.fullName || user.firstName || undefined,
        avatarUrl: user.imageUrl || undefined,
      });
    }
  }, [user, currentUser, createUser]);

  // Send welcome message on first load
  useEffect(() => {
    if (currentUser && mainChatMessages && mainChatMessages.length === 0) {
      sendMainMessage({
        userId: currentUser._id,
        content: getWelcomeMessage(t),
        role: 'assistant',
        sessionId: currentMainSessionId || undefined,
      });
    }
  }, [currentUser, mainChatMessages, sendMainMessage, currentMainSessionId]);

  // Transform Convex main chat messages to UI format
  const messages: Message[] = mainChatMessages?.map(msg => ({
    id: msg._id,
    text: msg.content,
    isUser: msg.role === 'user',
    timestamp: new Date(msg.createdAt).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
  })).reverse() || [];

  // FlashList render functions
  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => (
    <ChatBubble
      message={item.text}
      isUser={item.isUser}
      timestamp={item.timestamp}
      index={index}
    />
  ), []);

  const keyExtractor = useCallback((item: Message) => item.id, []);

  const getItemType = useCallback((item: Message) => item.isUser ? 'user' : 'assistant', []);

  // Auto-scroll to end when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      flashListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  // Native gesture handler for double-tap (worklet-optimized)
  const openFloatingChat = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFloatingChatVisible(true);
  }, [setFloatingChatVisible]);

  const doubleTapGestureHandler = useAnimatedGestureHandler({
    onEnd: () => {
      'worklet';
      runOnJS(openFloatingChat)();
    },
  });

  const handleSendMessage = useCallback(async (text: string) => {
    if (!currentUser) return;

    // Hide quick replies after first message
    setShowQuickReplies(false);

    // Send user message to main chat
    await sendMainMessage({
      userId: currentUser._id,
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
      let aiResponseText = "I hear you. Let's work through this together. Can you tell me more about what's on your mind?";
      
      if (text.toLowerCase().includes('anxious') || text.toLowerCase().includes('anxiety')) {
        aiResponseText = "I understand you're feeling anxious. That can be really challenging. Would you like to try a breathing exercise together, or would you prefer to talk about what's making you feel this way?";
      } else if (text.toLowerCase().includes('sad') || text.toLowerCase().includes('depressed')) {
        aiResponseText = "I'm sorry you're feeling sad. It's okay to feel this way, and I'm here to support you. Would you like to share what's been weighing on your mind?";
      } else if (text.toLowerCase().includes('mood')) {
        aiResponseText = "Tracking your mood is a great step! You can use the Mood tab to log how you're feeling. Would you like me to guide you through it?";
      } else if (text.toLowerCase().includes('exercise')) {
        aiResponseText = "Great choice! We have various exercises including breathing techniques, mindfulness, and movement. Check out the Exercises tab, or I can recommend one based on how you're feeling.";
      }
      
      await sendMainMessage({
        userId: currentUser._id,
        content: aiResponseText,
        role: 'assistant',
        sessionId: currentMainSessionId || undefined,
      });
    }, 2000);
  }, [currentUser, sendMainMessage, setShowQuickReplies, setMainChatTyping, currentMainSessionId]);

  const handleQuickReply = useCallback((text: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleSendMessage(text);
  }, [handleSendMessage]);

  return (
    <SafeAreaView className="flex-1 bg-[#F2FAF9]" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-2 pb-4">
          <View className="flex-row items-center">
            <Pressable className="mr-2 p-2">
              <SymbolView name="chevron.left" size={24} tintColor="#2D7D6E" />
            </Pressable>
          </View>
          <Pressable className="p-2">
            <SymbolView name="message.circle" size={24} tintColor="#2D7D6E" />
          </Pressable>
        </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        <View className="flex-1 px-6">
          <TapGestureHandler
            ref={doubleTapRef}
            numberOfTaps={2}
            onGestureEvent={doubleTapGestureHandler}
          >
            <Animated.View style={{ flex: 1 }}>
              <FlashList
                ref={flashListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={keyExtractor}
                getItemType={getItemType}
                estimatedItemSize={80}
                showsVerticalScrollIndicator={false}
            ListHeaderComponent={() => (
              <Animated.View
                entering={FadeInDown.springify()}
                layout={LinearTransition.springify()}
                className="items-center mb-8 mt-4"
              >
                <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-4">
                  <Text 
                    variant="title2" 
                    enableRTL={false}
                  >🌱</Text>
                </View>
                <Text 
                  variant="subhead" 
                  className="text-muted-foreground text-center" 
                  enableRTL={false}
                >
                  {t('chat.welcomeSubtitle')}
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
              </View>
            )}
              />
            </Animated.View>
          </TapGestureHandler>
        </View>

        <View className="px-4">
          <ChatInput onSendMessage={handleSendMessage} placeholder={t('chat.typingPlaceholder')} />
        </View>
      </KeyboardAvoidingView>

      {/* Floating Chat Modal */}
      <Suspense fallback={null}>
        <FloatingChat 
          visible={showFloatingChat} 
          onClose={() => setFloatingChatVisible(false)} 
        />
      </Suspense>
    </SafeAreaView>
  );
}