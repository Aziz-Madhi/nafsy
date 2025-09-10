import React, { useState } from 'react';
import { View, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Shield,
  Heart,
  Brain,
  TrendingUp,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { useColors } from '~/hooks/useColors';
import { useTranslation } from '~/hooks/useTranslation';
import { useAppStore } from '~/store/useAppStore';
import { useOnboardingStore } from '~/store/useOnboardingStore';

export default function OnboardingCompleteScreen() {
  const colors = useColors();
  const { t } = useTranslation();
  const setHasCompletedOnboarding = useAppStore(
    (s) => s.setHasCompletedOnboarding
  );

  // Answers
  const name = useOnboardingStore((s) => s.name);
  const age = useOnboardingStore((s) => s.age);
  const gender = useOnboardingStore((s) => s.gender);
  const moodRating = useOnboardingStore((s) => s.moodRating);
  const moodMonth = useOnboardingStore((s) => s.moodMonth);
  const goals = useOnboardingStore((s) => s.goals);
  const selfImage = useOnboardingStore((s) => s.selfImage);
  const helpAreas = useOnboardingStore((s) => s.helpAreas);
  const struggles = useOnboardingStore((s) => s.struggles);
  const additionalNotes = useOnboardingStore((s) => s.additionalNotes);
  const reset = useOnboardingStore((s) => s.reset);

  const updateUser = useMutation(api.auth.updateUser);
  const upsertUser = useMutation(api.auth.upsertUser);
  const createMood = useMutation(api.moods.createMood);
  const [saving, setSaving] = useState(false);

  async function onFinish() {
    try {
      setSaving(true);
      const payload: any = { name };
      if (age != null) payload.age = age;
      if (gender) payload.gender = gender;
      payload.onboardingCompleted = true;
      if (moodMonth) payload.moodLastMonth = moodMonth;
      if (Array.isArray(goals) && goals.length) payload.goals = goals;
      if (Array.isArray(selfImage) && selfImage.length)
        payload.selfImage = selfImage;
      if (Array.isArray(helpAreas) && helpAreas.length)
        payload.helpAreas = helpAreas;
      if (Array.isArray(struggles) && struggles.length)
        payload.struggles = struggles;
      if (additionalNotes && additionalNotes.trim().length > 0)
        payload.additionalNotes = additionalNotes.trim();

      try {
        await updateUser(payload);
      } catch {
        await upsertUser(payload);
      }

      // Record onboarding mood as today's mood entry so the app reflects it immediately
      if (
        typeof moodRating === 'number' &&
        moodRating >= 1 &&
        moodRating <= 10
      ) {
        try {
          await createMood({ rating: Math.round(moodRating) });
        } catch (err) {
          console.error('Failed to record onboarding mood:', err);
        }
      }
    } catch (e) {
      console.error('Failed to save onboarding:', e);
    } finally {
      setSaving(false);
    }

    setHasCompletedOnboarding(true);
    reset();
    router.replace('/tabs/chat');
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Top spacer to preserve previous padding after removing header */}
      <View className="px-5 pt-3">
        <View style={{ height: 40, marginBottom: 8 }} />
      </View>

      <View className="flex-1 px-5 items-center">
        <View
          className="w-full"
          style={{ height: 174, marginBottom: 16, position: 'relative' }}
        >
          <Image
            source={require('../../../assets/Cards/All set icon..png')}
            style={{
              width: 300,
              height: 300,
              resizeMode: 'contain',
              position: 'absolute',
              top: -73,
              alignSelf: 'center',
            }}
          />
        </View>

        <View className="w-full">
          <Text
            style={{
              fontFamily: 'System',
              fontWeight: '700',
              fontSize: 28,
              lineHeight: 32,
              color: colors.foreground,
              textAlign: 'center',
            }}
          >
            {t('onboarding.complete.title', "You're all set")}
          </Text>
          <Text
            className="text-muted-foreground mt-2 text-center"
            style={{ textAlign: 'center' }}
          >
            {t(
              'onboarding.complete.subtitle',
              "We'll tailor your experience based on your answers."
            )}
          </Text>
        </View>

        <View className="w-full mt-6 gap-5" style={{ marginHorizontal: -20 }}>
          <View className="gap-3 mb-5">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <InfoCard
                  icon={Shield}
                  title={t(
                    'onboarding.complete.privacy.title',
                    'Privacy First'
                  )}
                  description={t(
                    'onboarding.complete.privacy.description',
                    'Your data is encrypted and never shared.'
                  )}
                  iconColor="#10B981"
                />
              </View>
              <View className="flex-1">
                <InfoCard
                  icon={Heart}
                  title={t(
                    'onboarding.complete.companion.title',
                    'Daily Companion'
                  )}
                  description={t(
                    'onboarding.complete.companion.description',
                    'Support for wellness. Not a replacement for professional care.'
                  )}
                  iconColor="#EC4899"
                />
              </View>
            </View>
            <View className="flex-row gap-3">
              <View className="flex-1">
                <InfoCard
                  icon={Brain}
                  title={t(
                    'onboarding.complete.learning.title',
                    'Learns With You'
                  )}
                  description={t(
                    'onboarding.complete.learning.description',
                    'Nafsy adapts with your mood logs and chats.'
                  )}
                  iconColor="#8B5CF6"
                />
              </View>
              <View className="flex-1">
                <InfoCard
                  icon={TrendingUp}
                  title={t(
                    'onboarding.complete.progress.title',
                    'Weekly Progress'
                  )}
                  description={t(
                    'onboarding.complete.progress.description',
                    'Stay consistent to see smarter support each week.'
                  )}
                  iconColor="#F59E0B"
                />
              </View>
            </View>
          </View>
        </View>
      </View>

      <View className="mt-auto pb-8 px-5 gap-4">
        <StepDots current={4} total={4} />
        <View className="flex-row gap-3 items-stretch">
          <Button
            variant="outline"
            size="lg"
            className="rounded-xl w-14 px-0 active:bg-transparent"
            android_ripple={{ color: 'transparent' }}
            onPress={() => router.back()}
            disabled={saving}
          >
            <ChevronLeft size={20} color={colors.foreground} />
          </Button>
          <Button
            size="lg"
            className="rounded-xl bg-brand-dark-blue flex-1"
            onPress={onFinish}
            disabled={saving}
          >
            <Text className="text-primary-foreground text-base font-semibold">
              {saving
                ? t('onboarding.complete.saving', 'Saving...')
                : t('onboarding.complete.finish', 'Finish')}
            </Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

function OnboardingHeader({ onBack }: { onBack: () => void }) {
  return (
    <View className="flex-row items-center mb-2">
      <Pressable
        accessibilityRole="button"
        onPress={onBack}
        className="w-10 h-10 rounded-full items-center justify-center bg-card"
      >
        <ChevronLeft size={22} color="#5A4A3A" />
      </Pressable>
    </View>
  );
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View className="mb-1 items-center">
      <View className="flex-row gap-2">
        {Array.from({ length: total }).map((_, i) => {
          const isActive = i === current - 1;
          return (
            <View
              key={i}
              className={isActive ? 'bg-brand-dark-blue' : 'bg-card'}
              style={{
                width: isActive ? 18 : 8,
                height: 8,
                borderRadius: 9999,
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

function InfoCard({
  icon: Icon,
  title,
  description,
  iconColor,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColor?: string;
}) {
  const colors = useColors();
  const { isRTL } = useTranslation();
  return (
    <View
      className="rounded-xl p-4 border border-transparent bg-black/[0.03] dark:bg-white/[0.03]"
      style={{ height: 152 }}
    >
      <View className="gap-2.5">
        <View
          className="items-center gap-2"
          style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}
        >
          <Icon
            size={16}
            color={iconColor ?? colors.foreground}
            strokeWidth={2}
          />
          <Text
            className="text-foreground font-semibold text-[15px]"
            numberOfLines={2}
            style={{ textAlign: isRTL ? 'right' : 'left' }}
          >
            {title}
          </Text>
        </View>
        <Text
          className="text-muted-foreground text-[13px] leading-[18px]"
          numberOfLines={4}
          style={{ textAlign: isRTL ? 'right' : 'left' }}
        >
          {description}
        </Text>
      </View>
    </View>
  );
}
