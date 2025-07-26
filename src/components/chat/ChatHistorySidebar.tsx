import React, { useMemo, useState } from 'react';
import { View, Pressable, Dimensions, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { SessionList } from '~/components/ui/GenericList';
import { SymbolView } from 'expo-symbols';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useUserSafe } from '~/lib/useUserSafe';
import { useTranslation } from '~/hooks/useTranslation';
import { cn } from '~/lib/cn';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.85; // 85% of screen width

interface ChatHistorySidebarProps {
  visible: boolean;
  onClose: () => void;
  onSessionSelect: (sessionId: string) => void;
  currentSessionId?: string;
}

interface SessionItemProps {
  session: any;
  isActive: boolean;
  onPress: () => void;
  onDelete: () => void;
}

const SessionItem = ({
  session,
  isActive,
  onPress,
  onDelete,
}: SessionItemProps) => {
  const { t } = useTranslation();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 12, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 400 });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } else if (diffDays === 1) {
      return t('common.yesterday');
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  return (
    <Animated.View style={animatedStyle} className="mx-4 mb-3">
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={cn(
          'rounded-2xl p-4 border-2',
          isActive
            ? 'bg-[#2D7D6E]/10 border-[#2D7D6E]/30'
            : 'bg-white border-gray-100'
        )}
        style={{
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center flex-1">
            <View className="w-3 h-3 rounded-full mr-3 bg-[#2D7D6E]" />
            <Text
              variant="subhead"
              className={cn(
                'font-semibold flex-1',
                isActive ? 'text-[#2D7D6E]' : 'text-gray-800'
              )}
              numberOfLines={1}
            >
              {session.title || t('chat.history.untitledSession')}
            </Text>
          </View>

          <Pressable
            onPress={onDelete}
            className="p-2 ml-2"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <SymbolView name="trash" size={16} tintColor="#9CA3AF" />
          </Pressable>
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <SymbolView name="bubble.left" size={14} tintColor="#9CA3AF" />
            <Text variant="caption1" className="text-gray-500 ml-1">
              {`${session.messageCount ?? 0} ${t('chat.messages') || 'messages'}`}
            </Text>
          </View>

          <Text variant="caption1" className="text-gray-400">
            {formatDate(
              session.lastMessageAt ||
                session.startedAt ||
                new Date().toISOString()
            )}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export function ChatHistorySidebar({
  visible,
  onClose,
  onSessionSelect,
  currentSessionId,
}: ChatHistorySidebarProps) {
  const { user } = useUserSafe();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  // Simple sidebar slide animation
  const sidebarTranslateX = useSharedValue(-SIDEBAR_WIDTH);
  const backdropOpacity = useSharedValue(0);

  const sidebarStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sidebarTranslateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // Trigger animations when visible prop changes
  React.useEffect(() => {
    if (visible) {
      // Slide sidebar in from left
      sidebarTranslateX.value = withTiming(0, { duration: 300 });
      // Fade backdrop in
      backdropOpacity.value = withTiming(0.5, { duration: 300 });
    } else {
      // Slide sidebar out to left
      sidebarTranslateX.value = withTiming(-SIDEBAR_WIDTH, { duration: 300 });
      // Fade backdrop out
      backdropOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [visible, sidebarTranslateX, backdropOpacity]);

  // Convex queries
  const mainSessions = useQuery(
    api.mainChat.getMainSessions,
    user ? {} : 'skip'
  );

  // Mutations
  const deleteMainSession = useMutation(api.mainChat.deleteMainSession);

  // Clean slate - no animations yet

  const currentSessions = useMemo(() => {
    const sessions = mainSessions || [];
    const validSessions = Array.isArray(sessions) ? sessions : [];

    // Filter sessions based on search query
    if (!searchQuery.trim()) {
      return validSessions;
    }

    return validSessions.filter((session) =>
      session.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [mainSessions, searchQuery]);

  const handleSessionSelect = (sessionId: string) => {
    impactAsync(ImpactFeedbackStyle.Light);
    onSessionSelect(sessionId);
    onClose();
  };

  const handleSessionDelete = async (sessionId: string) => {
    try {
      impactAsync(ImpactFeedbackStyle.Medium);
      await deleteMainSession({ sessionId });
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  // Simple tap gesture to close sidebar
  const backdropTapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(onClose)();
  });

  // We keep the component mounted at all times to allow smooth exit animations.
  // Disable interactions when not visible.
  return (
    <View
      pointerEvents={visible ? 'auto' : 'none'}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
      }}
    >
      {/* Backdrop */}
      <GestureDetector gesture={backdropTapGesture}>
        <Animated.View
          style={[
            backdropStyle,
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'black',
            },
          ]}
        />
      </GestureDetector>

      {/* Sidebar */}
      <Animated.View
        style={[
          sidebarStyle,
          {
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: SIDEBAR_WIDTH,
            backgroundColor: '#F2FAF9',
            borderTopRightRadius: 25,
            borderBottomRightRadius: 25,
            shadowColor: '#000000',
            shadowOffset: { width: 2, height: 0 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 8,
          },
        ]}
      >
        <SafeAreaView className="flex-1" edges={['top', 'left']}>
          {/* Header and Search */}
          <View className="p-4 border-b border-gray-100">
            <Text variant="title3" className="text-gray-800 font-bold mb-3">
              History
            </Text>
            <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3">
              <SymbolView
                name="magnifyingglass"
                size={18}
                tintColor="#9CA3AF"
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search"
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-3 text-gray-800 text-base"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => setSearchQuery('')}
                  className="p-1"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <SymbolView
                    name="xmark.circle.fill"
                    size={16}
                    tintColor="#9CA3AF"
                  />
                </Pressable>
              )}
            </View>
          </View>

          {/* Sessions List */}
          <SessionList
            data={currentSessions}
            keyExtractor={(item) => item._id}
            renderItem={(item, _index) => {
              const sessionId = item.sessionId;
              const isActive = currentSessionId === sessionId;

              return (
                <SessionItem
                  session={item}
                  isActive={isActive}
                  onPress={() => {
                    if (sessionId) handleSessionSelect(sessionId);
                  }}
                  onDelete={() => {
                    if (sessionId) handleSessionDelete(sessionId);
                  }}
                />
              );
            }}
            emptyComponent={() => {
              const hasSearchQuery = searchQuery.trim().length > 0;
              const emptyMessage = hasSearchQuery
                ? t('chat.search.noResults') ||
                  'No conversations match your search'
                : t('chat.history.noMainSessions') || 'No chat sessions yet';
              const iconName = hasSearchQuery
                ? 'magnifyingglass'
                : 'bubble.left';

              return (
                <View className="flex-1 items-center justify-center py-12">
                  <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
                    <SymbolView name={iconName} size={24} tintColor="#9CA3AF" />
                  </View>
                  <Text
                    variant="subhead"
                    className="text-gray-500 text-center px-6"
                  >
                    {emptyMessage}
                  </Text>
                  {hasSearchQuery && (
                    <Pressable
                      onPress={() => setSearchQuery('')}
                      className="mt-4 px-4 py-2 bg-gray-100 rounded-full"
                    >
                      <Text variant="caption1" className="text-gray-600">
                        {t('chat.search.clearSearch') || 'Clear search'}
                      </Text>
                    </Pressable>
                  )}
                </View>
              );
            }}
          />
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}
