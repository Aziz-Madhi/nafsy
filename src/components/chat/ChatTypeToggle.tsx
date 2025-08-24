import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import { SymbolView } from 'expo-symbols';
import Animated from 'react-native-reanimated';
import { cn } from '~/lib/cn';
import { ChatType } from '~/store/useChatUIStore';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useColors } from '~/hooks/useColors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ChatTypeToggleProps {
  activeType: ChatType;
  onTypeChange: (type: ChatType) => void;
}

interface ChatTypeConfig {
  type: ChatType;
  icon: string;
  label: string;
  labelAr: string;
  color: string;
  bgClass: string;
  textClass: string;
}

const chatTypes: ChatTypeConfig[] = [
  {
    type: 'coach',
    icon: 'person.crop.circle',
    label: 'Coach',
    labelAr: 'مدرب',
    color: '#2F6A8D',
    bgClass: 'bg-chat-coach-primary/10',
    textClass: 'text-chat-coach-primary',
  },
  {
    type: 'event',
    icon: 'bolt.heart',
    label: 'Event',
    labelAr: 'حدث',
    color: '#B45F74',
    bgClass: 'bg-chat-event-primary/10',
    textClass: 'text-chat-event-primary',
  },
  {
    type: 'companion',
    icon: 'heart.circle',
    label: 'Companion',
    labelAr: 'رفيق',
    color: '#7BA05B',
    bgClass: 'bg-chat-companion-primary/10',
    textClass: 'text-chat-companion-primary',
  },
];

export function ChatTypeToggle({
  activeType,
  onTypeChange,
}: ChatTypeToggleProps) {
  const colors = useColors();

  const handlePress = async (type: ChatType) => {
    if (type !== activeType) {
      await impactAsync(ImpactFeedbackStyle.Light);
      onTypeChange(type);
    }
  };

  return (
    <View className="mx-4 mb-3">
      <View className="flex-row bg-card/50 rounded-2xl p-1 border border-border/10">
        {chatTypes.map((chatType) => {
          const isActive = activeType === chatType.type;

          return (
            <AnimatedPressable
              key={chatType.type}
              onPress={() => handlePress(chatType.type)}
              className={cn(
                'flex-1 py-3 px-2 rounded-xl items-center justify-center',
                isActive && chatType.bgClass
              )}
              style={{
                transform: [{ scale: isActive ? 1 : 0.98 }],
              }}
            >
              <View className="items-center">
                <SymbolView
                  name={chatType.icon}
                  size={22}
                  tintColor={isActive ? chatType.color : colors.mutedForeground}
                  weight={isActive ? 'semibold' : 'regular'}
                />
                <Text
                  className={cn(
                    'text-xs mt-1',
                    isActive
                      ? [chatType.textClass, 'font-semibold']
                      : 'text-muted-foreground'
                  )}
                >
                  {chatType.label}
                </Text>
              </View>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}

// Export chat type utilities
export function getChatTypeIcon(type: ChatType): string {
  const config = chatTypes.find((t) => t.type === type);
  return config?.icon || 'person.crop.circle';
}

export function getChatTypeColor(type: ChatType): string {
  const config = chatTypes.find((t) => t.type === type);
  return config?.color || '#2F6A8D';
}

export function getChatTypeLabel(type: ChatType, isArabic?: boolean): string {
  const config = chatTypes.find((t) => t.type === type);
  return isArabic ? config?.labelAr || 'مدرب' : config?.label || 'Coach';
}

export function getChatTypeBgClass(type: ChatType): string {
  const config = chatTypes.find((t) => t.type === type);
  return config?.bgClass || 'bg-chat-coach-primary/10';
}

export function getChatTypeTextClass(type: ChatType): string {
  const config = chatTypes.find((t) => t.type === type);
  return config?.textClass || 'text-chat-coach-primary';
}
