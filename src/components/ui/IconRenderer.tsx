import React from 'react';
import {
  Brain,
  Wind,
  Activity,
  BookOpen,
  Leaf,
  Heart,
  CloudRain,
  TrendingDown,
  Minus,
  TrendingUp,
  Star,
  AlertTriangle,
  Zap,
  Flame,
  Frown,
  Smile,
} from 'lucide-react-native';

interface IconRendererProps {
  iconType: 'category' | 'mood';
  iconName: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  fill?: string;
}

const categoryIconMap = {
  brain: Brain,
  breathing: Wind,
  mindfulness: Activity,
  cbt: BookOpen,
  journaling: Leaf,
  relaxation: Heart,
  movement: Activity,
};

const moodIconMap = {
  'very-sad': CloudRain,
  sad: Frown,
  neutral: Minus,
  happy: Smile,
  'very-happy': Star,
  anxious: Zap,
  angry: Flame,
};

export const IconRenderer = React.memo(function IconRenderer({
  iconType,
  iconName,
  size = 24,
  color,
  strokeWidth = 2,
  fill,
}: IconRendererProps) {
  const getIconComponent = () => {
    switch (iconType) {
      case 'category':
        return (
          categoryIconMap[iconName as keyof typeof categoryIconMap] || Brain
        );
      case 'mood':
        return moodIconMap[iconName as keyof typeof moodIconMap] || Minus;
      default:
        return Brain;
    }
  };

  const IconComponent = getIconComponent();

  const baseProps = {
    size,
    strokeWidth,
    ...(color && { color }),
    ...(fill && { fill }),
  };

  // For mood icons, use the color passed in without any fill
  if (iconType === 'mood') {
    return <IconComponent {...baseProps} />;
  }

  return <IconComponent {...baseProps} />;
});
