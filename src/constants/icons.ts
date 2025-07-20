import { 
  CloudRain, 
  Droplets, 
  Minus, 
  Sun, 
  Star,
  Brain,
  Wind,
  Activity,
  BookOpen,
  Leaf,
  Heart,
  Coffee,
  Bell,
  Moon,
  Cloud,
  Sparkles,
  LucideIcon
} from 'lucide-react-native';

export interface IconConfig {
  component: LucideIcon;
  color?: string;
}

// Mood Icon Mappings - Using calming, expressive Lucide icons
export const MOOD_ICONS: Record<string, IconConfig> = {
  'very-sad': {
    component: CloudRain,
    color: '#94A3B8'
  },
  'sad': {
    component: Droplets,
    color: '#64748B'
  },
  'neutral': {
    component: Minus,
    color: '#7ED321'
  },
  'happy': {
    component: Sun,
    color: '#4ADE80'
  },
  'very-happy': {
    component: Star,
    color: '#22C55E'
  },
  'anxious': {
    component: Cloud,
    color: '#FDC9D2'
  },
  'angry': {
    component: Sparkles,
    color: '#F5D4C1'
  }
};

// Exercise Category Icon Mappings - Professional wellness icons
export const EXERCISE_ICONS: Record<string, IconConfig> = {
  mindfulness: {
    component: Brain,
    color: '#F5D4C1'
  },
  breathing: {
    component: Wind,
    color: '#FDEBC9'
  },
  movement: {
    component: Activity,
    color: '#D0F1EB'
  },
  journaling: {
    component: BookOpen,
    color: '#DED2F9'
  },
  relaxation: {
    component: Leaf,
    color: '#C9EAFD'
  },
  reminders: {
    component: Heart,
    color: '#FDC9D2'
  }
};

// Note: These icon constants are kept for reference but not actively used
// Components now use direct icon imports for better React Native compatibility