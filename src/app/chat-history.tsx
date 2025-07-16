import React, { useState } from 'react';
import { View, ScrollView, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { ArrowLeft, MessageCircle, Heart, Calendar, Trash2 } from 'lucide-react-native';
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
  
  const mainSessions = useQuery(
    api.mainChat.getMainSessions,
    currentUser ? { userId: currentUser._id, limit: 20 } : 'skip'
  );
  
  const ventSessions = useQuery(
    api.ventChat.getVentSessions,
    currentUser ? { userId: currentUser._id, limit: 20 } : 'skip'
  );

  const deleteMainSession = useMutation(api.mainChat.deleteMainSession);
  const deleteVentSession = useMutation(api.ventChat.deleteVentSession);

  const handleDeleteSession = async (sessionId: string, type: 'main' | 'vent') => {
    if (!currentUser) return;
    
    try {
      if (type === 'main') {
        await deleteMainSession({
          userId: currentUser._id,
          sessionId,
        });
      } else {
        await deleteVentSession({
          userId: currentUser._id,
          ventSessionId: sessionId,
        });
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleOpenSession = (sessionId: string, type: 'main' | 'vent') => {
    // Navigate to chat with specific session
    if (type === 'main') {
      router.push({
        pathname: '/tabs/chat',
        params: { sessionId }
      });
    } else {
      // For vent sessions, we could open a dedicated vent chat view
      // For now, just show the floating chat
      router.push('/tabs/chat');
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const SessionCard = ({ session }: { session: ChatSession }) => (
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
              <MessageCircle size={18} className="text-primary mr-2" />
            ) : (
              <Heart size={18} className="text-pink-500 mr-2" />
            )}
            <Text variant="body" className="font-medium flex-1">
              {session.title}
            </Text>
          </View>
          
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Calendar size={14} className="text-muted-foreground mr-1" />
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
          <Trash2 size={16} className="text-destructive" />
        </Pressable>
      </Pressable>
    </Animated.View>
  );

  const currentSessions = activeTab === 'main' ? mainSessions : ventSessions;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-border/20">
        <Pressable onPress={() => router.back()} className="mr-4">
          <ArrowLeft size={24} color="white" />
        </Pressable>
        <Text variant="title2">Chat History</Text>
      </View>

      {/* Tab Selector */}
      <View className="flex-row mx-6 mt-4 mb-6">
        <Pressable
          onPress={() => setActiveTab('main')}
          className={cn(
            'flex-1 flex-row items-center justify-center py-3 rounded-l-xl',
            activeTab === 'main'
              ? 'bg-primary'
              : 'bg-secondary/20'
          )}
        >
          <MessageCircle
            size={20}
            className={cn(
              'mr-2',
              activeTab === 'main'
                ? 'text-primary-foreground'
                : 'text-muted-foreground'
            )}
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
            activeTab === 'vent'
              ? 'bg-pink-500'
              : 'bg-secondary/20'
          )}
        >
          <Heart
            size={20}
            className={cn(
              'mr-2',
              activeTab === 'vent'
                ? 'text-white'
                : 'text-muted-foreground'
            )}
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
      <ScrollView className="flex-1 px-6">
        {currentSessions && currentSessions.length > 0 ? (
          currentSessions.map((session) => (
            <SessionCard key={session._id} session={session} />
          ))
        ) : (
          <View className="flex-1 justify-center items-center py-12">
            <View className="items-center">
              {activeTab === 'main' ? (
                <MessageCircle size={48} className="text-muted-foreground mb-4" />
              ) : (
                <Heart size={48} className="text-muted-foreground mb-4" />
              )}
              <Text variant="title3" className="text-center mb-2">
                No {activeTab === 'main' ? 'Chat' : 'Vent'} History
              </Text>
              <Text variant="muted" className="text-center mb-6 max-w-sm">
                {activeTab === 'main' 
                  ? 'Start a conversation in the main chat to see your history here.'
                  : 'Use the floating chat for quick vents to see your history here.'
                }
              </Text>
              <Button
                onPress={() => router.push('/tabs/chat')}
                className="px-6"
              >
                <Text>Start {activeTab === 'main' ? 'Chatting' : 'Venting'}</Text>
              </Button>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default ChatHistoryScreen;