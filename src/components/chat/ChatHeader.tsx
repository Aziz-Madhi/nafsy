/**
 * Chat Header Component
 * Contains the sidebar toggle button, personality text, and personality toggle
 */

import React, { memo } from 'react';
import { Pressable, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useColors } from '~/hooks/useColors';
import { Text } from '~/components/ui/text';
import { useTranslation } from '~/hooks/useTranslation';
import { ChatType } from '~/store/useChatUIStore';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface ChatHeaderProps {
  onOpenSidebar: () => void;
  activeChatType: ChatType;
  onChatTypeChange?: (type: ChatType) => void;
}

interface PersonalityMessage {
  type: ChatType;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
}

const personalityMessages: PersonalityMessage[] = [
  {
    type: 'coach',
    title: 'Professional Therapy',
    titleAr: 'العلاج المهني',
    subtitle: 'Your safe space for mental wellness',
    subtitleAr: 'مساحتك الآمنة للعافية النفسية',
  },
  {
    type: 'event',
    title: 'Quick Release',
    titleAr: 'إطلاق سريع',
    subtitle: 'Let it out, feel better instantly',
    subtitleAr: 'أطلق العنان، اشعر بتحسن فوري',
  },
  {
    type: 'companion',
    title: 'Daily Check-in',
    titleAr: 'تسجيل يومي',
    subtitle: 'Your friendly companion is here',
    subtitleAr: 'رفيقك الودود هنا',
  },
];

export const ChatHeader = memo(function ChatHeader({
  onOpenSidebar,
  activeChatType,
  onChatTypeChange,
}: ChatHeaderProps) {
  const colors = useColors();
  const { i18n } = useTranslation();
  const isDarkMode = colors.background === '#0A1514';
  const isArabic = i18n.language === 'ar';

  const message =
    personalityMessages.find((m) => m.type === activeChatType) ||
    personalityMessages[0];

  // Only handle coach and companion types for the toggle
  // Event personality is overlay-only and not part of regular chat toggle
  const handleToggle = () => {
    if (onChatTypeChange) {
      const newType = activeChatType === 'coach' ? 'companion' : 'coach';
      onChatTypeChange(newType);
    }
  };

  return (
    <View className="flex-row items-center justify-between px-4 pt-16 pb-4">
      {/* Left: Sidebar Button */}
      <Pressable
        onPress={onOpenSidebar}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{
            backgroundColor: isDarkMode
              ? 'rgba(255, 255, 255, 0.10)'
              : 'rgba(255, 255, 255, 0.80)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
            elevation: 5,
          }}
        >
          <SymbolView
            name="line.horizontal.3"
            size={24}
            tintColor={isDarkMode ? colors.foreground : '#2F6A8D'}
          />
        </View>
      </Pressable>

      {/* Center: Personality Text - Only show for coach/companion */}
      {activeChatType !== 'event' && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          key={activeChatType}
          className="flex-1 items-center px-4"
        >
          <Text
            variant="title3"
            className="font-bold text-center text-foreground"
          >
            {isArabic ? message.titleAr : message.title}
          </Text>
          <Text
            variant="caption"
            className="text-center text-muted-foreground mt-0.5"
          >
            {isArabic ? message.subtitleAr : message.subtitle}
          </Text>
        </Animated.View>
      )}

      {/* Right: Personality Toggle Button - Only show for coach/companion */}
      {onChatTypeChange && activeChatType !== 'event' && (
        <Pressable
          onPress={handleToggle}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{
              backgroundColor: isDarkMode
                ? 'rgba(255, 255, 255, 0.10)'
                : 'rgba(255, 255, 255, 0.80)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 5,
            }}
          >
            <SymbolView
              name={
                activeChatType === 'coach'
                  ? 'person.circle.fill'
                  : 'heart.circle.fill'
              }
              size={20}
              tintColor={activeChatType === 'coach' ? '#2F6A8D' : '#7BA05B'}
              weight="semibold"
            />
            {/* Small indicator for the other type */}
            <View
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full items-center justify-center"
              style={{ backgroundColor: 'white' }}
            >
              <View
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    activeChatType === 'coach' ? '#7BA05B' : '#2F6A8D',
                }}
              />
            </View>
          </View>
        </Pressable>
      )}
    </View>
  );
});
