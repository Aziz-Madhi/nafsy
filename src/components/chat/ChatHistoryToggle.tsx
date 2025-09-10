import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import { MotiView } from 'moti';
import { ChatType } from '~/store/useChatUIStore';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useTranslation } from '~/hooks/useTranslation';
import { useColors } from '~/hooks/useColors';

interface ChatHistoryToggleProps {
  activeType: ChatType;
  onTypeChange: (type: ChatType) => void;
}

// Only support coach and companion for history (event sessions are not stored)
const historyTypes: ChatType[] = ['coach', 'companion'];

export function ChatHistoryToggle({
  activeType,
  onTypeChange,
}: ChatHistoryToggleProps) {
  const { currentLanguage } = useTranslation();
  const colors = useColors();

  const handlePress = async (type: ChatType) => {
    if (type !== activeType) {
      await impactAsync(ImpactFeedbackStyle.Light);
      onTypeChange(type);
    }
  };

  const getHistoryLabel = (type: ChatType) => {
    const isArabic = currentLanguage === 'ar';
    if (type === 'coach') return isArabic ? 'المدرب' : 'Coach';
    return isArabic ? 'الرفيق' : 'Companion';
  };

  return (
    <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor:
            colors.background === '#FFFFFF'
              ? 'rgba(0,0,0,0.04)'
              : 'rgba(255,255,255,0.06)',
          borderRadius: 16,
          padding: 4,
          position: 'relative',
        }}
      >
        {/* Animated background highlight */}
        <MotiView
          animate={{
            translateX: activeType === 'coach' ? 0 : '100%',
          }}
          transition={{
            type: 'timing',
            duration: 200,
          }}
          style={{
            position: 'absolute',
            top: 4,
            left: 4,
            bottom: 4,
            width: '50%',
            backgroundColor: colors.card,
            borderRadius: 12,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 2,
          }}
        />

        {/* Toggle buttons */}
        {historyTypes.map((type) => {
          const isActive = activeType === type;

          return (
            <Pressable
              key={type}
              onPress={() => handlePress(type)}
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 16,
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
            >
              <Text
                variant="footnote"
                className={
                  isActive
                    ? 'font-semibold text-center'
                    : 'font-medium text-center'
                }
                style={{
                  color: isActive ? colors.foreground : colors.mutedForeground,
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.9}
              >
                {getHistoryLabel(type)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
