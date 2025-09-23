import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text } from '~/components/ui/text';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { Linking } from 'react-native';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { safeHaptics } from '../../../lib/haptics';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { cn } from '~/lib/cn';
// import { ProfileLayout } from '~/components/ui/ScreenLayout';
import { useColors } from '~/hooks/useColors';
import { useTranslation } from '~/hooks/useTranslation';
// no safe area needed for this header style
// Removed useIsRTL - text alignment handled by Text component

// FAQ Item Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withSpring(isExpanded ? 180 : 0);
  }, [isExpanded, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const handlePress = () => {
    safeHaptics.impact(ImpactFeedbackStyle.Light);
    setIsExpanded(!isExpanded);
  };

  return (
    <View className="bg-black/[0.03] dark:bg-white/[0.03] rounded-3xl mb-3 overflow-hidden">
      <Pressable
        onPress={handlePress}
        className="p-4"
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <View className="flex-row items-center justify-between">
          <Text variant="body" className="flex-1 pe-3 font-medium">
            {question}
          </Text>
          <Animated.View style={animatedStyle}>
            <SymbolView name="chevron.down" size={16} tintColor="#6B7280" />
          </Animated.View>
        </View>
      </Pressable>

      {isExpanded && (
        <Animated.View entering={FadeInDown.duration(200)}>
          <View className="px-4 pb-4 pt-0">
            <Text
              variant="footnote"
              className="text-muted-foreground leading-5"
            >
              {answer}
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

export default function HelpCenter() {
  const colors = useColors();
  const { t } = useTranslation();
  // Header matches CategoryExerciseList style (no extra safe-area top padding)
  // Text alignment now handled by Text component autoAlign
  const [searchQuery, setSearchQuery] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  const faqs = [
    {
      question: t('helpCenter.faqs.mood.question'),
      answer: t('helpCenter.faqs.mood.answer'),
    },
    {
      question: t('helpCenter.faqs.exercises.question'),
      answer: t('helpCenter.faqs.exercises.answer'),
    },
    {
      question: t('helpCenter.faqs.privacy.question'),
      answer: t('helpCenter.faqs.privacy.answer'),
    },
    {
      question: t('helpCenter.faqs.export.question'),
      answer: t('helpCenter.faqs.export.answer'),
    },
    {
      question: t('helpCenter.faqs.usage.question'),
      answer: t('helpCenter.faqs.usage.answer'),
    },
  ];

  const filteredFAQs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStartChat = () => {
    safeHaptics.impact(ImpactFeedbackStyle.Light);
    setShowChat(true);
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    safeHaptics.impact(ImpactFeedbackStyle.Light);
    // In a real app, this would send the message to customer support
    setChatMessage('');
    // Show confirmation
  };

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
            {t('helpCenter.title')}
          </Text>
          <View style={{ width: 44 }} />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-6">
            {/* Search Bar */}
            <View className="bg-black/[0.03] dark:bg-white/[0.03] rounded-3xl px-4 py-3 mb-6 flex-row items-center">
              <SymbolView
                name="magnifyingglass"
                size={20}
                tintColor="#9CA3AF"
              />
              <TextInput
                placeholder={t('helpCenter.searchPlaceholder')}
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 ms-3 text-base"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Quick Actions */}
            <View className="mb-8">
              <Text
                variant="footnote"
                className="text-muted-foreground mb-3 uppercase tracking-wide"
              >
                {t('helpCenter.quickActions')}
              </Text>

              <Pressable
                onPress={handleStartChat}
                className="bg-brand-dark-blue rounded-3xl p-4 mb-3"
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              >
                <View className="flex-row items-center">
                  <View className="bg-white/20 w-10 h-10 rounded-full items-center justify-center me-3">
                    <SymbolView
                      name="bubble.left.fill"
                      size={20}
                      tintColor="white"
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      variant="callout"
                      className="text-white font-semibold mb-0.5"
                    >
                      {t('helpCenter.chatSupport')}
                    </Text>
                    <Text variant="caption1" className="text-white/80">
                      {t('helpCenter.chatSupportDesc')}
                    </Text>
                  </View>
                  <SymbolView
                    name="chevron.right"
                    size={16}
                    tintColor="white"
                  />
                </View>
              </Pressable>

              <Pressable
                onPress={() => Linking.openURL('https://www.iasp.info/crisis-centres-helplines/')}
                className="bg-black/[0.03] dark:bg-white/[0.03] rounded-3xl p-4"
                style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
              >
                <View className="flex-row items-center">
                  <View className="bg-red-50 w-10 h-10 rounded-full items-center justify-center me-3">
                    <SymbolView
                      name="heart.fill"
                      size={20}
                      tintColor="#EF4444"
                    />
                  </View>
                  <View className="flex-1">
                    <Text variant="callout" className="font-semibold mb-0.5">
                      {t('profile.settings.getHelp')}
                    </Text>
                    <Text variant="caption1" className="text-muted-foreground">
                      {t('profile.settings.crisisSubtitle')}
                    </Text>
                  </View>
                  <SymbolView
                    name="chevron.right"
                    size={16}
                    tintColor="#C6C6C8"
                  />
                </View>
              </Pressable>
            </View>

            {/* FAQs */}
            <View>
              <Text
                variant="footnote"
                className="text-muted-foreground mb-3 uppercase tracking-wide"
              >
                {t('helpCenter.faq')}
              </Text>

              {filteredFAQs.map((faq, index) => (
                <FAQItem
                  key={index}
                  question={faq.question}
                  answer={faq.answer}
                />
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Chat Modal */}
        {showChat && (
          <Animated.View
            entering={FadeInDown.springify()}
            className="absolute inset-0 bg-background"
          >
            {/* Chat Header */}
            <View className="bg-background">
              <View className="flex-row items-center px-4 py-3 mb-2">
                <Pressable
                  onPress={() => setShowChat(false)}
                  className="p-2 me-2"
                  style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
                >
                  <SymbolView name="xmark" size={24} tintColor="#9CA3AF" />
                </Pressable>
                <Text
                  variant="title1"
                  autoAlign={false}
                  className="text-foreground flex-1 text-center"
                >
                  {t('helpCenter.customerSupport')}
                </Text>
                <View style={{ width: 44 }} />
              </View>
            </View>

            {/* Chat Content */}
            <ScrollView className="flex-1 p-6">
              <View className="bg-black/[0.03] dark:bg-white/[0.03] rounded-2xl p-4 mb-4 self-start max-w-[80%]">
                <Text variant="body">{t('helpCenter.chatGreeting')}</Text>
              </View>
            </ScrollView>

            {/* Chat Input */}
            <View className="bg-background border-t border-border/10 p-4">
              <View className="flex-row items-end">
                <TextInput
                  placeholder={t('helpCenter.chatPlaceholder')}
                  value={chatMessage}
                  onChangeText={setChatMessage}
                  multiline
                  className="flex-1 bg-black/[0.03] dark:bg-white/[0.03] rounded-2xl px-4 py-3 max-h-32 text-base"
                  placeholderTextColor="#9CA3AF"
                />
                <Pressable
                  onPress={handleSendMessage}
                  disabled={!chatMessage.trim()}
                  className={cn(
                    'ms-2 w-10 h-10 rounded-full items-center justify-center',
                    chatMessage.trim() ? 'bg-brand-dark-blue' : 'bg-gray-200'
                  )}
                >
                  <SymbolView
                    name="arrow.up"
                    size={20}
                    tintColor={chatMessage.trim() ? 'white' : '#9CA3AF'}
                  />
                </Pressable>
              </View>
            </View>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
