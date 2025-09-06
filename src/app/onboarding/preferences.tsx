import React from 'react';
import { View, Pressable } from 'react-native';
import { MotiPressable } from 'moti/interactions';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Brain,
  Moon,
  Sparkles,
  Target,
  AlertTriangle,
  CloudSun,
  Sun,
  MessageSquare,
  Wind,
  Flower2,
  BookOpen,
  Clock,
  Lock,
  EyeOff,
  Cloud,
  Users,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { useColors } from '~/hooks/useColors';
import { useTranslation } from '~/hooks/useTranslation';
import { useOnboardingStore } from '~/store/useOnboardingStore';

// Trimmed options to avoid scrolling on small screens
const GOAL_KEYS = [
  'reduceAnxiety',
  'improveSleep',
  'buildMindfulness',
  'increaseFocus',
] as const;

const SELF_IMAGE_KEYS = [
  'stressed',
  'overwhelmed',
  'motivated',
  'hopeful',
] as const;

const HELP_AREA_KEYS = [
  'talkToSomeone',
  'breathingGuidance',
  'mindfulnessPractice',
  'journalingPrompts',
] as const;

const FEAR_KEYS = ['timeCommitment', 'privacy', 'stigma'] as const;

// Icon mappings for each category
const GOAL_ICONS: Record<(typeof GOAL_KEYS)[number], LucideIcon> = {
  reduceAnxiety: Brain,
  improveSleep: Moon,
  buildMindfulness: Sparkles,
  increaseFocus: Target,
};

const SELF_IMAGE_ICONS: Record<(typeof SELF_IMAGE_KEYS)[number], LucideIcon> = {
  stressed: AlertTriangle,
  overwhelmed: CloudSun,
  motivated: Sun,
  hopeful: Sun,
};

const HELP_AREA_ICONS: Record<(typeof HELP_AREA_KEYS)[number], LucideIcon> = {
  talkToSomeone: MessageSquare,
  breathingGuidance: Wind,
  mindfulnessPractice: Flower2,
  journalingPrompts: BookOpen,
};

const FEAR_ICONS: Record<(typeof FEAR_KEYS)[number], LucideIcon> = {
  timeCommitment: Clock,
  privacy: Lock,
  stigma: EyeOff,
};

// Day-to-day struggles (moved here from Mood step)
const STRUGGLE_KEYS = [
  'sleepIssues',
  'stress',
  'anxiety',
  'lowMotivation',
  'focusProblems',
  'loneliness',
] as const;

const STRUGGLE_LABELS: Record<(typeof STRUGGLE_KEYS)[number], string> = {
  sleepIssues: 'Sleep issues',
  stress: 'Stress',
  anxiety: 'Anxiety',
  lowMotivation: 'Low motivation',
  focusProblems: 'Focus problems',
  loneliness: 'Loneliness',
};

const STRUGGLE_ICONS: Record<(typeof STRUGGLE_KEYS)[number], LucideIcon> = {
  sleepIssues: Moon,
  stress: AlertTriangle,
  anxiety: Brain,
  lowMotivation: Cloud,
  focusProblems: Target,
  loneliness: Users,
};

const HELP_AREA_LABELS: Record<(typeof HELP_AREA_KEYS)[number], string> = {
  talkToSomeone: 'Talk to someone',
  breathingGuidance: 'Breathing guidance',
  mindfulnessPractice: 'Mindfulness practice',
  journalingPrompts: 'Journaling prompts',
};

const FEAR_LABELS: Record<(typeof FEAR_KEYS)[number], string> = {
  timeCommitment: 'Time commitment',
  privacy: 'Privacy',
  stigma: 'Stigma',
};

export default function PreferencesStep() {
  const colors = useColors();
  const { t } = useTranslation();
  const goals = useOnboardingStore((s) => s.goals);
  const selfImage = useOnboardingStore((s) => s.selfImage);
  const helpAreas = useOnboardingStore((s) => s.helpAreas);
  const fears = useOnboardingStore((s) => s.fears);
  const struggles = useOnboardingStore((s) => s.struggles);
  const toggle = useOnboardingStore((s) => s.toggleArrayValue);

  function onNext() {
    // Consolidated flow: final step is embedded in profile.tsx
    router.push('/onboarding/profile');
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-5 pt-3">
        <OnboardingHeader onBack={() => router.back()} />
      </View>
      <View className="px-5">
        <Text
          style={{
            fontFamily: 'AveriaSerif-Bold',
            fontSize: 28,
            lineHeight: 32,
            color: colors.foreground,
          }}
        >
          {t('onboarding.preferences.title')}
        </Text>
        <Text className="text-muted-foreground mt-2">
          {t('onboarding.preferences.subtitle')}
        </Text>
      </View>

      <View className="mt-8 gap-6 px-5">
        <View>
          <Text className="text-foreground font-semibold mb-3">
            {t('onboarding.preferences.goalsTitle')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {GOAL_KEYS.map((k) => {
              const key = `onboarding.preferences.goals.${k}`;
              const active = goals.includes(k);
              return (
                <Chip
                  key={k}
                  label={t(key)}
                  icon={GOAL_ICONS[k]}
                  active={active}
                  onPress={() => toggle('goals', k)}
                />
              );
            })}
          </View>
        </View>

        <View>
          <Text className="text-foreground font-semibold mb-3">
            {t('onboarding.preferences.selfImageTitle')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {SELF_IMAGE_KEYS.map((k) => {
              const key = `onboarding.preferences.selfImage.${k}`;
              const active = selfImage.includes(k);
              return (
                <Chip
                  key={k}
                  label={t(key)}
                  icon={SELF_IMAGE_ICONS[k]}
                  active={active}
                  onPress={() => toggle('selfImage', k)}
                />
              );
            })}
          </View>
        </View>

        {/* Help Areas */}
        <View>
          <Text className="text-foreground font-semibold mb-3">
            {t('onboarding.preferences.helpAreasTitle')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {HELP_AREA_KEYS.map((k) => {
              const key = `onboarding.preferences.helpAreas.${k}`;
              const active = helpAreas.includes(k);
              return (
                <Chip
                  key={k}
                  label={t(key, HELP_AREA_LABELS[k])}
                  icon={HELP_AREA_ICONS[k]}
                  active={active}
                  onPress={() => toggle('helpAreas', k)}
                  className="min-h-12 px-3 py-2.5"
                />
              );
            })}
          </View>
        </View>

        {/* Fears */}
        <View>
          <Text className="text-foreground font-semibold mb-3">
            {t('onboarding.preferences.fearsTitle')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {FEAR_KEYS.map((k) => {
              const key = `onboarding.preferences.fears.${k}`;
              const active = fears.includes(k);
              return (
                <Chip
                  key={k}
                  label={t(key, FEAR_LABELS[k])}
                  icon={FEAR_ICONS[k]}
                  active={active}
                  onPress={() => toggle('fears', k)}
                />
              );
            })}
          </View>
        </View>

        {/* Day-to-day struggles (moved from Mood step) */}
        <View style={{ transform: [{ translateY: -10 }] }}>
          <Text className="text-foreground font-semibold mb-3">
            {t('onboarding.profile.strugglesTitle', 'Day-to-day struggles')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {STRUGGLE_KEYS.map((k) => {
              const key = `onboarding.profile.struggles.${k}`;
              const active = struggles.includes(k);
              return (
                <Chip
                  key={k}
                  label={t(key, STRUGGLE_LABELS[k])}
                  icon={STRUGGLE_ICONS[k]}
                  active={active}
                  onPress={() => toggle('struggles', k)}
                />
              );
            })}
          </View>
        </View>
      </View>

      <View className="mt-auto pb-8 px-5 gap-3">
        <StepProgress current={3} total={4} />
        <Button
          size="lg"
          className="rounded-xl bg-brand-dark-blue"
          onPress={onNext}
        >
          <Text className="text-primary-foreground text-base font-semibold">
            {t('common.next')}
          </Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}

// icons removed per design feedback

function StepProgress({ current, total }: { current: number; total: number }) {
  const pct = (current / total) * 100;
  return (
    <View>
      <View className="h-1.5 bg-card rounded-full overflow-hidden">
        <View
          className="h-full bg-brand-dark-blue rounded-full"
          style={{ width: `${pct}%` }}
        />
      </View>
      <Text className="text-muted-foreground text-xs mt-2">
        {current}/{total}
      </Text>
    </View>
  );
}

function Chip({
  label,
  icon: Icon,
  active,
  onPress,
  className,
}: {
  label: string;
  icon?: LucideIcon;
  active?: boolean;
  onPress?: () => void;
  className?: string;
}) {
  const colors = useColors();
  return (
    <MotiPressable
      onPress={onPress}
      animate={({ pressed }) => {
        'worklet';
        return {
          scale: pressed ? 0.96 : active ? 1.03 : 1,
        };
      }}
      transition={{
        type: 'spring',
        damping: 18,
        stiffness: 240,
      }}
    >
      <Button
        variant={active ? 'default' : 'outline'}
        size="sm"
        className={`rounded-xl px-3.5 py-2 ${active ? 'bg-brand-dark-blue' : 'bg-card border-border'} shadow-sm ${className ?? ''}`}
        pointerEvents="none"
      >
        <View className="flex-row items-center gap-2">
          {Icon ? (
            <Icon
              size={16}
              color={active ? '#FFFFFF' : colors.foreground}
              strokeWidth={2}
            />
          ) : null}
          <Text
            className={active ? 'text-primary-foreground' : 'text-foreground'}
          >
            {label}
          </Text>
        </View>
      </Button>
    </MotiPressable>
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
