import React, { useCallback } from 'react';
import { View, Pressable, Linking } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { SymbolView } from 'expo-symbols';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { cn } from '~/lib/cn';
import { useTranslation } from '~/hooks/useTranslation';

interface SupportItem {
  id: string;
  title: string;
  subtitle?: string;
  iconName: string;
  iconColor: string;
  action?: () => void;
  urgent?: boolean;
}

function SupportRow({ item, isLast }: { item: SupportItem; isLast: boolean }) {
  const handlePress = () => {
    if (item.action) {
      impactAsync(ImpactFeedbackStyle.Light);
      item.action();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={!item.action}
      className={cn(
        'flex-row items-center p-4',
        !isLast && 'border-b border-border/50',
        item.urgent && 'bg-red-50'
      )}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        className={cn(
          'w-12 h-12 rounded-xl items-center justify-center mr-4',
          item.urgent && 'shadow-lg'
        )}
        style={{
          backgroundColor: item.iconColor + (item.urgent ? '30' : '20'),
          shadowColor: item.urgent ? item.iconColor : 'transparent',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: item.urgent ? 0.3 : 0,
          shadowRadius: 4,
          elevation: item.urgent ? 4 : 0,
        }}
      >
        <SymbolView
          name={item.iconName as any}
          size={22}
          tintColor={item.iconColor}
        />
      </View>

      <View className="flex-1">
        <Text
          variant="callout"
          className={cn(
            'font-semibold',
            item.urgent && 'text-red-700 font-bold'
          )}
        >
          {item.title}
        </Text>
        {item.subtitle && (
          <Text
            variant="body"
            className={cn(
              'mt-0.5',
              item.urgent ? 'text-red-600' : 'text-muted-foreground'
            )}
          >
            {item.subtitle}
          </Text>
        )}
      </View>

      {item.action && (
        <SymbolView
          name={'chevron.right' as any}
          size={20}
          tintColor={item.urgent ? '#DC2626' : '#9CA3AF'}
        />
      )}
    </Pressable>
  );
}

export default function SupportModal() {
  const { t } = useTranslation();

  const handleBack = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  const handleEmergencyCall = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Heavy);
    Linking.openURL('tel:988'); // Suicide & Crisis Lifeline
  }, []);

  const handleCrisisText = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Medium);
    Linking.openURL('sms:741741'); // Crisis Text Line
  }, []);

  const handleHelp = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    // TODO: Open help documentation or FAQ
    console.log('Help & FAQ requested');
  }, []);

  const handleFeedback = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    // TODO: Open feedback form
    console.log('Feedback form requested');
  }, []);

  const handleContactSupport = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    Linking.openURL('mailto:support@nafsy.app?subject=Support Request');
  }, []);

  const handleTerms = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    // TODO: Open terms of service
    console.log('Terms of Service requested');
  }, []);

  const handlePrivacyPolicy = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    // TODO: Open privacy policy
    console.log('Privacy Policy requested');
  }, []);

  const crisisSupport: SupportItem[] = [
    {
      id: 'emergency-call',
      title: 'Crisis Hotline',
      subtitle: 'Call 988 - Available 24/7',
      iconName: 'phone.fill',
      iconColor: '#EF4444',
      action: handleEmergencyCall,
      urgent: true,
    },
    {
      id: 'crisis-text',
      title: 'Crisis Text Line',
      subtitle: 'Text HOME to 741741',
      iconName: 'message.fill',
      iconColor: '#EF4444',
      action: handleCrisisText,
      urgent: true,
    },
  ];

  const generalSupport: SupportItem[] = [
    {
      id: 'help',
      title: t('profile.settings.help'),
      subtitle: 'FAQ, guides, and troubleshooting',
      iconName: 'questionmark.circle',
      iconColor: '#06B6D4',
      action: handleHelp,
    },
    {
      id: 'contact',
      title: 'Contact Support',
      subtitle: 'Get help from our support team',
      iconName: 'envelope.fill',
      iconColor: '#10B981',
      action: handleContactSupport,
    },
    {
      id: 'feedback',
      title: 'Send Feedback',
      subtitle: 'Share your thoughts and suggestions',
      iconName: 'star.fill',
      iconColor: '#F59E0B',
      action: handleFeedback,
    },
  ];

  const legalSupport: SupportItem[] = [
    {
      id: 'terms',
      title: 'Terms of Service',
      subtitle: 'Review our terms and conditions',
      iconName: 'doc.text',
      iconColor: '#8B5CF6',
      action: handleTerms,
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      subtitle: 'Learn how we protect your data',
      iconName: 'lock.fill',
      iconColor: '#6B7280',
      action: handlePrivacyPolicy,
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 border-b border-border/20">
        <Pressable onPress={handleBack} className="mr-4">
          <SymbolView name="arrow.left" size={24} tintColor="#5A4A3A" />
        </Pressable>
        <Text variant="title2" className="text-[#2D3748] font-bold">
          {t('profile.sections.support')}
        </Text>
      </View>

      <View className="flex-1 p-6">
        {/* Crisis Support */}
        <Text
          variant="subhead"
          className="mb-3 uppercase text-red-600 font-bold"
        >
          🚨 Crisis Support
        </Text>
        <View
          className="rounded-3xl overflow-hidden border-2 border-red-200 mb-6 bg-red-400/5"
          style={{
            shadowColor: '#EF4444',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          {crisisSupport.map((item, index) => (
            <SupportRow
              key={item.id}
              item={item}
              isLast={index === crisisSupport.length - 1}
            />
          ))}
        </View>

        {/* General Support */}
        <Text
          variant="subhead"
          className="mb-3 uppercase text-muted-foreground font-medium"
        >
          General Support
        </Text>
        <View
          className="rounded-3xl overflow-hidden border border-gray-200 mb-6 bg-card"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.08,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          {generalSupport.map((item, index) => (
            <SupportRow
              key={item.id}
              item={item}
              isLast={index === generalSupport.length - 1}
            />
          ))}
        </View>

        {/* Legal */}
        <Text
          variant="subhead"
          className="mb-3 uppercase text-muted-foreground font-medium"
        >
          Legal
        </Text>
        <View
          className="rounded-3xl overflow-hidden border border-gray-200 mb-6 bg-card"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.08,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          {legalSupport.map((item, index) => (
            <SupportRow
              key={item.id}
              item={item}
              isLast={index === legalSupport.length - 1}
            />
          ))}
        </View>

        {/* Emergency Notice */}
        <View className="p-4 rounded-2xl border-2 border-red-200 bg-red-400/10">
          <View className="flex-row items-center mb-2">
            <Text style={{ fontSize: 20, marginRight: 8 }}>⚠️</Text>
            <Text variant="body" className="text-red-700 font-bold">
              Emergency Notice
            </Text>
          </View>
          <Text variant="caption1" className="text-red-600 leading-5">
            If you&apos;re having thoughts of self-harm or suicide, please reach
            out for immediate help. You&apos;re not alone, and support is
            available 24/7.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
