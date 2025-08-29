import React, { useMemo } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import { MotiView } from 'moti';
import { Sun, Moon, CheckCircle, ChevronRight } from 'lucide-react-native';
import { useColors, useShadowStyle } from '~/hooks/useColors';
import { useTranslation } from '~/hooks/useTranslation';
import { cn } from '~/lib/cn';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';

interface MoodLogReminderProps {
  hasMorningMood: boolean;
  hasEveningMood: boolean;
  isMorning: boolean;
  onPress?: () => void;
}

export function MoodLogReminder({
  hasMorningMood,
  hasEveningMood,
  isMorning,
  onPress,
}: MoodLogReminderProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const shadowMedium = useShadowStyle('medium');
  const isDarkMode = colors.background === '#0A1514';

  // Calculate progress
  const moodsLogged = (hasMorningMood ? 1 : 0) + (hasEveningMood ? 1 : 0);
  const hasLoggedCurrentPeriod = isMorning ? hasMorningMood : hasEveningMood;
  const hasLoggedBothToday = hasMorningMood && hasEveningMood;

  // Determine the current state and message
  const reminderState = useMemo(() => {
    if (hasLoggedBothToday) {
      return {
        type: 'complete' as const,
        icon: CheckCircle,
        iconColor: colors.success,
        title: t('mood.reminder.complete.title'),
        subtitle: t('mood.reminder.complete.subtitle'),
      };
    }

    if (hasLoggedCurrentPeriod) {
      // Current period logged, remind for next period
      const nextPeriod = isMorning ? 'evening' : 'morning';
      const NextIcon = nextPeriod === 'evening' ? Moon : Sun;

      return {
        type: 'partial' as const,
        icon: NextIcon,
        iconColor: nextPeriod === 'evening' ? colors.info : colors.warning,
        title: t('mood.reminder.partial.title'),
        subtitle: t(`mood.reminder.partial.${nextPeriod}`),
      };
    }

    // This case should not happen now as we return null above
    // But keeping for safety
    const CurrentIcon = isMorning ? Sun : Moon;

    return {
      type: 'prompt' as const,
      icon: CurrentIcon,
      iconColor: isMorning ? colors.warning : colors.info,
      title: t(`mood.reminder.prompt.${isMorning ? 'morning' : 'evening'}`),
      subtitle: t('mood.reminder.prompt.subtitle'),
    };
  }, [
    hasMorningMood,
    hasEveningMood,
    hasLoggedCurrentPeriod,
    hasLoggedBothToday,
    isMorning,
    t,
    colors,
    isDarkMode,
  ]);

  const Icon = reminderState.icon;

  const handlePress = () => {
    if (onPress && !hasLoggedCurrentPeriod) {
      impactAsync(ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  // Don't show the reminder if no moods are logged yet
  // This prevents duplication with the main mood entry card
  if (moodsLogged === 0) {
    return null;
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: -10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400 }}
      className="mb-4"
      style={{ marginHorizontal: 6 }}
    >
      <Pressable
        onPress={handlePress}
        disabled={hasLoggedCurrentPeriod}
        className={cn(
          'rounded-3xl overflow-hidden',
          !hasLoggedCurrentPeriod && 'active:scale-[0.98]'
        )}
      >
        <View
          className="flex-row items-center p-4 bg-black/[0.03] dark:bg-white/[0.03] rounded-3xl"
          style={{
            ...shadowMedium,
          }}
        >
          {/* Icon Container */}
          <MotiView
            from={{ scale: 0, rotate: '0deg' }}
            animate={{
              scale: 1,
              rotate: reminderState.type === 'complete' ? '360deg' : '0deg',
            }}
            transition={{
              type: 'spring',
              damping: 12,
              stiffness: 100,
              delay: 100,
            }}
            className="mr-3"
          >
            <View
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{
                backgroundColor: isDarkMode
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(0, 0, 0, 0.05)',
              }}
            >
              <Icon size={24} color={reminderState.iconColor} strokeWidth={2} />
            </View>
          </MotiView>

          {/* Text Content */}
          <View className="flex-1">
            <Text
              variant="subheadline"
              className="font-semibold mb-0.5"
              style={{ color: colors.foreground }}
            >
              {reminderState.title}
            </Text>
            <Text
              variant="caption1"
              style={{
                color: colors.foreground,
                opacity: 0.7,
              }}
            >
              {reminderState.subtitle}
            </Text>
          </View>

          {/* Progress Indicator */}
          <View className="items-center ml-3">
            <View className="flex-row items-center gap-1.5 mb-1">
              {/* Morning Indicator */}
              <View
                className={cn(
                  'w-2 h-2 rounded-full',
                  hasMorningMood
                    ? 'bg-success'
                    : isDarkMode
                      ? 'bg-white/20'
                      : 'bg-black/20'
                )}
              />
              {/* Evening Indicator */}
              <View
                className={cn(
                  'w-2 h-2 rounded-full',
                  hasEveningMood
                    ? 'bg-success'
                    : isDarkMode
                      ? 'bg-white/20'
                      : 'bg-black/20'
                )}
              />
            </View>
            <Text
              variant="caption2"
              style={{
                color: colors.foreground,
                opacity: 0.5,
                fontSize: 11,
              }}
            >
              {moodsLogged}/2
            </Text>
          </View>

          {/* Action Indicator */}
          {!hasLoggedCurrentPeriod && (
            <MotiView
              from={{ opacity: 0, translateX: -10 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'timing', duration: 300, delay: 200 }}
              className="ml-2"
            >
              <ChevronRight
                size={20}
                color={colors.foreground}
                strokeWidth={2}
                style={{ opacity: 0.4 }}
              />
            </MotiView>
          )}
        </View>
      </Pressable>
    </MotiView>
  );
}
