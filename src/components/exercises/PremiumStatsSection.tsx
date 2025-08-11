import React from 'react';
import { View, Pressable } from 'react-native';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { Text } from '~/components/ui/text';
import { useColors } from '~/hooks/useColors';

interface PremiumStatsSectionProps {
  completionsThisWeek: number;
  currentStreak: number;
  totalCompletions?: number;
  weeklyGoal?: number;
}

function StatCard({
  title,
  value,
  subtitle,
  progress,
  gradientColors,
  index,
  onPress,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  progress?: number;
  gradientColors?: string[];
  index: number;
  onPress?: () => void;
}) {
  const colors = useColors();

  const handlePress = () => {
    impactAsync(ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <View style={{ flex: 1, marginHorizontal: 6 }}>
      <Pressable
        className="rounded-3xl overflow-hidden bg-black/[0.03] dark:bg-white/[0.03]"
        style={{
          height: 120,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 3,
        }}
        onPress={handlePress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${value}${subtitle ? `. ${subtitle}` : ''}`}
        accessibilityHint="Tap to view detailed statistics"
      >
        <View style={{ flex: 1, padding: 16, justifyContent: 'space-between' }}>
          {/* Header */}
          <View>
            <Text
              className="text-foreground opacity-80 text-xs font-semibold uppercase tracking-wide"
              style={{
                letterSpacing: 0.5,
              }}
              numberOfLines={1}
            >
              {title}
            </Text>
          </View>

          {/* Value */}
          <View style={{ alignItems: 'flex-start' }}>
            <Text
              className="text-foreground text-3xl font-extrabold"
              numberOfLines={1}
            >
              {value}
            </Text>
            {subtitle && (
              <Text
                className="text-foreground font-medium mt-0.5 text-xs"
                numberOfLines={1}
              >
                {subtitle}
              </Text>
            )}
          </View>

          {/* Progress Bar */}
          {progress !== undefined && (
            <View style={{ marginTop: 8 }}>
              <View
                style={{
                  height: 4,
                  backgroundColor: 'rgba(90, 74, 58, 0.1)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    height: '100%',
                    backgroundColor: 'rgba(90, 74, 58, 0.3)',
                    borderRadius: 2,
                    width: `${(progress || 0) * 100}%`,
                  }}
                />
              </View>
            </View>
          )}
        </View>
      </Pressable>
    </View>
  );
}

function InsightBadge({ text, index }: { text: string; index: number }) {
  const colors = useColors();

  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
        borderRadius: 12,
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'rgba(76, 175, 80, 0.2)',
      }}
    >
      <Text
        style={{
          color: colors.success,
          fontWeight: '600',
        }}
      >
        {text}
      </Text>
    </View>
  );
}

export function PremiumStatsSection({
  completionsThisWeek,
  currentStreak,
  totalCompletions = 0,
  weeklyGoal = 7,
}: PremiumStatsSectionProps) {
  const colors = useColors();
  const weekProgress = completionsThisWeek / weeklyGoal;

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return 'Start your journey!';
    if (streak < 3) return 'Building momentum';
    if (streak < 7) return 'Great progress!';
    if (streak < 14) return 'Amazing streak!';
    return 'Incredible dedication!';
  };

  const getWeekMessage = (completed: number, goal: number) => {
    const percentage = (completed / goal) * 100;
    if (percentage >= 100) return 'Goal achieved!';
    if (percentage >= 80) return 'Almost there!';
    if (percentage >= 50) return 'Halfway done';
    return 'Keep going!';
  };

  return (
    // Reduce bottom margin to align spacing with adjacent cards (now 8px)
    <View className="mb-2">
      {/* Main Stats Cards */}
      <View style={{ flexDirection: 'row', marginBottom: 0 }}>
        <StatCard
          title="This Week"
          value={completionsThisWeek}
          subtitle={getWeekMessage(completionsThisWeek, weeklyGoal)}
          progress={weekProgress}
          index={0}
          onPress={() => impactAsync(ImpactFeedbackStyle.Light)}
        />

        <StatCard
          title="Current Streak"
          value={`${currentStreak} days`}
          subtitle={getStreakMessage(currentStreak)}
          index={1}
          onPress={() => impactAsync(ImpactFeedbackStyle.Light)}
        />
      </View>

      {/* Insights */}
      {(completionsThisWeek > 0 || currentStreak > 0) && (
        <View className="mt-2">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {currentStreak >= 7 && (
              <InsightBadge text="⭐ Weekly champion" index={1} />
            )}
            {currentStreak >= 30 && (
              <InsightBadge text="💎 Wellness master" index={2} />
            )}
            {completionsThisWeek === weeklyGoal && (
              <InsightBadge text="🎯 Goal crusher" index={3} />
            )}
          </View>
        </View>
      )}
    </View>
  );
}

export default PremiumStatsSection;
