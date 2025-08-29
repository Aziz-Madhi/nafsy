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
import { ChatType } from '~/store/useChatUIStore';
import { getChatTypeIcon, getChatTypeColor } from './ChatTypeToggle';
import { getChatStyles } from '~/lib/chatStyles';
import { ChatHistoryToggle } from './ChatHistoryToggle';
import { useCurrentLanguage } from '~/store/useAppStore';

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
  chatType: ChatType;
  isActive: boolean;
  onPress: () => void;
  onDelete: () => void;
}

const SessionItem = ({
  session,
  chatType,
  isActive,
  onPress,
  onDelete,
}: SessionItemProps) => {
  const { t } = useTranslation();
  const lang = useCurrentLanguage();
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const styles = getChatStyles(chatType);
  const typeColor = getChatTypeColor(chatType);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: translateX.value }],
  }));

  const deleteButtonStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < -50 ? 1 : 0,
    transform: [{ translateX: translateX.value + 80 }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 12, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 400 });
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only allow swipe to left (negative X)
      if (event.translationX < 0) {
        translateX.value = Math.max(event.translationX, -80);
      }
    })
    .onEnd((event) => {
      if (event.translationX < -50) {
        // Snap to reveal delete button
        translateX.value = withSpring(-80);
        runOnJS(impactAsync)(ImpactFeedbackStyle.Light);
      } else {
        // Snap back to original position
        translateX.value = withSpring(0);
      }
    });

  // Localize default English titles for Arabic UI
  const rawTitle: string = session.title || t('chat.history.untitledSession');
  const localizedTitle: string = (() => {
    if (lang === 'ar') {
      const lower = rawTitle.toLowerCase();
      if (lower.includes('therapy session')) return 'جلسة علاجية';
      if (lower.includes('check-in')) return 'تسجيل يومي';
      if (lower.includes('quick vent')) return 'تنفيس سريع';
    }
    return rawTitle;
  })();

  return (
    <View className="mx-4 mb-3 relative">
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedStyle}>
          <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            className={cn(
              'rounded-2xl p-4 border-l-4',
              isActive
                ? [
                    `${styles.borderColorClass}`,
                    'bg-black/[0.05] dark:bg-white/[0.08] border-border/20',
                  ]
                : [
                    'border-l-transparent',
                    'bg-black/[0.03] dark:bg-white/[0.04] border-border/10',
                  ]
            )}
            style={{
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 3,
              borderLeftColor: isActive ? typeColor : 'transparent',
              borderLeftWidth: 4,
            }}
          >
            <Text
              variant="subhead"
              className={cn(
                'font-semibold',
                isActive ? styles.accentClass : 'text-foreground'
              )}
              numberOfLines={1}
            >
              {localizedTitle}
            </Text>
          </Pressable>
        </Animated.View>
      </GestureDetector>

      {/* Delete button that appears on swipe */}
      <Animated.View
        style={[deleteButtonStyle]}
        className="absolute right-0 top-0 bottom-0 w-20 justify-center items-center"
      >
        <Pressable
          onPress={() => {
            translateX.value = withSpring(0);
            onDelete();
          }}
          className="w-12 h-12 bg-red-500 rounded-full items-center justify-center"
        >
          <SymbolView name="trash" size={20} tintColor="white" />
        </Pressable>
      </Animated.View>
    </View>
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
  const currentLanguage = useCurrentLanguage();
  const isArabic = currentLanguage === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeHistoryType, setActiveHistoryType] = useState<ChatType>('coach');
  const insets = useSafeAreaInsets();
  const [skipExitAnimation, setSkipExitAnimation] = useState(false);

  const getDateGroup = useCallback(
    (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return { group: 'today', label: t('common.today'), sortOrder: 0 };
      } else if (diffDays < 7) {
        return {
          group: 'thisWeek',
          label: t('chat.history.thisWeek'),
          sortOrder: 1,
        };
      } else {
        const daysAgoLabel = t('chat.history.daysAgo', { count: diffDays });
        return {
          group: `${diffDays}daysAgo`,
          label: daysAgoLabel,
          sortOrder: diffDays,
        };
      }
    },
    [t]
  );

  const groupSessionsByDate = useCallback(
    (sessions: any[]) => {
      if (!sessions || sessions.length === 0) return [];

      // Group sessions by date periods
      const groups: Record<
        string,
        { label: string; sessions: any[]; sortOrder: number }
      > = {};

      sessions.forEach((session) => {
        const dateInfo = getDateGroup(
          session.lastMessageAt || session.startedAt || new Date().toISOString()
        );

        if (!groups[dateInfo.group]) {
          groups[dateInfo.group] = {
            label: dateInfo.label,
            sessions: [],
            sortOrder: dateInfo.sortOrder,
          };
        }
        groups[dateInfo.group].sessions.push(session);
      });

      // Sort groups by sortOrder (Today first, then This week, then by days ago)
      return Object.values(groups).sort((a, b) => a.sortOrder - b.sortOrder);
    },
    [getDateGroup]
  );

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

  // Convex queries - only for coach and companion (event sessions are not stored)
  const coachSessions = useQuery(
    api.mainChat.getMainSessions,
    user ? {} : 'skip'
  );
  // Event sessions are not stored or shown in history - overlay only
  const companionSessions = useQuery(
    api.companionChat.getCompanionChatSessions,
    user ? {} : 'skip'
  );

  // Mutations - only for coach and companion (no event sessions to delete)
  const deleteCoachSession = useMutation(api.mainChat.deleteMainSession);
  const deleteCompanionSession = useMutation(
    api.companionChat.deleteCompanionChatSession
  );

  // Clean slate - no animations yet

  const groupedSessions = useMemo(() => {
    // Get sessions for the active history type only
    let sessions: any[] = [];

    if (activeHistoryType === 'coach') {
      sessions = Array.isArray(coachSessions) ? coachSessions : [];
    } else if (activeHistoryType === 'companion') {
      sessions = Array.isArray(companionSessions) ? companionSessions : [];
    }
    // Event sessions are not stored - they're overlay-only and private

    // Filter sessions based on search query
    if (searchQuery.trim()) {
      sessions = sessions.filter((session) =>
        session.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Group sessions by date periods
    return groupSessionsByDate(sessions);
  }, [
    coachSessions,
    companionSessions,
    searchQuery,
    activeHistoryType,
    groupSessionsByDate,
  ]);

  const handleSessionSelect = (sessionId: string) => {
    impactAsync(ImpactFeedbackStyle.Light);
    onSessionSelect(sessionId);
    onClose();
  };

  const handleSessionDelete = async (sessionId: string, chatType: ChatType) => {
    try {
      impactAsync(ImpactFeedbackStyle.Medium);
      if (chatType === 'coach') {
        await deleteCoachSession({ sessionId });
      } else if (chatType === 'companion') {
        await deleteCompanionSession({ sessionId });
      }
      // Event sessions don't exist in backend, so no deletion needed
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
                        {isArabic ? (
                          <>
                            {/* Settings icon on the left for Arabic */}
                            <Pressable
                              onPress={handleSettingsPress}
                              className="w-10 h-10 items-center justify-center rounded-full bg-black/[0.05] dark:bg-white/[0.05]"
                            >
                              <User size={20} color={colors.foreground} />
                            </Pressable>
                            <Text
                              variant="title3"
                              className="font-bold text-foreground"
                            >
                              {t('chat.history.title')}
                            </Text>
                          </>
                        ) : (
                          <>
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
                          </>
                        )}
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
                          className={cn(
                            'flex-1 ms-3 text-base text-foreground',
                            isArabic && 'text-right'
                          )}
                          autoCapitalize="none"
                          autoCorrect={false}
                          // Arabic should type RTL
                          style={
                            isArabic
                              ? { writingDirection: 'rtl', textAlign: 'right' }
                              : undefined
                          }
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

                    {/* History Type Toggle */}
                    <ChatHistoryToggle
                      activeType={activeHistoryType}
                      onTypeChange={setActiveHistoryType}
                    />

                    {/* Sessions List */}
                    <SessionList
                      data={groupedSessions}
                      keyExtractor={(item) => `date-${item.label}`}
                      renderItem={(dateGroup, _index) => {
                        return (
                          <View key={`date-${dateGroup.label}-section`}>
                            {/* Date Section Header */}
                            <View className="px-4 py-3 mb-2">
                              <Text
                                variant="subhead"
                                className="font-semibold text-foreground/80"
                              >
                                {dateGroup.label}
                              </Text>
                            </View>

                            {/* Sessions for this date group */}
                            {dateGroup.sessions.map((session) => {
                              const sessionId = session.sessionId;
                              const isActive = currentSessionId === sessionId;

                              return (
                                <SessionItem
                                  key={session._id}
                                  session={session}
                                  chatType={activeHistoryType}
                                  isActive={isActive}
                                  onPress={() => {
                                    if (sessionId)
                                      handleSessionSelect(sessionId);
                                  }}
                                  onDelete={() => {
                                    if (sessionId)
                                      handleSessionDelete(
                                        sessionId,
                                        activeHistoryType
                                      );
                                  }}
                                />
                              );
                            })}
                          </View>
                        );
                      }}
                      emptyComponent={() => {
                        const hasSearchQuery = searchQuery.trim().length > 0;
                        let emptyMessage: string;

                        if (hasSearchQuery) {
                          emptyMessage = t('chat.history.noSearchResults');
                        } else if (activeHistoryType === 'coach') {
                          emptyMessage = t('chat.history.noCoachSessions');
                        } else if (activeHistoryType === 'companion') {
                          emptyMessage = t('chat.history.noCompanionSessions');
                        } else {
                          emptyMessage = t('chat.history.noMainSessions');
                        }

                        const iconName = hasSearchQuery
                          ? 'magnifyingglass'
                          : getChatTypeIcon(activeHistoryType);

                        return (
                          <View className="flex-1 items-center justify-center py-12">
                            <View className="w-16 h-16 rounded-full items-center justify-center mb-4 bg-black/[0.05] dark:bg-white/[0.06]">
                              <SymbolView
                                name={iconName as any}
                                size={24}
                                tintColor={
                                  hasSearchQuery
                                    ? '#9CA3AF'
                                    : getChatTypeColor(activeHistoryType)
                                }
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
