import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Text } from '~/components/ui/text';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import {
  impactAsync,
  notificationAsync,
  ImpactFeedbackStyle,
  NotificationFeedbackType,
} from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from '~/hooks/useTranslation';
import { cn } from '~/lib/cn';

// Feedback Type Card
function FeedbackTypeCard({
  icon,
  title,
  isSelected,
  onPress,
}: {
  icon: string;
  title: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'flex-1 p-4 rounded-xl border-2',
        isSelected ? 'bg-blue-50 border-primary' : 'bg-white border-gray-200'
      )}
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
    >
      <View className="items-center">
        <SymbolView
          name={icon as any}
          size={24}
          tintColor={isSelected ? '#2196F3' : '#6B7280'}
        />
        <Text
          variant="caption1"
          className={cn(
            'mt-2 text-center',
            isSelected ? 'text-primary font-medium' : 'text-muted-foreground'
          )}
        >
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

// Rating Star Component
function RatingStar({
  filled,
  onPress,
}: {
  filled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="p-1">
      <SymbolView
        name={filled ? 'star.fill' : 'star'}
        size={32}
        tintColor={filled ? '#F59E0B' : '#E5E7EB'}
      />
    </Pressable>
  );
}

export default function Feedback() {
  const { t } = useTranslation();
  const [feedbackType, setFeedbackType] = useState<
    'bug' | 'feature' | 'improvement' | 'other'
  >('improvement');
  const [rating, setRating] = useState(0);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const feedbackTypes = [
    {
      id: 'bug',
      icon: 'ladybug',
      title: t('feedback.bugReport'),
    },
    {
      id: 'feature',
      icon: 'lightbulb',
      title: t('feedback.featureRequest'),
    },
    {
      id: 'improvement',
      icon: 'star',
      title: t('feedback.improvement'),
    },
    {
      id: 'other',
      icon: 'ellipsis',
      title: t('feedback.other'),
    },
  ];

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert(t('feedback.missingInfo'), t('feedback.missingInfoDesc'));
      return;
    }

    setIsSubmitting(true);
    impactAsync(ImpactFeedbackStyle.Medium);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      notificationAsync(NotificationFeedbackType.Success);

      Alert.alert(t('feedback.thankYou'), t('feedback.thankYouDesc'), [
        {
          text: t('feedback.ok'),
          onPress: () => router.back(),
        },
      ]);
    }, 1500);
  };

  const handleRating = (star: number) => {
    impactAsync(ImpactFeedbackStyle.Light);
    setRating(star);
  };

  const handleTypeSelect = (
    type: 'bug' | 'feature' | 'improvement' | 'other'
  ) => {
    impactAsync(ImpactFeedbackStyle.Light);
    setFeedbackType(type);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#F2F2F7]"
    >
      {/* Header */}
      <View className="bg-white pt-14 pb-4 px-6 border-b border-border/10">
        <View className="flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="mr-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <SymbolView name="chevron.left" size={24} tintColor="#2196F3" />
          </Pressable>
          <Text variant="title2" className="flex-1">
            {t('feedback.title')}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="p-6">
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            {/* Feedback Type */}
            <Text
              variant="footnote"
              className="text-muted-foreground mb-3 uppercase tracking-wide"
            >
              {t('feedback.feedbackType')}
            </Text>

            <View className="flex-row gap-3 mb-6">
              {feedbackTypes.map((type) => (
                <FeedbackTypeCard
                  key={type.id}
                  icon={type.icon}
                  title={type.title}
                  isSelected={feedbackType === type.id}
                  onPress={() => handleTypeSelect(type.id as any)}
                />
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()}>
            {/* App Rating */}
            <Text
              variant="footnote"
              className="text-muted-foreground mb-3 uppercase tracking-wide"
            >
              {t('feedback.rateExperience')}
            </Text>

            <View className="bg-white rounded-xl p-4 mb-6">
              <Text variant="body" className="text-center mb-3">
                {t('feedback.ratingQuestion')}
              </Text>
              <View className="flex-row justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <RatingStar
                    key={star}
                    filled={star <= rating}
                    onPress={() => handleRating(star)}
                  />
                ))}
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).springify()}>
            {/* Feedback Form */}
            <Text
              variant="footnote"
              className="text-muted-foreground mb-3 uppercase tracking-wide"
            >
              {t('feedback.yourFeedback')}
            </Text>

            <View className="bg-white rounded-xl p-4 mb-4">
              <TextInput
                placeholder={t('feedback.subject')}
                value={subject}
                onChangeText={setSubject}
                className="text-base mb-3 pb-3 border-b border-gray-200"
                placeholderTextColor="#9CA3AF"
              />

              <TextInput
                placeholder={t('feedback.messagePlaceholder')}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                className="text-base min-h-[120px]"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).springify()}>
            {/* Contact Email (Optional) */}
            <View className="bg-white rounded-xl p-4 mb-6">
              <Text variant="caption1" className="text-muted-foreground mb-2">
                {t('feedback.emailOptional')}
              </Text>
              <TextInput
                placeholder={t('feedback.emailPlaceholder')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                className="text-base"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </Animated.View>

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting}
            className={cn(
              'rounded-xl px-6 py-4 flex-row items-center justify-center',
              isSubmitting ? 'bg-gray-400' : 'bg-primary'
            )}
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator
                  size="small"
                  color="white"
                  className="mr-2"
                />
                <Text variant="callout" className="text-white font-medium">
                  {t('feedback.submitting')}
                </Text>
              </>
            ) : (
              <>
                <SymbolView
                  name="paperplane.fill"
                  size={20}
                  tintColor="white"
                />
                <Text variant="callout" className="text-white font-medium ml-2">
                  {t('feedback.submit')}
                </Text>
              </>
            )}
          </Pressable>

          {/* Privacy Note */}
          <Text
            variant="caption2"
            className="text-muted-foreground text-center mt-4 px-4"
          >
            {t('feedback.privacyNote')}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
