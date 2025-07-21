import React, { useState, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { SymbolView } from 'expo-symbols';
import { cn } from '~/lib/cn';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@clerk/clerk-expo';
import { useUserSafe } from '~/lib/useUserSafe';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { router } from 'expo-router';

type HistoryTab = 'main' | 'vent';

interface ChatSession {
  _id: string;
  sessionId: string;
  title: string;
  startedAt: number;
  lastMessageAt: number;
  messageCount: number;
  type: 'main' | 'vent';
}

function ChatHistoryScreen() {
  const [activeTab, setActiveTab] = useState<HistoryTab>('main');
  const { user, isLoaded } = useUserSafe();
  const { isSignedIn } = useAuth();

  // All hooks must be called before any early returns
  const mainSessions = useQuery(
    api.mainChat.getMainSessions,
    isSignedIn && isLoaded ? { limit: 20 } : 'skip'
  );

  const ventSessions = useQuery(
    api.ventChat.getVentSessions,
    isSignedIn && isLoaded ? { limit: 20 } : 'skip'
  );

  const deleteMainSession = useMutation(api.mainChat.deleteMainSession);
  const deleteVentSession = useMutation(api.ventChat.deleteVentSession);

  const handleDeleteSession = useCallback(
    async (sessionId: string, type: 'main' | 'vent') => {
      if (!isSignedIn) return;

      try {
        if (type === 'main') {
          await deleteMainSession({
            sessionId,
          });
        } else {
          await deleteVentSession({
            ventSessionId: sessionId,
          });
        }
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    },
    [isSignedIn, deleteMainSession, deleteVentSession]
  );

  const handleOpenSession = useCallback(
    (sessionId: string, type: 'main' | 'vent') => {
      if (type === 'main') {
        router.push({
          pathname: '/tabs/chat',
          params: { sessionId },
        });
      } else {
        router.push('/tabs/chat');
      }
    },
    []
  );

  const formatDate = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  }, []);

  const SessionCard = useCallback(
    ({ session }: { session: ChatSession }) => (
      <Animated.View
        entering={FadeInDown.springify()}
        className="bg-card border border-border rounded-2xl p-4 mb-3"
      >
        <Pressable
          onPress={() => handleOpenSession(session.sessionId, session.type)}
          className="flex-row items-center"
        >
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              {session.type === 'main' ? (
                <SymbolView
                  name="message.circle"
                  size={18}
                  tintColor="#6F9460"
                />
              ) : (
                <SymbolView name="heart.fill" size={18} tintColor="#EC4899" />
              )}
              <Text variant="body" className="font-medium flex-1">
                {session.title}
              </Text>
            </View>

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <SymbolView name="calendar" size={14} tintColor="#6B7280" />
                <Text variant="muted" className="text-sm">
                  {formatDate(session.lastMessageAt)}
                </Text>
              </View>

              <Text variant="muted" className="text-sm">
                {session.messageCount} messages
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => handleDeleteSession(session.sessionId, session.type)}
            className="ml-3 p-2 rounded-full"
          >
            <SymbolView name="trash" size={16} tintColor="#EF4444" />
          </Pressable>
        </Pressable>
      </Animated.View>
    ),
    [handleOpenSession, handleDeleteSession, formatDate]
  );

  const renderSessionCard = useCallback(
    ({ item }: { item: ChatSession }) => <SessionCard session={item} />,
    [SessionCard]
  );

  const keyExtractor = useCallback((item: ChatSession) => item._id, []);

  const getItemType = useCallback((item: ChatSession) => item.type, []);

  // Show loading state if Clerk hasn't loaded yet
  if (!isLoaded) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 justify-center items-center">
          <Text variant="body" className="text-muted-foreground">
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show sign-in prompt if not authenticated
  if (!isSignedIn || !user) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-1 justify-center items-center">
          <Text variant="body" className="text-muted-foreground">
            Please sign in to continue
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentSessions = activeTab === 'main' ? mainSessions : ventSessions;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-border/20">
        <Pressable onPress={() => router.back()} className="mr-4">
          <SymbolView name="arrow.left" size={24} tintColor="white" />
        </Pressable>
        <Text variant="title2">Chat History</Text>
      </View>

      {/* Tab Selector */}
      <View className="flex-row mx-6 mt-4 mb-6">
        <Pressable
          onPress={() => setActiveTab('main')}
          className={cn(
            'flex-1 flex-row items-center justify-center py-3 rounded-l-xl',
            activeTab === 'main' ? 'bg-primary' : 'bg-secondary/20'
          )}
        >
          <SymbolView
            name="message.circle"
            size={20}
            tintColor={activeTab === 'main' ? 'white' : '#6B7280'}
          />
          <Text
            variant="body"
            className={cn(
              activeTab === 'main'
                ? 'text-primary-foreground font-medium'
                : 'text-muted-foreground'
            )}
          >
            Main Chat
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('vent')}
          className={cn(
            'flex-1 flex-row items-center justify-center py-3 rounded-r-xl',
            activeTab === 'vent' ? 'bg-pink-500' : 'bg-secondary/20'
          )}
        >
          <SymbolView
            name="heart.fill"
            size={20}
            tintColor={activeTab === 'vent' ? 'white' : '#6B7280'}
          />
          <Text
            variant="body"
            className={cn(
              activeTab === 'vent'
                ? 'text-white font-medium'
                : 'text-muted-foreground'
            )}
          >
            Vent History
          </Text>
        </Pressable>
      </View>

      {/* Sessions List */}
      <View className="flex-1 px-6">
        <FlashList
          data={currentSessions || []}
          renderItem={renderSessionCard}
          keyExtractor={keyExtractor}
          getItemType={getItemType}
          estimatedItemSize={100}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View className="flex-1 justify-center items-center py-12">
              <View className="items-center">
                {activeTab === 'main' ? (
                  <SymbolView
                    name="message.circle"
                    size={48}
                    tintColor="#6B7280"
                  />
                ) : (
                  <SymbolView name="heart.fill" size={48} tintColor="#6B7280" />
                )}
                <Text variant="title3" className="text-center mb-2">
                  No {activeTab === 'main' ? 'Chat' : 'Vent'} History
                </Text>
                <Text variant="muted" className="text-center mb-6 max-w-sm">
                  {activeTab === 'main'
                    ? 'Start a conversation in the main chat to see your history here.'
                    : 'Use the floating chat for quick vents to see your history here.'}
                </Text>
                <Button
                  onPress={() => router.push('/tabs/chat')}
                  className="px-6"
                >
                  <Text>
                    Start {activeTab === 'main' ? 'Chatting' : 'Venting'}
                  </Text>
                </Button>
              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

export default ChatHistoryScreen;
