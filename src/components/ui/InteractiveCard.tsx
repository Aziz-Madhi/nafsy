import React from 'react';
import { View, ViewStyle, ImageBackground } from 'react-native';
import { Text } from './text';
import { MotiView } from 'moti';
import { AnimatedPressable } from './AnimatedPressable';
import { IconRenderer } from './IconRenderer';
import { cn } from '~/lib/cn';

interface InteractiveCardProps {
  title: string;
  description?: string;
  iconType: 'category' | 'mood';
  iconName: string;
  color?: string;
  onPress?: () => void;
  index?: number;
  duration?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  variant?: 'category' | 'exercise';
  className?: string;
  style?: ViewStyle;
}

const DIFFICULTY_COLORS = {
  beginner: '#10B981',
  intermediate: '#F59E0B', 
  advanced: '#EF4444',
};

const DIFFICULTY_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export function InteractiveCard({
  title,
  description,
  iconType,
  iconName,
  color = '#5A4A3A',
  onPress,
  index = 0,
  duration,
  difficulty,
  variant = 'category',
  className,
  style,
}: InteractiveCardProps) {
  
  if (variant === 'exercise') {
    // Exercise card design - restored original styling
    const cardContent = (
      <View className="overflow-hidden rounded-2xl bg-white border border-gray-100" style={[{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
      }, style]}>
        <View
          className="h-32 justify-end p-4"
          style={{ backgroundColor: color + '20' }}
        >
          <View className="absolute top-4 right-4 w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: color + '40' }}
          >
            <Text className="text-2xl">{iconName}</Text>
          </View>
          
          <Text variant="title3" className="mb-1 text-[#5A4A3A]" numberOfLines={1} ellipsizeMode="tail">
            {title}
          </Text>
          <Text variant="body" className="text-sm text-[#5A4A3A]/70" numberOfLines={2} ellipsizeMode="tail">
            {description}
          </Text>
        </View>

        <View className="p-4 bg-white/20">
          <View className="flex-row items-center justify-between">
            {/* Duration */}
            {duration && (
              <View className="flex-row items-center">
                <Text variant="body" className="text-sm text-[#5A4A3A]">
                  ⏱ {duration}
                </Text>
              </View>
            )}

            {/* Difficulty */}
            {difficulty && (
              <View className="flex-row items-center">
                <Text
                  variant="body"
                  className="text-sm font-medium"
                  style={{ color: DIFFICULTY_COLORS[difficulty] }}
                >
                  📊 {DIFFICULTY_LABELS[difficulty]}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
    
    if (onPress) {
      return (
        <MotiView 
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ 
            type: 'spring',
            delay: (index ?? 0) * 100,
            damping: 15,
            stiffness: 200 
          }}
          className="mb-4"
        >
          <AnimatedPressable
            onPress={onPress}
            scaleFrom={1}
            scaleTo={0.95}
            hapticType="light"
          >
            {cardContent}
          </AnimatedPressable>
        </MotiView>
      );
    }

    return (
      <MotiView 
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ 
          type: 'spring',
          delay: (index ?? 0) * 100,
          damping: 15,
          stiffness: 200 
        }}
        className="mb-4"
      >
        {cardContent}
      </MotiView>
    );
  }

  // Professional category card design
  const cardContent = (
    <View className={cn('rounded-2xl overflow-hidden', className)} style={[{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      width: '100%',
      flex: 1,
    }, style]}>
      {/* Special handling for mindfulness card with image background */}
      {title === 'Mindfulness' ? (
        <ImageBackground
          source={require('../../../assets/mindfulness-card.png')}
          style={{ flex: 1, minHeight: 200 }}
          imageStyle={{ borderRadius: 16 }}
          resizeMode="cover"
        >
          <View className="flex-1 justify-end p-4 pb-2">
            <Text
              className="text-white font-bold text-center"
              style={{ 
                fontSize: 18, 
                lineHeight: 24, 
                textShadowColor: 'rgba(0,0,0,0.8)', 
                textShadowOffset: {width: 0, height: 2}, 
                textShadowRadius: 6,
                fontWeight: '700'
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
          </View>
        </ImageBackground>
      ) : title === 'Movement' ? (
        <ImageBackground
          source={require('../../../assets/movement-card.png')}
          style={{ flex: 1, minHeight: 200 }}
          imageStyle={{ borderRadius: 16 }}
          resizeMode="cover"
        >
          <View className="flex-1 justify-end p-4 pb-2">
            <Text
              className="text-white font-bold text-center"
              style={{ 
                fontSize: 18, 
                lineHeight: 24, 
                textShadowColor: 'rgba(0,0,0,0.8)', 
                textShadowOffset: {width: 0, height: 2}, 
                textShadowRadius: 6,
                fontWeight: '700'
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
          </View>
        </ImageBackground>
      ) : title === 'Breathing' ? (
        <ImageBackground
          source={require('../../../assets/breathing-card.jpg')}
          style={{ flex: 1, minHeight: 200 }}
          imageStyle={{ borderRadius: 16 }}
          resizeMode="cover"
        >
          <View className="flex-1 justify-end p-4 pb-2">
            <Text
              className="text-white font-bold text-center"
              style={{ 
                fontSize: 18, 
                lineHeight: 24, 
                textShadowColor: 'rgba(0,0,0,0.8)', 
                textShadowOffset: {width: 0, height: 2}, 
                textShadowRadius: 6,
                fontWeight: '700'
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
          </View>
        </ImageBackground>
      ) : title === 'Journaling' ? (
        <ImageBackground
          source={require('../../../assets/journaling-card.png')}
          style={{ flex: 1, minHeight: 200 }}
          imageStyle={{ borderRadius: 16 }}
          resizeMode="cover"
        >
          <View className="flex-1 justify-end p-4 pb-2">
            <Text
              className="text-white font-bold text-center"
              style={{ 
                fontSize: 18, 
                lineHeight: 24, 
                textShadowColor: 'rgba(0,0,0,0.8)', 
                textShadowOffset: {width: 0, height: 2}, 
                textShadowRadius: 6,
                fontWeight: '700'
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
          </View>
        </ImageBackground>
      ) : title === 'Relaxation' ? (
        <ImageBackground
          source={require('../../../assets/relaxation-card.png')}
          style={{ flex: 1, minHeight: 200 }}
          imageStyle={{ borderRadius: 16 }}
          resizeMode="cover"
        >
          <View className="flex-1 justify-end p-4 pb-2">
            <Text
              className="text-white font-bold text-center"
              style={{ 
                fontSize: 18, 
                lineHeight: 24, 
                textShadowColor: 'rgba(0,0,0,0.8)', 
                textShadowOffset: {width: 0, height: 2}, 
                textShadowRadius: 6,
                fontWeight: '700'
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
          </View>
        </ImageBackground>
      ) : title === 'Reminders' ? (
        <ImageBackground
          source={require('../../../assets/reminders-card.png')}
          style={{ flex: 1, minHeight: 200 }}
          imageStyle={{ borderRadius: 16 }}
          resizeMode="cover"
        >
          <View className="flex-1 justify-end p-4 pb-2">
            <Text
              className="text-white font-bold text-center"
              style={{ 
                fontSize: 18, 
                lineHeight: 24, 
                textShadowColor: 'rgba(0,0,0,0.8)', 
                textShadowOffset: {width: 0, height: 2}, 
                textShadowRadius: 6,
                fontWeight: '700'
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
          </View>
        </ImageBackground>
      ) : (
        /* Regular card design for other categories */
        <View style={{ backgroundColor: color, flex: 1 }}>
          {/* Icon and Content */}
          <View className="flex-1 p-6">
            {/* Icon at the top/center */}
            <View className="flex-1 items-center justify-center">
              <View 
                className="w-20 h-20 rounded-full items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
              >
                {/* Check if iconName is an emoji (for category cards) */}
                {/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(iconName) ? (
                  <Text style={{ fontSize: 32 }}>{iconName}</Text>
                ) : (
                  <IconRenderer
                    iconType={iconType}
                    iconName={iconName}
                    size={32}
                    color="#FFFFFF"
                  />
                )}
              </View>
            </View>
            
            {/* Text at the bottom */}
            <View className="items-center pb-1">
              <Text
                className="text-white font-bold text-center"
                style={{ fontSize: 18, lineHeight: 24, fontWeight: '700' }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {title}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <MotiView 
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ 
          type: 'spring',
          delay: (index ?? 0) * 100,
          damping: 15,
          stiffness: 200 
        }}
      >
        <AnimatedPressable
          onPress={onPress}
          scaleFrom={1}
          scaleTo={0.95}
          hapticType="light"
        >
          {cardContent}
        </AnimatedPressable>
      </MotiView>
    );
  }

  return (
    <MotiView 
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ 
        type: 'spring',
        delay: (index ?? 0) * 100,
        damping: 15,
        stiffness: 200 
      }}
    >
      {cardContent}
    </MotiView>
  );
}