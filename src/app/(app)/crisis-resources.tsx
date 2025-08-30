import React from 'react';
import { View, ScrollView, Pressable, Linking, Alert } from 'react-native';
import { Text } from '~/components/ui/text';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useColors } from '~/hooks/useColors';
import { useTranslation } from '~/hooks/useTranslation';
// no safe area needed for this header style
// Removed useIsRTL - text alignment handled by Text component

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
            <Text variant="callout" className="text-white font-medium ms-2">
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
      <Text variant="footnote" className="text-muted-foreground ms-2 flex-1">
        {text}
      </Text>
    </View>
  );
}

export default function CrisisResources() {
  const colors = useColors();
  const { t } = useTranslation();
  // Header matches CategoryExerciseList style (no extra safe-area top padding)
  // Text alignment now handled by Text component autoAlign

  const resources = [
    {
      title: t('crisisResources.resources.suicidePreventionLifeline.title'),
      description: t(
        'crisisResources.resources.suicidePreventionLifeline.description'
      ),
      phoneNumber: '988',
      hours: t('crisisResources.resources.suicidePreventionLifeline.hours'),
      isEmergency: true,
    },
    {
      title: t('crisisResources.resources.crisisTextLine.title'),
      description: t('crisisResources.resources.crisisTextLine.description'),
      phoneNumber: '741741',
      hours: t('crisisResources.resources.crisisTextLine.hours'),
      isEmergency: true,
    },
    {
      title: t('crisisResources.resources.samhsaHelpline.title'),
      description: t('crisisResources.resources.samhsaHelpline.description'),
      phoneNumber: '1-800-662-4357',
      hours: t('crisisResources.resources.samhsaHelpline.hours'),
      isEmergency: false,
    },
    {
      title: t('crisisResources.resources.veteransCrisisLine.title'),
      description: t(
        'crisisResources.resources.veteransCrisisLine.description'
      ),
      phoneNumber: '1-800-273-8255',
      hours: t('crisisResources.resources.veteransCrisisLine.hours'),
      isEmergency: false,
    },
  ];

  const warningSigns = t('crisisResources.warningSignsList', {
    returnObjects: true,
  }) as string[];

  return (
    <View className="flex-1 bg-background">
      {/* Manual Header - matching ProfileLayout styling */}
      <View className="bg-background">
        <View className="flex-row items-center px-4 py-3 mb-4">
          <Pressable
            onPress={() => router.back()}
            className="p-2 me-2"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <SymbolView name="chevron.left" size={28} tintColor="#9CA3AF" />
          </Pressable>
          <Text
            variant="title1"
            autoAlign={false}
            className="text-foreground flex-1 text-center"
          >
            {t('crisisResources.title')}
          </Text>
          <View style={{ width: 44 }} />
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
            <Text variant="title3" className="text-white ms-2">
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
                <Text variant="body" className="text-foreground ms-3 flex-1">
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
