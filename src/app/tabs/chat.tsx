import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { ChatBubble, ChatInput, TypingIndicator, QuickReplyButton, FloatingChat } from '~/components/chat';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MoreVertical } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@clerk/clerk-expo';
import { useUserSafe } from '~/lib/useUserSafe';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
}

const WELCOME_MESSAGE = "Hello! I'm here to support your mental wellness journey. How are you feeling today?";

const QUICK_REPLIES = [
  { text: "I'm feeling anxious", icon: "😟" },
  { text: "I need someone to talk to", icon: "💭" },
  { text: "I want to track my mood", icon: "📊" },
  { text: "Show me exercises", icon: "🧘" },
];

export default function ChatScreen() {
  const { user, isLoaded } = useUserSafe();
  const { isSignedIn } = useAuth();
  const [isTyping, setIsTyping] = useState(false);
  const [showFloatingChat, setShowFloatingChat] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const lastTapRef = useRef(0);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  // Show loading state if Clerk hasn't loaded yet
  if (!isLoaded) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 justify-center items-center">
          <Text variant="body" className="text-muted-foreground">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!isSignedIn || !user) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 justify-center items-center">
          <Text variant="body" className="text-muted-foreground">Please sign in to continue</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Convex hooks
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user ? { clerkId: user.id } : 'skip'
  );
  const convexMessages = useQuery(
    api.messages.getMessages,
    currentUser ? { userId: currentUser._id, limit: 50 } : 'skip'
  );
  const sendMessage = useMutation(api.messages.sendMessage);
  const createUser = useMutation(api.users.createUser);

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
    if (currentUser && convexMessages && convexMessages.length === 0 && isFirstLoad) {
      setIsFirstLoad(false);
      sendMessage({
        userId: currentUser._id,
        content: WELCOME_MESSAGE,
        role: 'assistant',
      });
    }
  }, [currentUser, convexMessages, sendMessage, isFirstLoad]);

  // Transform Convex messages to UI format
  const messages: Message[] = convexMessages?.map(msg => ({
    id: msg._id,
    text: msg.content,
    isUser: msg.role === 'user',
    timestamp: new Date(msg.createdAt).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
  })).reverse() || [];

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setShowFloatingChat(true);
    }
    lastTapRef.current = now;
  }, []);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!currentUser) return;

    // Send user message
    await sendMessage({
      userId: currentUser._id,
      content: text,
      role: 'user',
    });

    setIsTyping(true);

    // Simulate AI response
    setTimeout(async () => {
      setIsTyping(false);
      
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
      
      await sendMessage({
        userId: currentUser._id,
        content: aiResponseText,
        role: 'assistant',
      });
    }, 2000);
  }, [currentUser, sendMessage]);

  const handleQuickReply = useCallback((text: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleSendMessage(text);
  }, [handleSendMessage]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border/20">
        <View className="flex-row items-center">
          <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
          <Text variant="title3">Nafsy AI</Text>
        </View>
        <Pressable className="p-2">
          <MoreVertical size={24} className="text-muted-foreground" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        <Pressable onPress={handleDoubleTap} className="flex-1">
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-4 pt-4"
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {/* Welcome Section */}
            <Animated.View
              entering={FadeInDown.springify()}
              className="items-center mb-8 mt-4"
            >
              <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-4">
                <Text className="text-3xl">🌱</Text>
              </View>
              <Text variant="body" className="text-muted-foreground text-center">
                Your safe space for mental wellness
              </Text>
            </Animated.View>

            {/* Messages */}
            {messages.map((message, index) => (
              <ChatBubble
                key={message.id}
                message={message.text}
                isUser={message.isUser}
                timestamp={message.timestamp}
                index={index}
              />
            ))}

            {isTyping && <TypingIndicator />}

            {/* Quick Replies */}
            {messages.length === 1 && (
              <View className="flex-row flex-wrap mt-4">
                {QUICK_REPLIES.map((reply, index) => (
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
          </ScrollView>
        </Pressable>

        <ChatInput onSendMessage={handleSendMessage} placeholder="How are you feeling?" />
      </KeyboardAvoidingView>

      {/* Floating Chat Modal */}
      <FloatingChat 
        visible={showFloatingChat} 
        onClose={() => setShowFloatingChat(false)} 
      />
    </SafeAreaView>
  );
}