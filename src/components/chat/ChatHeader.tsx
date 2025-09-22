/**
 * Chat Header Component
 * Contains the sidebar toggle button, personality text, and personality toggle
 */

import React, { memo, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { MessageSquareLock } from 'lucide-react-native';
import { useColors } from '~/hooks/useColors';
import { Text } from '~/components/ui/text';
import { useTranslation } from '~/hooks/useTranslation';
import { ChatType } from '~/store/useChatUIStore';

interface ChatHeaderProps {
  onOpenSidebar: () => void;
  activeChatType: ChatType;
  onChatTypeChange?: (type: ChatType) => void;
  onOpenVentChat?: () => void;
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
    title: 'Coach',
    titleAr: 'المدرب',
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
    title: 'Companion',
    titleAr: 'الرفيق',
    subtitle: 'Your friendly companion is here',
    subtitleAr: 'رفيقك الودود هنا',
  },
];

export const ChatHeader = memo(function ChatHeader({
  onOpenSidebar,
  activeChatType,
  onChatTypeChange,
  onOpenVentChat,
}: ChatHeaderProps) {
  const colors = useColors();
  const { i18n } = useTranslation();
  const isDarkMode = colors.background === '#0A1514';
  const isArabic = i18n.language === 'ar';
  const accentTint = colors.brandDarkBlue;

  const message =
    personalityMessages.find((m) => m.type === activeChatType) ||
    personalityMessages[0];

  const canToggle =
    Boolean(onChatTypeChange) &&
    activeChatType !== 'event' &&
    (activeChatType === 'coach' || activeChatType === 'companion');

  const [menuVisible, setMenuVisible] = useState(false);
  const [leftWidth, setLeftWidth] = useState(0);
  const [rightWidth, setRightWidth] = useState(0);
  const sideWidth = Math.max(leftWidth, rightWidth);

  useEffect(() => {
    setMenuVisible(false);
  }, [activeChatType]);

  // Only handle coach and companion types for the toggle
  // Event personality is overlay-only and not part of regular chat toggle
  const handleToggle = () => {
    if (!canToggle) {
      return;
    }

    setMenuVisible((visible) => !visible);
  };

  const handleSelect = (type: ChatType) => {
    if (!onChatTypeChange) {
      return;
    }

    setMenuVisible(false);
    onChatTypeChange(type);
  };

  const personalityOptions = personalityMessages.filter(
    (option) => option.type === 'coach' || option.type === 'companion'
  );

  const alternateMessage = canToggle
    ? personalityOptions.find((option) => option.type !== activeChatType)
    : undefined;

  return (
    <View className="flex-row items-center justify-between px-4 pt-16 pb-4">
      {/* Left: Sidebar Button */}
      <View
        onLayout={(event) => {
          const width = event.nativeEvent.layout.width;
          if (width !== leftWidth) {
            setLeftWidth(width);
          }
        }}
        style={{
          width: sideWidth || undefined,
          alignItems: 'flex-start',
          justifyContent: 'center',
        }}
      >
        <Pressable
          onPress={onOpenSidebar}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            padding: 4,
          }}
        >
          <SymbolView
            name="line.horizontal.3"
            size={24}
            tintColor={accentTint}
          />
        </Pressable>
      </View>

      <View className="flex-1 items-center relative">
        <Pressable
          disabled={!canToggle}
          onPress={handleToggle}
          accessibilityRole={canToggle ? 'button' : undefined}
          accessibilityLabel={
            canToggle && alternateMessage
              ? isArabic
                ? `${message.titleAr}. اضغط للتبديل إلى ${alternateMessage.titleAr}`
                : `${message.title}. Tap to switch to ${alternateMessage.title}`
              : undefined
          }
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View className="items-center">
            <View className="flex-row items-center gap-1">
              <Text
                className="text-lg font-semibold"
                style={{
                  letterSpacing: isArabic ? 0 : 0.2,
                  color: accentTint,
                }}
              >
                {isArabic ? message.titleAr : message.title}
              </Text>
              {canToggle && (
                <SymbolView
                  name={menuVisible ? 'chevron.up' : 'chevron.down'}
                  size={16}
                  tintColor={accentTint}
                />
              )}
            </View>
          </View>
        </Pressable>

        {menuVisible && (
          <>
            <Pressable
              onPress={() => setMenuVisible(false)}
              style={{
                position: 'absolute',
                top: -1000,
                bottom: -1000,
                left: -1000,
                right: -1000,
                zIndex: 0,
              }}
            />
            <View
              className="rounded-2xl border border-border/30"
              style={{
                position: 'absolute',
                top: 40,
                minWidth: 168,
                backgroundColor: colors.card,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.15,
                shadowRadius: 24,
                elevation: 12,
                zIndex: 1,
              }}
            >
              {personalityOptions.map((option, index) => {
                const isActive = option.type === activeChatType;
                const radiusStyle = {
                  borderTopLeftRadius: index === 0 ? 16 : 0,
                  borderTopRightRadius: index === 0 ? 16 : 0,
                borderBottomLeftRadius:
                  index === personalityOptions.length - 1 ? 16 : 0,
                borderBottomRightRadius:
                  index === personalityOptions.length - 1 ? 16 : 0,
              };

              return (
                <Pressable
                  key={option.type}
                  onPress={() => handleSelect(option.type)}
                  className="px-4 py-2.5"
                  style={{
                    backgroundColor: isActive
                      ? isDarkMode
                        ? 'rgba(255,255,255,0.12)'
                        : 'rgba(255,255,255,0.35)'
                      : 'transparent',
                    ...radiusStyle,
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      className="text-base"
                      style={{
                        color: isActive ? accentTint : colors.foreground,
                        fontWeight: isActive ? '600' : '500',
                      }}
                    >
                      {isArabic ? option.titleAr : option.title}
                    </Text>
                    {isActive && (
                      <SymbolView
                        name="checkmark"
                        size={16}
                        tintColor={accentTint}
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}
            </View>
          </>
        )}
      </View>

      <View
        onLayout={(event) => {
          const width = event.nativeEvent.layout.width;
          if (width !== rightWidth) {
            setRightWidth(width);
          }
        }}
        style={{
          width: sideWidth || undefined,
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
      >
        {onOpenVentChat ? (
          <Pressable
            onPress={onOpenVentChat}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={
              isArabic ? 'افتح دردشة التنفيس' : 'Open vent chat'
            }
          >
            <MessageSquareLock size={22} color={accentTint} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});
