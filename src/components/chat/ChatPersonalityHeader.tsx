import React from 'react';
import { View } from 'react-native';
import { Text } from '~/components/ui/text';
import { ChatType } from '~/store/useChatUIStore';
import { useTranslation } from '~/hooks/useTranslation';
import Animated, { FadeIn, FadeOut, SlideInUp } from 'react-native-reanimated';

interface ChatPersonalityHeaderProps {
  chatType: ChatType;
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

export function ChatPersonalityHeader({
  chatType,
}: ChatPersonalityHeaderProps) {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const message =
    personalityMessages.find((m) => m.type === chatType) ||
    personalityMessages[0];

  return (
    <Animated.View
      entering={FadeIn.duration(300).delay(100)}
      exiting={FadeOut.duration(200)}
      key={chatType} // Force re-animation on type change
    >
      <View className="items-center px-6 py-4 mt-2">
        <Animated.View
          entering={SlideInUp.duration(400).delay(100).springify()}
          key={`${chatType}-title`}
        >
          <Text
            variant="title3"
            className="font-bold text-center text-foreground"
          >
            {isArabic ? message.titleAr : message.title}
          </Text>
        </Animated.View>

        <Animated.View
          entering={SlideInUp.duration(400).delay(150).springify()}
          key={`${chatType}-subtitle`}
        >
          <Text
            variant="subhead"
            className="text-center text-muted-foreground mt-1"
          >
            {isArabic ? message.subtitleAr : message.subtitle}
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}
