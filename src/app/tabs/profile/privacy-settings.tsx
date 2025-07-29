import React, { useState, useCallback } from 'react';
import { View, Pressable, Switch } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { SymbolView } from 'expo-symbols';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { cn } from '~/lib/cn';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  iconName: string;
  iconColor: string;
  action?: () => void;
  rightElement?: React.ReactNode;
}

function SettingRow({ item, isLast }: { item: SettingItem; isLast: boolean }) {
  const handlePress = () => {
    if (item.action) {
      impactAsync(ImpactFeedbackStyle.Light);
      item.action();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={!item.action && !item.rightElement}
      className={cn(
        'flex-row items-center p-4',
        !isLast && 'border-b border-border/50'
      )}
    >
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mr-3"
        style={{ backgroundColor: item.iconColor + '20' }}
      >
        <SymbolView
          name={item.iconName as any}
          size={20}
          tintColor={item.iconColor}
        />
      </View>

      <View className="flex-1">
        <Text variant="callout">{item.title}</Text>
        {item.subtitle && (
          <Text variant="body" className="text-muted-foreground mt-0.5">
            {item.subtitle}
          </Text>
        )}
      </View>

      {item.rightElement ||
        (item.action && (
          <SymbolView name="chevron.right" size={20} tintColor="#9CA3AF" />
        ))}
    </Pressable>
  );
}

export default function PrivacySettingsModal() {
  // Privacy settings state
  const [dataCollection, setDataCollection] = useState(true);
  const [analytics, setAnalytics] = useState(true);
  const [chatHistory, setChatHistory] = useState(true);
  const [moodTracking, setMoodTracking] = useState(true);

  const handleBack = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    router.back();
  }, []);

  const toggleDataCollection = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    setDataCollection(!dataCollection);
  }, [dataCollection]);

  const toggleAnalytics = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    setAnalytics(!analytics);
  }, [analytics]);

  const toggleChatHistory = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    setChatHistory(!chatHistory);
  }, [chatHistory]);

  const toggleMoodTracking = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Light);
    setMoodTracking(!moodTracking);
  }, [moodTracking]);

  const handleExportData = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Medium);
    // TODO: Implement data export functionality
    console.log('Export data requested');
  }, []);

  const handleDeleteAccount = useCallback(() => {
    impactAsync(ImpactFeedbackStyle.Heavy);
    // TODO: Implement account deletion flow
    console.log('Delete account requested');
  }, []);

  const privacySettings: SettingItem[] = [
    {
      id: 'data-collection',
      title: 'Data Collection',
      subtitle: 'Allow collection of usage data to improve the app',
      iconName: 'chart.bar.fill',
      iconColor: '#10B981',
      rightElement: (
        <Switch
          value={dataCollection}
          onValueChange={toggleDataCollection}
          trackColor={{ false: '#767577', true: '#4ADE80' }}
          thumbColor="#ffffff"
        />
      ),
    },
    {
      id: 'analytics',
      title: 'Analytics',
      subtitle: 'Share anonymous analytics to help us improve',
      iconName: 'chart.line.uptrend.xyaxis',
      iconColor: '#3B82F6',
      rightElement: (
        <Switch
          value={analytics}
          onValueChange={toggleAnalytics}
          trackColor={{ false: '#767577', true: '#4ADE80' }}
          thumbColor="#ffffff"
        />
      ),
    },
    {
      id: 'chat-history',
      title: 'Chat History Storage',
      subtitle: 'Save chat conversations for continuity',
      iconName: 'message.fill',
      iconColor: '#8B5CF6',
      rightElement: (
        <Switch
          value={chatHistory}
          onValueChange={toggleChatHistory}
          trackColor={{ false: '#767577', true: '#4ADE80' }}
          thumbColor="#ffffff"
        />
      ),
    },
    {
      id: 'mood-tracking',
      title: 'Mood Data Storage',
      subtitle: 'Store mood entries and patterns',
      iconName: 'heart.fill',
      iconColor: '#EF4444',
      rightElement: (
        <Switch
          value={moodTracking}
          onValueChange={toggleMoodTracking}
          trackColor={{ false: '#767577', true: '#4ADE80' }}
          thumbColor="#ffffff"
        />
      ),
    },
  ];

  const dataManagementSettings: SettingItem[] = [
    {
      id: 'export-data',
      title: 'Export My Data',
      subtitle: 'Download a copy of your personal data',
      iconName: 'square.and.arrow.up',
      iconColor: '#06B6D4',
      action: handleExportData,
    },
    {
      id: 'delete-account',
      title: 'Delete Account',
      subtitle: 'Permanently delete your account and all data',
      iconName: 'trash.fill',
      iconColor: '#EF4444',
      action: handleDeleteAccount,
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
          Privacy Settings
        </Text>
      </View>

      <View className="flex-1 p-6">
        {/* Privacy Controls */}
        <Text
          variant="subhead"
          className="mb-3 uppercase text-muted-foreground font-medium"
        >
          Privacy Controls
        </Text>
        <View
          className="rounded-3xl overflow-hidden border border-gray-200 mb-6"
          style={{
            backgroundColor: 'white',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.08,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          {privacySettings.map((item, index) => (
            <SettingRow
              key={item.id}
              item={item}
              isLast={index === privacySettings.length - 1}
            />
          ))}
        </View>

        {/* Data Management */}
        <Text
          variant="subhead"
          className="mb-3 uppercase text-muted-foreground font-medium"
        >
          Data Management
        </Text>
        <View
          className="rounded-3xl overflow-hidden border border-gray-200 mb-6"
          style={{
            backgroundColor: 'white',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.08,
            shadowRadius: 6,
            elevation: 4,
          }}
        >
          {dataManagementSettings.map((item, index) => (
            <SettingRow
              key={item.id}
              item={item}
              isLast={index === dataManagementSettings.length - 1}
            />
          ))}
        </View>

        {/* Privacy Info */}
        <View
          className="p-4 rounded-2xl border border-gray-200"
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
          }}
        >
          <View className="flex-row items-center mb-2">
            <Text style={{ fontSize: 20, marginRight: 8 }}>🔒</Text>
            <Text variant="body" className="text-[#5A4A3A] font-semibold">
              Your Privacy Matters
            </Text>
          </View>
          <Text variant="caption1" className="text-gray-600 leading-5">
            We are committed to protecting your privacy and mental health data.
            You have full control over what information is collected and stored.
            All data is encrypted and securely stored.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
