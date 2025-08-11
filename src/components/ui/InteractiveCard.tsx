import React from 'react';
import {
  View,
  ViewStyle,
  ImageBackground,
  ImageSourcePropType,
} from 'react-native';
// import { MotiView } from 'moti';
import { Text } from './text';
import { IconRenderer } from './IconRenderer';
// import { AnimatedPressable } from './AnimatedPressable';
import { cn } from '~/lib/cn';
import { StaggeredListItem } from '~/lib/animations';
import { useColors } from '~/hooks/useColors';

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
  backgroundImage?: ImageSourcePropType;
}

const DIFFICULTY_COLORS = {
  beginner: '#10B981',
  intermediate: '#F59E0B',
  advanced: '#EF4444',
} as const;

const DIFFICULTY_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
} as const;

// Background image mapping moved to data layer
const CATEGORY_BACKGROUNDS: Record<string, ImageSourcePropType> = {
  Mindfulness: require('../../../assets/mindfulness-card.png'),
  Movement: require('../../../assets/movement-card.png'),
  Breathing: require('../../../assets/breathing-card.jpg'),
  Journaling: require('../../../assets/journaling-card.png'),
  Relaxation: require('../../../assets/relaxation-card.png'),
  Reminders: require('../../../assets/reminders-card.png'),
};

// Animation handled by StaggeredListItem

// Common text styling for image overlay
const IMAGE_TEXT_STYLE = {
  fontSize: 18,
  lineHeight: 24,
  textShadowColor: 'rgba(0,0,0,0.8)',
  textShadowOffset: { width: 0, height: 2 },
  textShadowRadius: 6,
  fontWeight: '700' as const,
};

// Reusable ImageCard component
function ImageCard({
  backgroundImage,
  title,
}: {
  backgroundImage: ImageSourcePropType;
  title: string;
}) {
  return (
    <ImageBackground
      source={backgroundImage}
      style={{ flex: 1, minHeight: 200 }}
      imageStyle={{ borderRadius: 16 }}
      resizeMode="cover"
    >
      <View className="flex-1 justify-end p-4 pb-2">
        <Text
          className="text-white font-bold text-center"
          style={IMAGE_TEXT_STYLE}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
      </View>
    </ImageBackground>
  );
}

// Reusable ColorCard component
function ColorCard({
  color,
  title,
  iconType,
  iconName,
}: {
  color: string;
  title: string;
  iconType: 'category' | 'mood';
  iconName: string;
}) {
  return (
    <View style={{ backgroundColor: color, flex: 1 }}>
      <View className="flex-1 p-6">
        <View className="flex-1 items-center justify-center">
          <View className="w-20 h-20 rounded-full items-center justify-center bg-white/30">
            {/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(
              iconName
            ) ? (
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
        <View className="items-center pb-1">
          <Text
            variant="heading"
            className="text-white text-center"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
        </View>
      </View>
    </View>
  );
}

// Exercise card content component
function ExerciseCardContent({
  title,
  description,
  iconName,
  color,
  duration,
  difficulty,
  style,
}: {
  title: string;
  description?: string;
  iconName: string;
  color: string;
  duration?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  style?: ViewStyle;
}) {
  const colors = useColors();
  const isDarkMode = colors.background === '#171717';
  const DARK_CARD_COLOR = '#0A1514';
  const DARK_SURFACE_COLOR = '#0F1F1D';
  const DARK_BADGE_COLOR = '#16302C';
  const DARK_META_BG = '#0C1A18';
  return (
    <View
      className="overflow-hidden rounded-2xl"
      style={[
        {
          backgroundColor: isDarkMode ? DARK_CARD_COLOR : '#FFFFFF',
          borderWidth: 1,
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : '#F3F4F6',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 2,
        },
        style,
      ]}
    >
      <View
        className="h-32 justify-end p-4"
        style={{
          backgroundColor: isDarkMode ? DARK_SURFACE_COLOR : color + '20',
        }}
      >
        <View
          className="absolute top-4 right-4 w-12 h-12 rounded-full items-center justify-center"
          style={{
            backgroundColor: isDarkMode ? DARK_BADGE_COLOR : color + '40',
          }}
        >
          <Text className="text-2xl">{iconName}</Text>
        </View>

        <Text
          variant="title3"
          className="mb-1"
          style={{ color: isDarkMode ? colors.foreground : '#5A4A3A' }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
        <Text
          variant="body"
          className="text-sm"
          style={{
            color: isDarkMode ? 'rgba(255, 255, 255, 0.75)' : '#5A4A3A',
          }}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {description}
        </Text>
      </View>
      {/* Divider between header and meta */}
      <View
        style={{
          height: 1,
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : '#F3F4F6',
        }}
      />

      <View
        className="p-4"
        style={{
          backgroundColor: isDarkMode
            ? DARK_META_BG
            : 'rgba(255, 255, 255, 0.2)',
        }}
      >
        <View className="flex-row items-center justify-between">
          {duration && (
            <View className="flex-row items-center">
              <Text
                variant="body"
                className="text-sm"
                style={{ color: isDarkMode ? colors.foreground : '#5A4A3A' }}
              >
                ⏱ {duration}
              </Text>
            </View>
          )}

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
}

// (AnimatedCardWrapper removed; StaggeredListItem handles animations for cards)

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
  backgroundImage,
}: InteractiveCardProps) {
  // Exercise variant
  if (variant === 'exercise') {
    return (
      <StaggeredListItem
        index={index}
        pressable
        onPress={onPress}
        className="mb-4"
        staggerDelay="normal"
        springPreset="gentle"
      >
        <ExerciseCardContent
          title={title}
          description={description}
          iconName={iconName}
          color={color}
          duration={duration}
          difficulty={difficulty}
          style={style}
        />
      </StaggeredListItem>
    );
  }

  // Category variant
  const cardContent = (
    <View
      className={cn('rounded-2xl overflow-hidden', className)}
      style={[
        {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
          width: '100%',
          flex: 1,
        },
        style,
      ]}
    >
      {/* Use backgroundImage prop or fall back to title-based mapping */}
      {backgroundImage || CATEGORY_BACKGROUNDS[title] ? (
        <ImageCard
          backgroundImage={backgroundImage || CATEGORY_BACKGROUNDS[title]}
          title={title}
        />
      ) : (
        <ColorCard
          color={color}
          title={title}
          iconType={iconType}
          iconName={iconName}
        />
      )}
    </View>
  );

  return (
    <StaggeredListItem
      index={index}
      pressable
      onPress={onPress}
      staggerDelay="normal"
      springPreset="gentle"
    >
      {cardContent}
    </StaggeredListItem>
  );
}
