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
  'sad': TrendingDown,
  'neutral': Minus,
  'happy': TrendingUp,
  'very-happy': Star,
  'anxious': AlertTriangle,
  'angry': Zap,
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
        return categoryIconMap[iconName as keyof typeof categoryIconMap] || Brain;
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

  // Special handling for mood icons with default colors/fills
  if (iconType === 'mood') {
    switch (iconName) {
      case 'very-sad':
        return <IconComponent {...baseProps} color="#1F2937" fill="#93C5FD" />;
      case 'sad':
        return <IconComponent {...baseProps} color="#374151" fill="#DBEAFE" />;
      case 'neutral':
        return <IconComponent {...baseProps} color="#374151" strokeWidth={4} />;
      case 'happy':
        return <IconComponent {...baseProps} color="#065F46" fill="#A7F3D0" />;
      case 'very-happy':
        return <IconComponent {...baseProps} color="#DC2626" fill="#FEF3C7" />;
      case 'anxious':
        return <IconComponent {...baseProps} color="#7C2D12" fill="#FED7AA" />;
      case 'angry':
        return <IconComponent {...baseProps} color="#991B1B" fill="#FECACA" />;
      default:
        return <IconComponent {...baseProps} color="#374151" strokeWidth={4} />;
    }
  }

  return <IconComponent {...baseProps} />;
});