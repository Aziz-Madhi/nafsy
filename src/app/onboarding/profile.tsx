import React, { useEffect, useMemo, useState } from 'react';
import { View, Pressable, Platform, Image, Keyboard } from 'react-native';
import { AnimatePresence, MotiView } from 'moti';
import { MotiPressable } from 'moti/interactions';
import { MenuView } from '@react-native-menu/menu';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Cloud, CloudDrizzle, CloudSun, Sun, AlertTriangle, Brain, Target, Users, Moon, MessageSquare, Wind, Flower2, BookOpen } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { FormField } from '~/components/ui/FormField';
import { useColors } from '~/hooks/useColors';
import { useTranslation } from '~/hooks/useTranslation';
import { useOnboardingStore } from '~/store/useOnboardingStore';
import RatingSelector from '~/components/mood/RatingSelector';
import { useUserSafe } from '~/lib/useUserSafe';
import { cn } from '~/lib/cn';

type LocalStep = 'profile' | 'mood' | 'preferencesA' | 'preferencesB' | 'notes' | 'complete';

export default function ProfileStep() {
  const colors = useColors();
  const { t } = useTranslation();
  const { user } = useUserSafe();
  const name = useOnboardingStore((s) => s.name);
  const age = useOnboardingStore((s) => s.age);
  const gender = useOnboardingStore((s) => s.gender);
  const existingMoodRating = useOnboardingStore((s) => s.moodRating) || 5;
  const moodMonth = useOnboardingStore((s) => s.moodMonth);
  const goals = useOnboardingStore((s) => s.goals);
  const selfImage = useOnboardingStore((s) => s.selfImage);
  const helpAreas = useOnboardingStore((s) => s.helpAreas);
  const struggles = useOnboardingStore((s) => s.struggles);
  const additionalNotes = useOnboardingStore((s) => s.additionalNotes);
  const toggle = useOnboardingStore((s) => s.toggleArrayValue);
  const setField = useOnboardingStore((s) => s.setField);
  const [localName, setLocalName] = useState(name ?? '');
  const [selectedAge, setSelectedAge] = useState<number | null>(
    age ?? null
  );
  const [selectedGender, setSelectedGender] = useState<
    'male' | 'female' | 'other' | null
  >(gender ?? null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<LocalStep>('profile');
  const [moodValue, setMoodValue] = useState(existingMoodRating);

  // Precompute picker items outside conditional rendering to avoid conditional hooks
  const ageItems = useMemo(
    () => [{ label: t('onboarding.profile.agePlaceholder', 'Optional'), value: null as number | null }].concat(
      AGE_OPTIONS.map((a) => ({ label: String(a), value: a }))
    ),
    [t]
  );

  const genderItems = useMemo(
    () => [
      { label: t('common.select', 'Select'), value: null as any },
      { label: t('onboarding.profile.genders.male', 'Male'), value: 'male' },
      { label: t('onboarding.profile.genders.female', 'Female'), value: 'female' },
      { label: t('onboarding.profile.genders.other', 'Other'), value: 'other' },
    ],
    [t]
  );

  useEffect(() => {
    if (!name && user?.fullName) {
      setLocalName(user.fullName);
    }
  }, [name, user?.fullName]);

  function onNext() {
    Keyboard.dismiss();
    if (step === 'profile') {
      if (!localName.trim()) {
        setError(t('onboarding.validation.nameRequired'));
        return;
      }
      setError(null);
      setField('name', localName.trim());
      setField('age', selectedAge ?? null);
      setField('gender', selectedGender ?? null);
      setStep('mood');
      return;
    }

    if (step === 'mood') {
      setField('moodRating', moodValue);
      setField('moodMonth', moodMonth || null);
      setStep('preferencesA');
      return;
    }

    if (step === 'preferencesA') {
      setStep('preferencesB');
      return;
    }

    if (step === 'preferencesB') {
      setStep('notes');
      return;
    }

    if (step === 'notes') {
      router.push('/onboarding/complete');
      return;
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Top spacer to preserve previous padding after removing header */}
      <View className="px-5 pt-3">
        <View style={{ height: 40, marginBottom: 8 }} />
      </View>
      <View className="flex-1 px-5 items-center">
        {/** Reserve space for the logo; move the logo independently using absolute top offset */}
        <View className="w-full" style={{ height: 174, marginBottom: 16, position: 'relative' }}>
          <Image
            key="default-icon"
            source={require('../../../assets/Cards/Subject 3.png')}
            style={{ 
              width: 174, 
              height: 174, 
              resizeMode: 'contain', 
              position: 'absolute', 
              top: -15, 
              alignSelf: 'center' 
            }}
          />
        </View>

        <AnimatePresence exitBeforeEnter initial={false}>
          <MotiView
            key={`hdr-${step}`}
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'timing', duration: 140 }}
            className="w-full"
          >
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
              {step === 'profile'
                ? t('onboarding.profile.title')
                : step === 'mood'
                ? t('onboarding.mood.title')
                : step === 'notes'
                ? t('onboarding.notes.title', 'Anything else to share?')
                : t('onboarding.preferences.title')}
            </Text>
            <Text className="text-muted-foreground mt-2 text-center" style={{ textAlign: 'center' }}>
              {step === 'profile'
                ? t('onboarding.profile.subtitle')
                : step === 'mood'
                ? t('onboarding.mood.subtitle')
                : step === 'notes'
                ? t('onboarding.notes.subtitle', 'Add any extra context you want us to consider.')
                : t('onboarding.preferences.subtitle')}
            </Text>
          </MotiView>
        </AnimatePresence>
        <AnimatePresence exitBeforeEnter initial={false}>
          <MotiView
            key={`cnt-${step}`}
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'timing', duration: 160 }}
            style={{ width: '100%' }}
          >
        {step === 'profile' ? (
          <View className="mt-6 gap-4 w-full">
            <FormField
              label={t('onboarding.profile.name')}
              placeholder={t('onboarding.profile.namePlaceholder')}
              value={localName}
              onChangeText={setLocalName}
              autoComplete="name"
              error={error || undefined}
            />
            {/* Age + Gender in one row */}
            <View className="flex-row gap-3 items-start">
              <PickerSelectField
                containerClassName="flex-1"
                label={t('onboarding.profile.age')}
                placeholder={t('onboarding.profile.agePlaceholder', 'Optional')}
                selectedLabel={selectedAge ? String(selectedAge) : undefined}
                items={ageItems}
                value={selectedAge}
                onChange={(v) => setSelectedAge((v as number | null) ?? null)}
              />

              <PickerSelectField
                containerClassName="flex-1"
                label={t('onboarding.profile.gender')}
                placeholder={t('common.select', 'Select')}
                selectedLabel={
                  selectedGender
                    ? t(`onboarding.profile.genders.${selectedGender}`)
                    : undefined
                }
                items={genderItems}
                value={selectedGender}
                onChange={(v) => setSelectedGender((v as any) ?? null)}
              />
            </View>
          </View>
        ) : step === 'mood' ? (
          <View className="w-full">
            <View className="mt-6 items-center px-5">
              <RatingSelector value={moodValue} onChange={setMoodValue} />
            </View>
            <View className="mt-10 px-8">
              <Text className="text-foreground font-semibold mb-4">
                {t(
                  'onboarding.mood.lastMonth.title',
                  'How was your mood in the past month?'
                )}
              </Text>
              {/* Two-column grid for mood options with odd number handling */}
              <View className="flex-row gap-4 self-center w-full">
                <View className="flex-1 gap-3 items-stretch">
                  {MONTH_MOOD_KEYS.filter((_, i) => i % 2 === 0).map((k) => (
                    <Choice
                      key={k}
                      label={t(
                        `onboarding.mood.lastMonth.options.${k}`,
                        MONTH_MOOD_LABELS[k]
                      )}
                      icon={MONTH_MOOD_ICONS[k]}
                      active={moodMonth === k}
                      onPress={() => setField('moodMonth', k)}
                      className="w-full"
                    />
                  ))}
                </View>
                <View className="flex-1 gap-3 items-stretch">
                  {MONTH_MOOD_KEYS.filter((_, i) => i % 2 === 1).map((k) => (
                    <Choice
                      key={k}
                      label={t(
                        `onboarding.mood.lastMonth.options.${k}`,
                        MONTH_MOOD_LABELS[k]
                      )}
                      icon={MONTH_MOOD_ICONS[k]}
                      active={moodMonth === k}
                      onPress={() => setField('moodMonth', k)}
                      className="w-full"
                    />
                  ))}
                </View>
              </View>
            </View>
          </View>
        ) : step === 'preferencesA' ? (
          <View className="w-full px-8 mt-6 gap-7">
            <View>
              <Text className="text-foreground font-semibold mb-4 px-2">
                {t('onboarding.preferences.goalsTitle')}
              </Text>
              {/* Two-column grid for goals */}
              <View className="flex-row gap-4 self-center w-full">
                <View className="flex-1 gap-3 items-stretch">
                  {GOAL_KEYS.filter((_, i) => i % 2 === 0).map((k) => {
                    const key = `onboarding.preferences.goals.${k}`;
                    const active = goals.includes(k);
                    return (
                      <Chip
                        key={k}
                        label={t(key)}
                        icon={GOAL_ICONS[k]}
                        active={active}
                        onPress={() => toggle('goals', k)}
                        className="w-full"
                      />
                    );
                  })}
                </View>
                <View className="flex-1 gap-3 items-stretch">
                  {GOAL_KEYS.filter((_, i) => i % 2 === 1).map((k) => {
                    const key = `onboarding.preferences.goals.${k}`;
                    const active = goals.includes(k);
                    return (
                      <Chip
                        key={k}
                        label={t(key)}
                        icon={GOAL_ICONS[k]}
                        active={active}
                        onPress={() => toggle('goals', k)}
                        className="w-full"
                      />
                    );
                  })}
                </View>
              </View>
            </View>

            <View>
              <Text className="text-foreground font-semibold mb-4 px-2">
                {t('onboarding.preferences.selfImageTitle')}
              </Text>
              {/* Two-column grid for self image */}
              <View className="flex-row gap-4 self-center w-full">
                <View className="flex-1 gap-3 items-stretch">
                  {SELF_IMAGE_KEYS.filter((_, i) => i % 2 === 0).map((k) => {
                    const key = `onboarding.preferences.selfImage.${k}`;
                    const active = selfImage.includes(k);
                    return (
                      <Chip
                        key={k}
                        label={t(key)}
                        icon={SELF_IMAGE_ICONS[k]}
                        active={active}
                        onPress={() => toggle('selfImage', k)}
                        className="w-full"
                      />
                    );
                  })}
                </View>
                <View className="flex-1 gap-3 items-stretch">
                  {SELF_IMAGE_KEYS.filter((_, i) => i % 2 === 1).map((k) => {
                    const key = `onboarding.preferences.selfImage.${k}`;
                    const active = selfImage.includes(k);
                    return (
                      <Chip
                        key={k}
                        label={t(key)}
                        icon={SELF_IMAGE_ICONS[k]}
                        active={active}
                        onPress={() => toggle('selfImage', k)}
                        className="w-full"
                      />
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        ) : step === 'preferencesB' ? (
          <View className="w-full px-8 mt-6 gap-8" style={{ marginBottom: 10 }}>
            <View>
              <Text className="text-foreground font-semibold mb-4 px-2">
                {t('onboarding.preferences.helpAreasTitle', 'Help areas')}
              </Text>
              {/* Two-column grid with improved spacing */}
              <View className="flex-row gap-4 self-center w-full">
                <View className="flex-1 gap-3 items-stretch">
                  {HELP_AREA_KEYS.filter((_, i) => i % 2 === 0).map((k) => {
                    const key = `onboarding.preferences.helpAreas.${k}`;
                    const active = helpAreas.includes(k);
                    return (
                      <Chip
                        key={k}
                        label={formatHelpLabel(k, t(key))}
                        icon={HELP_AREA_ICONS[k]}
                        active={active}
                        onPress={() => toggle('helpAreas', k)}
                        className="w-full min-h-12 px-3 py-2.5"
                      />
                    );
                  })}
                </View>
                <View className="flex-1 gap-3 items-stretch">
                  {HELP_AREA_KEYS.filter((_, i) => i % 2 === 1).map((k) => {
                    const key = `onboarding.preferences.helpAreas.${k}`;
                    const active = helpAreas.includes(k);
                    return (
                      <Chip
                        key={k}
                        label={formatHelpLabel(k, t(key))}
                        icon={HELP_AREA_ICONS[k]}
                        active={active}
                        onPress={() => toggle('helpAreas', k)}
                        className="w-full min-h-12 px-3 py-2.5"
                      />
                    );
                  })}
                </View>
              </View>
            </View>

            <View style={{ transform: [{ translateY: -10 }] }}>
              <Text className="text-foreground font-semibold mb-4 px-2">
                {t('onboarding.profile.strugglesTitle', 'Day-to-day struggles')}
              </Text>
              {/* Two-column grid for struggles */}
              <View className="flex-row gap-4 self-center w-full">
                <View className="flex-1 gap-3 items-stretch">
                  {STRUGGLE_KEYS.slice(0, 4).filter((_, i) => i % 2 === 0).map((k) => {
                    const key = `onboarding.profile.struggles.${k}`;
                    const active = struggles.includes(k);
                    return (
                      <Chip
                        key={k}
                        label={t(key, STRUGGLE_LABELS[k])}
                        icon={STRUGGLE_ICONS[k]}
                        active={active}
                        onPress={() => toggle('struggles', k)}
                        className="w-full"
                      />
                    );
                  })}
                </View>
                <View className="flex-1 gap-3 items-stretch">
                  {STRUGGLE_KEYS.slice(0, 4).filter((_, i) => i % 2 === 1).map((k) => {
                    const key = `onboarding.profile.struggles.${k}`;
                    const active = struggles.includes(k);
                    return (
                      <Chip
                        key={k}
                        label={t(key, STRUGGLE_LABELS[k])}
                        icon={STRUGGLE_ICONS[k]}
                        active={active}
                        onPress={() => toggle('struggles', k)}
                        className="w-full"
                      />
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        ) : step === 'notes' ? (
          <Pressable onPress={Keyboard.dismiss} className="flex-1 w-full px-8 mt-6 gap-6">
            <FormField
              label={''}
              labelClassName="h-0"
              containerClassName="gap-0"
              placeholder={t('onboarding.notes.placeholder', 'Share anything else you want us to know...')}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={additionalNotes ?? ''}
              onChangeText={(v) => setField('additionalNotes', v)}
              inputClassName="min-h-36"
            />
          </Pressable>
        ) : null}
          </MotiView>
        </AnimatePresence>
      </View>

      <View className="mt-auto pb-8 px-5 gap-4">
        <StepDots current={step === 'profile' ? 1 : step === 'mood' ? 2 : 3} total={4} />
        <View className="flex-row gap-3 items-stretch">
          <Button
            variant="outline"
            size="lg"
            className="rounded-xl w-14 px-0 active:bg-transparent"
            android_ripple={{ color: 'transparent' }}
            onPress={() => {
              if (step === 'mood') return setStep('profile');
              if (step === 'preferencesA') return setStep('mood');
              if (step === 'preferencesB') return setStep('preferencesA');
              if (step === 'notes') return setStep('preferencesB');
              if (typeof (router as any).canGoBack === 'function' && (router as any).canGoBack()) {
                return router.back();
              }
              return router.replace('/tabs/chat');
            }}
          >
            <ChevronLeft size={20} color={colors.foreground} />
          </Button>
          <Button size="lg" className="rounded-xl bg-brand-dark-blue flex-1" onPress={onNext}>
            <Text className="text-primary-foreground text-base font-semibold">
              {t('common.next')}
            </Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <View className="mb-1 items-center">
      <View className="flex-row gap-2">
        {Array.from({ length: total }).map((_, i) => {
          const isActive = i === current - 1;
          return (
            <MotiView
              key={i}
              from={{ width: 8, opacity: 0.9, scale: 1 }}
              animate={{ width: isActive ? 18 : 8, opacity: 1, scale: isActive ? 1.05 : 1 }}
              transition={{ type: 'timing', duration: 180 }}
              className={isActive ? 'bg-brand-dark-blue' : 'bg-card'}
              style={{ height: 8, borderRadius: 9999 }}
            />
          );
        })}
      </View>
    </View>
  );
}

function StepProgress({ current, total }: { current: number; total: number }) {
  const pct = (current / total) * 100;
  return (
    <View>
      <View className="h-1.5 bg-card rounded-full overflow-hidden">
        <View className="h-full bg-brand-dark-blue rounded-full" style={{ width: `${pct}%` }} />
      </View>
      <Text className="text-muted-foreground text-xs mt-2">{current}/{total}</Text>
    </View>
  );
}

function Choice({
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
      transition={({ pressed }) => {
        'worklet';
        return {
          type: pressed ? 'timing' : 'spring',
          damping: 18,
          stiffness: 240,
        } as const;
      }}
    >
      <Button
        variant={active ? 'default' : 'outline'}
        size="sm"
        className={`h-auto min-h-12 rounded-xl px-4 py-3 ${active ? 'bg-brand-dark-blue' : 'bg-black/[0.03] dark:bg-white/[0.03] border-transparent'} ${className ?? ''}`}
        pointerEvents="none"
      >
        <View className="flex-row items-center gap-2.5 justify-center">
          {Icon ? (
            <Icon size={16} color={active ? '#FFFFFF' : colors.foreground} strokeWidth={2} />
          ) : null}
          <Text className={active ? 'text-primary-foreground' : 'text-foreground'} style={{ fontSize: 14, fontWeight: '500' }}>
            {label}
          </Text>
        </View>
      </Button>
    </MotiPressable>
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
      transition={({ pressed }) => {
        'worklet';
        return {
          type: pressed ? 'timing' : 'spring',
          damping: 18,
          stiffness: 240,
        } as const;
      }}
    >
      <Button
        variant={active ? 'default' : 'outline'}
        size="sm"
        className={`h-auto min-h-14 rounded-xl px-4 py-3.5 ${active ? 'bg-brand-dark-blue' : 'bg-black/[0.03] dark:bg-white/[0.03] border-transparent'} ${className ?? ''}`}
        pointerEvents="none"
      >
        <View className="flex-row items-center gap-2.5 justify-center">
          {Icon ? (
            <Icon size={16} color={active ? '#FFFFFF' : colors.foreground} strokeWidth={2} />
          ) : null}
          <Text 
            className={active ? 'text-primary-foreground' : 'text-foreground'} 
            style={{ fontSize: 14, fontWeight: '500', textAlign: 'center' }}
            numberOfLines={2}
          >
            {label}
          </Text>
        </View>
      </Button>
    </MotiPressable>
  );
}

const MONTH_MOOD_KEYS = [
  'low',
  'average',
  'good',
  'very_good',
] as const;

const MONTH_MOOD_LABELS: Record<(typeof MONTH_MOOD_KEYS)[number], string> = {
  low: 'Low',
  average: 'Average',
  good: 'Good',
  very_good: 'Happy',
};

const MONTH_MOOD_ICONS: Record<(typeof MONTH_MOOD_KEYS)[number], LucideIcon> = {
  low: CloudDrizzle,
  average: CloudSun,
  good: Sun,
  very_good: Sun,
};

// Preferences data (same as preferences.tsx)
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

const GOAL_ICONS: Record<(typeof GOAL_KEYS)[number], LucideIcon> = {
  reduceAnxiety: Brain,
  improveSleep: Moon,
  buildMindfulness: Sun,
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

const HELP_AREA_LABELS: Record<(typeof HELP_AREA_KEYS)[number], string> = {
  talkToSomeone: 'Talk to someone',
  structuredTherapy: 'Structured therapy guidance',
  breathingGuidance: 'Breathing guidance',
  mindfulnessPractice: 'Mindfulness practice',
  journalingPrompts: 'Journaling prompts',
  dailyCheckins: 'Daily check-ins',
};

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

// Compact label formatter to allow manual line breaks for some long labels
function formatHelpLabel(key: (typeof HELP_AREA_KEYS)[number], text: string) {
  // Preserve translated text as-is. The previous implementation forced
  // English labels with manual line breaks, which broke Arabic.
  // If we need manual breaks in the future, handle it per-locale.
  return text;
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

// Age range 13..75 per design
const AGE_OPTIONS = Array.from({ length: 63 }, (_, i) => i + 13);

type PickerItem = { label: string; value: string | number | null };

function PickerSelectField({
  label,
  placeholder,
  selectedLabel,
  items,
  value,
  onChange,
  containerClassName,
}: {
  label: string;
  placeholder: string;
  selectedLabel?: string;
  items: PickerItem[];
  value: string | number | null;
  onChange: (val: string | number | null) => void;
  containerClassName?: string;
}) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const [triggerHeight, setTriggerHeight] = useState(0);

  useEffect(() => {
    // noop
  }, [value]);

  return (
    <View className={cn('gap-2', containerClassName)} style={{ position: 'relative' }}>
      <Text className="text-sm font-medium text-muted-foreground ml-1">{label}</Text>
      {Platform.OS === 'ios' ? (
        <View className="rounded-xl bg-gray-50/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 overflow-hidden">
          <Pressable
            accessibilityRole="button"
            onPress={() => setOpen((prev) => !prev)}
            className="px-4 py-3"
            onLayout={(e) => setTriggerHeight(e.nativeEvent.layout.height)}
          >
            <Text className={selectedLabel ? 'text-foreground' : 'text-muted-foreground'}>
              {selectedLabel ?? placeholder}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View className="rounded-xl bg-gray-50/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 overflow-hidden">
          <Pressable
            accessibilityRole="button"
            onPress={() => setOpen((prev) => !prev)}
            className="px-4 py-3"
            onLayout={(e) => setTriggerHeight(e.nativeEvent.layout.height)}
          >
            <Text className={selectedLabel ? 'text-foreground' : 'text-muted-foreground'}>
              {selectedLabel ?? placeholder}
            </Text>
          </Pressable>
        </View>
      )}

      {open ? (
        <MotiView
          from={{ opacity: 0, scale: 0.98, translateY: -4 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 160 }}
          className="rounded-xl shadow-sm"
          style={{
            position: 'absolute',
            top: triggerHeight + 28,
            left: 0,
            right: 0,
            zIndex: 50,
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.06)',
            overflow: 'hidden',
            height: 96,
            borderRadius: 12,
          }}
        >
          <Picker
            selectedValue={value as any}
            onValueChange={(v) => onChange(v as any)}
            itemStyle={{ fontSize: 18 }}
            style={{ height: 216, transform: [{ translateY: -60 }] }}
          >
            {items.map((it) => (
              <Picker.Item key={`${it.label}-${it.value}`} label={String(it.label)} value={it.value as any} />
            ))}
          </Picker>
        </MotiView>
      ) : null}
    </View>
  );
}

function flattenItems(items: PickerItem[]): PickerItem[] {
  return items;
}

function buildMenuActions(items: PickerItem[]) {
  // Use native submenus to keep the popup compact when many numeric items exist (Age)
  const numeric = items.filter((it) => typeof it.value === 'number') as Array<{ label: string; value: number }>;
  const others = items.filter((it) => typeof it.value !== 'number');

  if (numeric.length > 12) {
    const groups: Record<string, { label: string; value: number }[]> = {};
    for (const it of numeric) {
      const decadeStart = Math.floor((it.value as number) / 10) * 10;
      const decade = `${decadeStart}s`;
      (groups[decade] ||= []).push(it as any);
    }
    const decadeActions = Object.keys(groups)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map((decade) => ({
        id: `decade_${decade}`,
        title: decade,
        subactions: groups[decade]
          .sort((a, b) => (a.value as number) - (b.value as number))
          .map((it) => ({ id: String(it.value), title: it.label })),
      }));
    return [
      ...others.map((it) => ({ id: String(it.value), title: it.label })),
      ...decadeActions,
    ];
  }

  return items.map((it) => ({ id: String(it.value), title: it.label }));
}
