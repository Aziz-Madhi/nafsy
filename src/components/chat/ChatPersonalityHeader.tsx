import React from 'react';
import { View } from 'react-native';
import { Text } from '~/components/ui/text';
import { ChatType } from '~/store/useChatUIStore';
import { useTranslation } from '~/hooks/useTranslation';

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

export function ChatPersonalityHeader({ chatType }: ChatPersonalityHeaderProps) {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const message =
    personalityMessages.find((m) => m.type === chatType) ||
    personalityMessages[0];

  return (
    <View className="items-center px-6">
      <Text variant="title3" className="font-bold text-center text-foreground">
        {isArabic ? message.titleAr : message.title}
      </Text>
      <Text variant="subhead" className="text-center text-muted-foreground mt-1">
        {isArabic ? message.subtitleAr : message.subtitle}
      </Text>
    </View>
  );
}
