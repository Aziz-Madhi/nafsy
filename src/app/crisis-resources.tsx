import React from 'react';
import { View, ScrollView, Pressable, Linking, Alert } from 'react-native';
import { Text } from '~/components/ui/text';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from '~/hooks/useTranslation';
import { ProfileLayout } from '~/components/ui/ScreenLayout';
import { useColors } from '~/hooks/useColors';

// Resource Card Component
function ResourceCard({
  title,
  description,
  phoneNumber,
  hours,
  isEmergency = false,
}: {
  title: string;
  description: string;
  phoneNumber: string;
  hours: string;
  isEmergency?: boolean;
}) {
  const { t } = useTranslation();
  const colors = useColors();
  const handleCall = () => {
    impactAsync(ImpactFeedbackStyle.Medium);
    Alert.alert(
      `${t('crisisResources.alertCall')} ${title}`,
      t('crisisResources.confirmCall', { phoneNumber }),
      [
        { text: t('crisisResources.alertCancel'), style: 'cancel' },
        {
          text: t('crisisResources.alertCall'),
          onPress: () => Linking.openURL(`tel:${phoneNumber}`),
        },
      ]
    );
  };

  return (
    <Animated.View entering={FadeInDown.springify()}>
      <View
        className={`rounded-3xl mb-4 overflow-hidden ${isEmergency ? 'bg-red-50' : 'bg-black/[0.03] dark:bg-white/[0.03]'}`}
      >
        <View className="p-4">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1">
              <Text
                variant="callout"
                className={`font-semibold mb-1 ${isEmergency ? 'text-red-600' : ''}`}
              >
                {title}
              </Text>
              <Text variant="caption1" className="text-muted-foreground mb-2">
                {description}
              </Text>
              <Text variant="caption2" className="text-muted-foreground">
                {hours}
              </Text>
            </View>
            {isEmergency && (
              <View className="bg-red-100 px-2 py-1 rounded-md">
                <Text variant="caption2" className="text-red-600 font-medium">
                  {t('crisisResources.emergency')}
                </Text>
              </View>
            )}
          </View>

          <Pressable
            onPress={handleCall}
            className={`mt-3 rounded-lg py-3 flex-row items-center justify-center ${
              isEmergency ? 'bg-red-600' : 'bg-brand-dark-blue'
            }`}
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            <SymbolView name="phone.fill" size={18} tintColor="white" />
            <Text variant="callout" className="text-white font-medium ml-2">
              {phoneNumber}
            </Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

// Warning Signs Component
function WarningSign({ text }: { text: string }) {
  const colors = useColors();

  return (
    <View className="flex-row items-start mb-3">
      <SymbolView
        name="exclamationmark.triangle.fill"
        size={16}
        tintColor={colors.error}
      />
      <Text variant="footnote" className="text-muted-foreground ml-2 flex-1">
        {text}
      </Text>
    </View>
  );
}

export default function CrisisResources() {
  const { t, language } = useTranslation();
  const colors = useColors();

  const resources =
    language === 'en'
      ? [
          {
            title: 'National Suicide Prevention Lifeline',
            description:
              'Free, confidential 24/7 support for people in distress',
            phoneNumber: '988',
            hours: '24/7 Available',
            isEmergency: true,
          },
          {
            title: 'Crisis Text Line',
            description: 'Text HOME to connect with a crisis counselor',
            phoneNumber: '741741',
            hours: '24/7 Text Support',
            isEmergency: true,
          },
          {
            title: 'SAMHSA National Helpline',
            description:
              'Treatment referral and information service for mental health',
            phoneNumber: '1-800-662-4357',
            hours: '24/7 Available',
            isEmergency: false,
          },
          {
            title: 'Veterans Crisis Line',
            description: 'Support for Veterans and their families',
            phoneNumber: '1-800-273-8255',
            hours: '24/7 Available',
            isEmergency: false,
          },
        ]
      : [
          {
            title: 'الخط الساخن للصحة النفسية',
            description: 'دعم مجاني وسري على مدار الساعة',
            phoneNumber: '920033360',
            hours: 'متاح 24/7',
            isEmergency: true,
          },
          {
            title: 'مركز الاستشارات النفسية',
            description: 'استشارات نفسية متخصصة',
            phoneNumber: '920012623',
            hours: '9 صباحاً - 9 مساءً',
            isEmergency: false,
          },
          {
            title: 'خط مساندة الطفل',
            description: 'دعم الأطفال والمراهقين',
            phoneNumber: '116111',
            hours: 'متاح 24/7',
            isEmergency: false,
          },
        ];

  const warningSigns =
    language === 'en'
      ? [
          'Talking about wanting to die or kill oneself',
          'Looking for ways to kill oneself',
          'Feeling hopeless or having no purpose',
          'Feeling trapped or in unbearable pain',
          'Talking about being a burden to others',
          'Increasing use of alcohol or drugs',
          'Withdrawing from family and friends',
          'Showing rage or talking about seeking revenge',
          'Displaying extreme mood swings',
        ]
      : [
          'التحدث عن الرغبة في الموت أو الانتحار',
          'البحث عن طرق لإيذاء النفس',
          'الشعور باليأس أو فقدان الهدف',
          'الشعور بالحصار أو الألم الذي لا يطاق',
          'التحدث عن كونك عبئاً على الآخرين',
          'زيادة استخدام الكحول أو المخدرات',
          'الانسحاب من العائلة والأصدقاء',
          'إظهار الغضب أو التحدث عن الانتقام',
          'التقلبات المزاجية الشديدة',
        ];

  return (
    <View className="flex-1 bg-background">
      {/* Manual Header - matching ProfileLayout styling */}
      <View
        className="bg-background"
        style={{ paddingTop: 58, paddingBottom: 16, paddingHorizontal: 24 }}
      >
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="mr-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <SymbolView
              name="chevron.left"
              size={24}
              tintColor={colors.brandDarkBlue}
            />
          </Pressable>
          <Text
            className="text-foreground flex-1"
            style={{
              fontFamily: 'CrimsonPro-Bold',
              fontSize: 28,
              fontWeight: 'normal',
              lineHeight: 34,
              textAlign: 'left',
            }}
          >
            {t('crisisResources.title')}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Emergency Banner */}
        <View className="bg-red-600 p-4 mx-6 mt-6 rounded-xl">
          <View className="flex-row items-center mb-2">
            <SymbolView
              name="exclamationmark.circle.fill"
              size={24}
              tintColor="white"
            />
            <Text variant="title3" className="text-white ml-2">
              {t('crisisResources.immediateHelp')}
            </Text>
          </View>
          <Text variant="body" className="text-white/90">
            {t('crisisResources.callEmergency')}
          </Text>
        </View>

        <View className="p-6">
          {/* Crisis Hotlines */}
          <Text
            variant="footnote"
            className="text-muted-foreground mb-4 uppercase tracking-wide"
          >
            {t('crisisResources.hotlines')}
          </Text>

          {resources.map((resource, index) => (
            <ResourceCard key={index} {...resource} />
          ))}

          {/* Warning Signs */}
          <View className="mt-8">
            <Text
              variant="footnote"
              className="text-muted-foreground mb-4 uppercase tracking-wide"
            >
              {t('crisisResources.warningSigns')}
            </Text>

            <View className="bg-black/[0.03] dark:bg-white/[0.03] rounded-3xl p-4">
              <Text variant="callout" className="font-semibold mb-4">
                {t('crisisResources.seekHelp')}
              </Text>

              {warningSigns.map((sign, index) => (
                <WarningSign key={index} text={sign} />
              ))}
            </View>
          </View>

          {/* Additional Resources */}
          <View className="mt-8 mb-6">
            <Text
              variant="footnote"
              className="text-muted-foreground mb-4 uppercase tracking-wide"
            >
              {t('crisisResources.remember')}
            </Text>

            <View className="bg-black/[0.03] dark:bg-white/[0.03] rounded-3xl p-4">
              <View className="flex-row items-start">
                <SymbolView
                  name="heart.fill"
                  size={20}
                  tintColor={colors.brandDarkBlue}
                />
                <Text variant="body" className="text-gray-700 ml-3 flex-1">
                  {t('crisisResources.notAlone')}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
