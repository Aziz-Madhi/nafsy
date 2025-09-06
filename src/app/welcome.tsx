import React from 'react';
import { View, Pressable, Image } from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Brain, BarChart3, Leaf } from 'lucide-react-native';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { useColors } from '~/hooks/useColors';
import { useTranslation } from '~/hooks/useTranslation';
import { useAppStore } from '~/store/useAppStore';

export default function WelcomeScreen() {
  const colors = useColors();
  const { t } = useTranslation();
  const setHasSeenIntro = useAppStore((s) => s.setHasSeenIntro);

  function continueToSignUp() {
    setHasSeenIntro(true);
    router.replace('/auth/sign-up');
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Welcome Illustration - Edge to Edge */}
      <View className="w-full">
        <Image
          source={require('../../assets/welcome Illustration..png')}
          style={{
            width: '100%',
            height: 200,
            resizeMode: 'contain',
          }}
        />
      </View>

      <View className="flex-1 px-6 justify-between">
        {/* Header Section */}
        <View className="items-center">
          {/* Welcome Content - More Compact */}
          <Text
            style={{
              fontFamily: 'AveriaSerif-Bold',
              fontSize: 28,
              lineHeight: 34,
              color: colors.foreground,
              textAlign: 'center',
              marginBottom: 12,
            }}
          >
            {t('onboarding.welcome.title')}
          </Text>

          <Text
            className="text-muted-foreground text-center"
            style={{
              fontSize: 16,
              lineHeight: 22,
              paddingHorizontal: 4,
            }}
          >
            {t('onboarding.welcome.subtitle')}
          </Text>
        </View>

        {/* Enhanced Feature Cards - More Compact */}
        <View className="flex-1 justify-center">
          <View className="gap-4">
            <FeatureCard
              icon={Brain}
              title={t('onboarding.welcome.features.ai.title')}
              desc={t('onboarding.welcome.features.ai.desc')}
              iconColor={colors.moodScale10}
            />
            <FeatureCard
              icon={BarChart3}
              title={t('onboarding.welcome.features.mood.title')}
              desc={t('onboarding.welcome.features.mood.desc')}
              iconColor={colors.moodScale5}
            />
            <FeatureCard
              icon={Leaf}
              title={t('onboarding.welcome.features.exercises.title')}
              desc={t('onboarding.welcome.features.exercises.desc')}
              iconColor={colors.moodScale8}
            />
          </View>
        </View>

        {/* Footer Actions - More Compact */}
        <View className="pb-6">
          <Button
            size="lg"
            className="rounded-2xl mb-3 bg-brand-dark-blue"
            style={{
              minHeight: 48,
            }}
            onPress={continueToSignUp}
          >
            <Text className="text-white text-base font-semibold">
              {t('onboarding.actions.getStarted')}
            </Text>
          </Button>

          <Link href="/auth/sign-in" asChild>
            <Pressable
              onPress={() => setHasSeenIntro(true)}
              className="items-center py-2"
            >
              <Text
                className="font-semibold text-base"
                style={{ color: colors.brandDarkBlue }}
              >
                {t('onboarding.actions.signIn')}
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
  iconColor,
}: {
  icon: React.ComponentType<any>;
  title: string;
  desc: string;
  iconColor: string;
}) {
  return (
    <View className="rounded-xl px-4 py-4 border-0 flex-row items-center bg-black/[0.03] dark:bg-white/[0.03] border-transparent">
      {/* Icon Container */}
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mr-4 flex-shrink-0"
        style={{ backgroundColor: iconColor }}
      >
        <Icon size={20} color="white" strokeWidth={2.5} />
      </View>

      {/* Content */}
      <View className="flex-1">
        <Text
          className="text-lg font-bold mb-1 text-foreground"
          style={{
            fontFamily: 'AveriaSerif-Bold',
          }}
        >
          {title}
        </Text>
        <Text
          className="text-muted-foreground"
          style={{
            fontSize: 14,
            lineHeight: 18,
          }}
        >
          {desc}
        </Text>
      </View>
    </View>
  );
}
