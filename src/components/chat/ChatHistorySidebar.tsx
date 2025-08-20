import React, { useMemo, useState, useCallback } from 'react';
import { View, Pressable, Dimensions, TextInput, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { SessionList } from '~/components/ui/GenericList';
import { SymbolView } from 'expo-symbols';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  SlideInLeft,
  SlideOutLeft,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useUserSafe } from '~/lib/useUserSafe';
import { cn } from '~/lib/cn';
import { User } from 'lucide-react-native';
import { router } from 'expo-router';
import { useColors } from '~/hooks/useColors';
import { useTranslation } from '~/hooks/useTranslation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = SCREEN_WIDTH * 0.8; // 80% of screen width

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
          'rounded-2xl p-4 border',
          isActive
            ? 'bg-[#2F6A8D]/10 border-[#2F6A8D]/30'
            : 'bg-black/[0.03] dark:bg-white/[0.04] border-border/10'
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
            <View className="w-3 h-3 rounded-full me-3 bg-brand-dark-blue" />
            <Text
              variant="subhead"
              className={cn(
                'font-semibold flex-1',
                isActive ? 'text-[#2F6A8D]' : 'text-foreground'
              )}
              numberOfLines={1}
            >
              {session.title || t('chat.history.untitledSession')}
            </Text>
          </View>

          <Pressable
            onPress={onDelete}
            className="p-2 ms-2"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <SymbolView name="trash" size={16} tintColor="#9CA3AF" />
          </Pressable>
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <SymbolView name="bubble.left" size={14} tintColor="#9CA3AF" />
            <Text variant="caption1" className="text-muted-foreground ms-1">
              {`${session.messageCount ?? 0} ${t('chat.messages')}`}
            </Text>
          </View>

          <Text variant="caption1" className="text-muted-foreground">
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
  const colors = useColors();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const insets = useSafeAreaInsets();
  const [skipExitAnimation, setSkipExitAnimation] = useState(false);

  const handleSettingsPress = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    // Skip any sidebar exit animation and close immediately when navigating
    setSkipExitAnimation(true);
    router.push('/settings');
    onClose();
  }, [onClose]);

  // Simpler push-in/out animations using Reanimated presets
  const ANIM_DURATION = 250;
  const [modalVisible, setModalVisible] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      setSkipExitAnimation(false);
      setModalVisible(true);
    } else {
      if (skipExitAnimation) {
        // Close immediately without exit animation
        setModalVisible(false);
      } else {
        const timeout = setTimeout(() => setModalVisible(false), ANIM_DURATION);
        return () => clearTimeout(timeout);
      }
    }
  }, [visible, skipExitAnimation]);

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

  // Use Modal to ensure sidebar renders above navigation bar
  return (
    <Modal
      visible={modalVisible}
      transparent={true}
      animationType="none" // We handle animation ourselves
      statusBarTranslucent={true}
    >
      <View style={{ flex: 1 }}>
        {visible && (
          <>
            {/* Backdrop */}
            <GestureDetector gesture={backdropTapGesture}>
              {(() => {
                const BackdropComponent: any = skipExitAnimation
                  ? View
                  : Animated.View;
                const animationProps = skipExitAnimation
                  ? {}
                  : {
                      entering: FadeIn.duration(ANIM_DURATION),
                      exiting: FadeOut.duration(ANIM_DURATION),
                    };
                return (
                  <BackdropComponent
                    className="bg-black/50"
                    {...(animationProps as any)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }}
                  />
                );
              })()}
            </GestureDetector>

            {/* Sidebar */}
            {(() => {
              const SidebarComponent: any = skipExitAnimation
                ? View
                : Animated.View;
              const animationProps = skipExitAnimation
                ? {}
                : {
                    entering: SlideInLeft.duration(ANIM_DURATION),
                    exiting: SlideOutLeft.duration(ANIM_DURATION),
                  };
              return (
                <SidebarComponent
                  className="bg-background"
                  {...(animationProps as any)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    start: 0, // React Native automatically handles RTL positioning
                    width: SIDEBAR_WIDTH,
                    shadowColor: '#000000',
                    shadowOffset: { width: 2, height: 0 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    elevation: 20, // Higher than navigation bar
                    zIndex: 1001, // Ensure sidebar appears above everything
                    borderTopEndRadius: 25, // RN automatically flips for RTL
                    borderBottomEndRadius: 25,
                  }}
                >
                  <View className="flex-1" style={{ paddingTop: insets.top }}>
                    {/* Header and Search */}
                    <View className="p-4 border-b border-border/10">
                      <View className="flex-row items-center justify-between mb-3">
                        <Text
                          variant="title3"
                          className="font-bold text-foreground"
                        >
                          {t('chat.history.title')}
                        </Text>
                        <Pressable
                          onPress={handleSettingsPress}
                          className="w-10 h-10 items-center justify-center rounded-full bg-black/[0.05] dark:bg-white/[0.05]"
                        >
                          <User size={20} color={colors.foreground} />
                        </Pressable>
                      </View>
                      <View className="flex-row items-center rounded-xl px-4 py-3 bg-black/[0.03] dark:bg-white/[0.04] border border-border/10">
                        <SymbolView
                          name="magnifyingglass"
                          size={18}
                          tintColor="#9CA3AF"
                        />
                        <TextInput
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          placeholder={t('common.search')}
                          placeholderTextColor="#9CA3AF"
                          className="flex-1 ms-3 text-base text-foreground"
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
                          ? t('chat.history.noSearchResults')
                          : t('chat.history.noMainSessions');
                        const iconName = hasSearchQuery
                          ? 'magnifyingglass'
                          : 'bubble.left';

                        return (
                          <View className="flex-1 items-center justify-center py-12">
                            <View className="w-16 h-16 rounded-full items-center justify-center mb-4 bg-black/[0.05] dark:bg-white/[0.06]">
                              <SymbolView
                                name={iconName}
                                size={24}
                                tintColor="#9CA3AF"
                              />
                            </View>
                            <Text
                              variant="subhead"
                              className="text-muted-foreground text-center px-6"
                            >
                              {emptyMessage}
                            </Text>
                            {hasSearchQuery && (
                              <Pressable
                                onPress={() => setSearchQuery('')}
                                className="mt-4 px-4 py-2 rounded-full bg-black/[0.05] dark:bg-white/[0.06]"
                              >
                                <Text
                                  variant="caption1"
                                  className="text-muted-foreground"
                                >
                                  {t('chat.history.clearSearch')}
                                </Text>
                              </Pressable>
                            )}
                          </View>
                        );
                      }}
                    />
                  </View>
                </SidebarComponent>
              );
            })()}
          </>
        )}
      </View>
    </Modal>
  );
}
