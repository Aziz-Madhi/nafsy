import React, { useState } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '~/components/ui/text';
import { useAuth } from '@clerk/clerk-expo';
import { useUserSafe } from '~/lib/useUserSafe';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';
import { 
  CloudRain, 
  TrendingDown,
  Minus,
  TrendingUp,
  Star,
  AlertTriangle,
  Zap,
  Edit3,
  Calendar,
  Flame,
  BarChart3,
  CheckCircle
} from 'lucide-react-native';
import Svg, { Circle, Path, Text as SvgText, Defs, LinearGradient, Stop, Ellipse } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withRepeat, 
  withTiming,
  interpolate,
  Extrapolation,
  useAnimatedProps
} from 'react-native-reanimated';

const moods = [
  { id: 'very-sad', label: 'Very Sad', value: 'sad', color: '#94A3B8' },
  { id: 'sad', label: 'Sad', value: 'sad', color: '#64748B' },
  { id: 'neutral', label: 'Neutral', value: 'neutral', color: '#7ED321' },
  { id: 'happy', label: 'Happy', value: 'happy', color: '#4ADE80' },
  { id: 'very-happy', label: 'Very Happy', value: 'happy', color: '#22C55E' },
];

const renderMoodIcon = (moodId: string, size: number = 32) => {
  const baseProps = { size, strokeWidth: 3 };
  
  switch (moodId) {
    case 'very-sad':
      return <CloudRain {...baseProps} color="#1F2937" fill="#93C5FD" />;
    case 'sad':
      return <TrendingDown {...baseProps} color="#374151" fill="#DBEAFE" />;
    case 'neutral':
      return <Minus {...baseProps} color="#374151" strokeWidth={4} />;
    case 'happy':
      return <TrendingUp {...baseProps} color="#065F46" fill="#A7F3D0" />;
    case 'very-happy':
      return <Star {...baseProps} color="#DC2626" fill="#FEF3C7" />;
    case 'anxious':
      return <AlertTriangle {...baseProps} color="#7C2D12" fill="#FED7AA" />;
    case 'angry':
      return <Zap {...baseProps} color="#991B1B" fill="#FECACA" />;
    default:
      return <Minus {...baseProps} color="#374151" strokeWidth={4} />;
  }
};

const moodColors: Record<string, string> = {
  'sad': '#DED2F9',
  'anxious': '#FDC9D2',
  'neutral': '#FDEBC9',
  'happy': '#D0F1EB',
  'angry': '#F5D4C1',
};

const moodChartColors: Record<string, string> = {
  'sad': '#8B5CF6',
  'anxious': '#EF4444', 
  'neutral': '#F59E0B',
  'happy': '#10B981',
  'angry': '#F97316',
};

interface MoodData {
  mood: string;
  count: number;
  percentage: number;
  color: string;
}

// Animated Bubble Component
function FloatingBubble({ mood, index }: { mood: string, index: number }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0.6);
  
  React.useEffect(() => {
    translateY.value = withRepeat(
      withTiming(-30, { duration: 2000 + index * 500 }),
      -1,
      true
    );
    opacity.value = withRepeat(
      withTiming(0.2, { duration: 1500 + index * 300 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 10 + (index * 15) % 40,
          bottom: 10,
        },
        animatedStyle
      ]}
    >
      <View
        style={{
          width: 4 + (index % 3),
          height: 4 + (index % 3),
          borderRadius: 10,
          backgroundColor: '#FFFFFF60',
        }}
      />
    </Animated.View>
  );
}

// Liquid Glass Container Component
function LiquidContainer({ mood, percentage, color, count, index }: {
  mood: string;
  percentage: number;
  color: string;
  count: number;
  index: number;
}) {
  const fillHeight = useSharedValue(0);
  const containerScale = useSharedValue(0.8);

  React.useEffect(() => {
    // Staggered animation entrance
    setTimeout(() => {
      containerScale.value = withSpring(1, { damping: 15 });
      fillHeight.value = withSpring(percentage, { damping: 12, stiffness: 100 });
    }, index * 200);
  }, [percentage, index]);

  const animatedFillStyle = useAnimatedStyle(() => {
    const height = interpolate(
      fillHeight.value,
      [0, 100],
      [0, 80],
      Extrapolation.CLAMP
    );
    
    return {
      height,
      transform: [{ scaleX: containerScale.value }],
    };
  });

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale.value }],
  }));

  // Organic container shapes for each mood
  const getContainerPath = (mood: string) => {
    switch (mood) {
      case 'sad':
        return "M20 10 C15 5, 5 5, 5 20 C5 80, 15 85, 30 85 C45 85, 55 80, 55 20 C55 5, 45 5, 40 10 C35 15, 25 15, 20 10 Z";
      case 'anxious':
        return "M25 8 C18 3, 8 8, 8 22 C8 75, 12 88, 30 88 C48 88, 52 75, 52 22 C52 8, 42 3, 35 8 C32 12, 28 12, 25 8 Z";
      case 'neutral':
        return "M30 12 C20 6, 10 10, 10 25 C10 70, 15 84, 30 84 C45 84, 50 70, 50 25 C50 10, 40 6, 30 12 Z";
      case 'happy':
        return "M30 8 C22 2, 8 6, 8 24 C8 72, 14 86, 30 86 C46 86, 52 72, 52 24 C52 6, 38 2, 30 8 Z";
      case 'angry':
        return "M28 6 C20 1, 6 4, 6 20 C6 76, 12 90, 30 90 C48 90, 54 76, 54 20 C54 4, 40 1, 32 6 C30 8, 30 8, 28 6 Z";
      default:
        return "M30 10 C20 5, 10 10, 10 25 C10 70, 15 85, 30 85 C45 85, 50 70, 50 25 C50 10, 40 5, 30 10 Z";
    }
  };

  return (
    <Animated.View style={[{ alignItems: 'center', margin: 4 }, animatedContainerStyle]}>
      <View style={{ position: 'relative', width: 60, height: 100 }}>
        <Svg width="60" height="100" viewBox="0 0 60 95">
          <Defs>
            <LinearGradient id={`liquid-${mood}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={color} stopOpacity="0.9" />
              <Stop offset="50%" stopColor={color} stopOpacity="0.7" />
              <Stop offset="100%" stopColor={color} stopOpacity="0.9" />
            </LinearGradient>
            <LinearGradient id={`glass-${mood}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.2" />
              <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.05" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1" />
            </LinearGradient>
          </Defs>
          
          {/* Container Glass */}
          <Path
            d={getContainerPath(mood)}
            fill={`url(#glass-${mood})`}
            stroke="#FFFFFF40"
            strokeWidth="1"
          />
          
          {/* Liquid Fill */}
          <Path
            d={getContainerPath(mood)}
            fill={`url(#liquid-${mood})`}
            clipPath={`url(#clip-${mood})`}
          />
          
          {/* Glass Reflection */}
          <Ellipse
            cx="20"
            cy="25"
            rx="8"
            ry="15"
            fill="#FFFFFF"
            opacity="0.15"
          />
        </Svg>

        {/* Animated Liquid Fill Overlay */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              bottom: 8,
              left: 8,
              right: 8,
              backgroundColor: color + '80',
              borderRadius: 20,
            },
            animatedFillStyle
          ]}
        />

        {/* Floating Bubbles */}
        {percentage > 0 && (
          <>
            <FloatingBubble mood={mood} index={index * 3} />
            <FloatingBubble mood={mood} index={index * 3 + 1} />
            <FloatingBubble mood={mood} index={index * 3 + 2} />
          </>
        )}

        {/* Mood Icon */}
        <View style={{ 
          position: 'absolute', 
          top: -5, 
          left: '50%', 
          transform: [{ translateX: -12 }],
          backgroundColor: '#FFFFFF90',
          borderRadius: 12,
          padding: 4,
        }}>
          {renderMoodIcon(mood, 16)}
        </View>
      </View>

      {/* Labels */}
      <View style={{ alignItems: 'center', marginTop: 8 }}>
        <Text variant="body" className="font-bold" style={{ color }}>
          {percentage.toFixed(0)}%
        </Text>
        <Text variant="muted" className="text-xs capitalize mt-1">
          {mood}
        </Text>
        <Text variant="muted" className="text-xs">
          {count} {count === 1 ? 'entry' : 'entries'}
        </Text>
      </View>
    </Animated.View>
  );
}

// Main Liquid Glass Visualization
function LiquidGlassVisualization({ data }: { data: MoodData[] }) {
  if (data.every(item => item.count === 0)) {
    return (
      <View className="items-center justify-center py-12">
        <View className="mb-6">
          <Svg width="120" height="80" viewBox="0 0 120 80">
            <Defs>
              <LinearGradient id="empty-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#E5E7EB" stopOpacity="0.3" />
                <Stop offset="100%" stopColor="#9CA3AF" stopOpacity="0.1" />
              </LinearGradient>
            </Defs>
            {['sad', 'neutral', 'happy'].map((mood, index) => (
              <Path
                key={mood}
                d={`M${20 + index * 30} 10 C${15 + index * 30} 5, ${5 + index * 30} 5, ${5 + index * 30} 20 C${5 + index * 30} 60, ${10 + index * 30} 65, ${20 + index * 30} 65 C${30 + index * 30} 65, ${35 + index * 30} 60, ${35 + index * 30} 20 C${35 + index * 30} 5, ${25 + index * 30} 5, ${20 + index * 30} 10 Z`}
                fill="url(#empty-gradient)"
                stroke="#D1D5DB"
                strokeWidth="1"
              />
            ))}
          </Svg>
        </View>
        <Text variant="heading" className="text-[#6B7280] mb-2">
          No mood data yet
        </Text>
        <Text variant="muted" className="text-center text-sm">
          Start tracking your emotions to see{'\n'}beautiful patterns emerge
        </Text>
      </View>
    );
  }

  const activeData = data.filter(item => item.count > 0).sort((a, b) => b.count - a.count);

  return (
    <View className="py-4">
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingHorizontal: 20,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {activeData.map((item, index) => (
          <LiquidContainer
            key={item.mood}
            mood={item.mood}
            percentage={item.percentage}
            color={item.color}
            count={item.count}
            index={index}
          />
        ))}
      </ScrollView>
    </View>
  );
}

type ViewMode = 'input' | 'calendar' | 'stats';

export default function MoodScreen() {
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Authentication
  const { user, isLoaded } = useUserSafe();
  const { isSignedIn } = useAuth();
  
  // Convex
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user && isSignedIn ? { clerkId: user.id } : 'skip'
  );
  const createMood = useMutation(api.moods.createMood);
  const todayMood = useQuery(
    api.moods.getTodayMood,
    currentUser ? { userId: currentUser._id } : 'skip'
  );
  const moodData = useQuery(
    api.moods.getMoods,
    currentUser ? { userId: currentUser._id, limit: 365 } : 'skip'
  );
  const moodStats = useQuery(
    api.moods.getMoodStats,
    currentUser ? { userId: currentUser._id, days: 30 } : 'skip'
  );

  if (!isLoaded) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F2FAF9' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      </SafeAreaView>
    );
  }

  if (!isSignedIn || !user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F2FAF9' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 60, marginBottom: 16 }}>🤗</Text>
          <Text style={{ fontSize: 20, fontWeight: '600', color: '#5A4A3A', textAlign: 'center' }}>
            Sign In Required
          </Text>
          <Text style={{ fontSize: 16, color: '#5A4A3A', opacity: 0.7, marginTop: 8, textAlign: 'center' }}>
            Please sign in to start tracking your emotional wellbeing
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleSaveMood = async () => {
    if (!selectedMood || !currentUser || isSaving) return;
    
    setIsSaving(true);
    try {
      const mood = moods.find(m => m.id === selectedMood);
      if (mood) {
        await createMood({
          userId: currentUser._id,
          mood: mood.value,
        });
        setSelectedMood('');
      }
    } catch (error) {
      console.error('Error saving mood:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const hasLoggedToday = !!todayMood;

  // Calendar data
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = monthStart.getDay();
  const paddingDays = Array(startPadding).fill(null);

  const getMoodForDate = (date: Date) => {
    return moodData?.find(mood => 
      isSameDay(new Date(mood.createdAt), date)
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F2FAF9]">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6">
          {/* Header */}
          <Text 
            variant="title1" 
            className="text-[#5A4A3A] font-bold mb-2"
          >
            Mood Tracker
          </Text>
          <Text 
            variant="body" 
            className="text-[#5A4A3A] opacity-70 mb-6"
          >
            Track your emotional wellbeing
          </Text>

          {/* Today's Mood Log Section */}
          <View className="mb-8">
            <View className="flex-row items-center mb-4">
              <Edit3 size={20} color="#5A4A3A" />
              <Text 
                variant="title3" 
                className="text-[#5A4A3A] font-bold ml-2"
              >
                Today's Mood
              </Text>
            </View>
            
            {hasLoggedToday ? (
              <View className="bg-white/40 rounded-3xl p-8 items-center shadow-sm">
                <View className="w-20 h-20 bg-[#D0F1EB] rounded-full items-center justify-center mb-4">
                  <CheckCircle size={48} color="#059669" fill="#D1FAE5" />
                </View>
                <Text 
                  variant="title3" 
                  className="text-[#5A4A3A] font-bold mb-2"
                >
                  Mood Saved!
                </Text>
                <Text 
                  variant="body" 
                  className="text-[#5A4A3A] opacity-70 text-center"
                >
                  Great job tracking your emotions today
                </Text>
                {todayMood && (
                  <View className="flex-row items-center mt-4 bg-gray-100 px-5 py-3 rounded-2xl">
                    <View style={{ marginRight: 8 }}>
                      {renderMoodIcon(todayMood.mood, 20)}
                    </View>
                    <Text 
                      variant="subhead" 
                      className="text-[#5A4A3A]"
                    >
                      Today you felt {todayMood.mood}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View className="bg-white/40 rounded-3xl p-6 shadow-sm">
                <Text 
                  variant="heading" 
                  className="text-[#5A4A3A] font-semibold text-center mb-8"
                >
                  How are you feeling today?
                </Text>
                
                <View className="flex-row justify-between mb-8">
                  {moods.map((mood) => (
                    <Pressable
                      key={mood.id}
                      onPress={() => setSelectedMood(mood.id)}
                      className="items-center"
                    >
                      <View 
                        className="w-16 h-16 rounded-full border-2 items-center justify-center mb-2"
                        style={{
                          backgroundColor: selectedMood === mood.id ? mood.color : 'white',
                          borderColor: selectedMood === mood.id ? mood.color : '#E5E7EB',
                          transform: selectedMood === mood.id ? [{ scale: 1.1 }] : [{ scale: 1 }],
                        }}
                      >
                        {renderMoodIcon(mood.id, 32)}
                      </View>
                      <Text 
                        variant="caption1" 
                        className={`${
                          selectedMood === mood.id 
                            ? 'font-semibold' 
                            : 'text-gray-600'
                        }`}
                        style={{ color: selectedMood === mood.id ? mood.color : undefined }}
                      >
                        {mood.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                
                {selectedMood && (
                  <Pressable
                    onPress={handleSaveMood}
                    disabled={isSaving}
                    className={`bg-blue-500 py-4 rounded-2xl items-center ${
                      isSaving ? 'opacity-60' : ''
                    }`}
                  >
                    <Text 
                      variant="callout" 
                      className="text-white font-semibold"
                    >
                      {isSaving ? 'Saving...' : 'Save Mood'}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>

          {/* Calendar History Section */}
          <View className="mb-8">
            <View className="flex-row items-center mb-4">
              <Calendar size={20} color="#5A4A3A" />
              <Text 
                variant="title3" 
                className="text-[#5A4A3A] font-bold ml-2"
              >
                Mood History
              </Text>
            </View>
            
            <View className="bg-white/40 rounded-3xl p-6 shadow-sm">
              {/* Month Navigation */}
              <View className="flex-row justify-between items-center mb-6">
                <Pressable
                  onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-3 bg-gray-100 rounded-xl"
                >
                  <Text 
                    variant="callout" 
                    className="text-[#5A4A3A]"
                  >←</Text>
                </Pressable>
                <Text 
                  variant="heading" 
                  className="text-[#5A4A3A] font-semibold"
                >
                  {format(currentMonth, 'MMMM yyyy')}
                </Text>
                <Pressable
                  onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-3 bg-gray-100 rounded-xl"
                >
                  <Text 
                    variant="callout" 
                    className="text-[#5A4A3A]"
                  >→</Text>
                </Pressable>
              </View>

              {/* Weekday headers */}
              <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <View key={index} style={{ flex: 1, alignItems: 'center' }}>
                    <Text 
                      variant="caption1" 
                      className="text-muted-foreground font-semibold"
                    >
                      {day}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Calendar grid */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {paddingDays.map((_, index) => (
                  <View key={`padding-${index}`} style={{ width: '14.28%', height: 48 }} />
                ))}
                
                {days.map((day) => {
                  const mood = getMoodForDate(day);
                  const isToday = isSameDay(day, new Date());
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  
                  return (
                    <Pressable
                      key={day.toISOString()}
                      onPress={() => setSelectedDate(day)}
                      style={{
                        width: '14.28%',
                        height: 48,
                        padding: 2,
                      }}
                    >
                      <View style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 12,
                        backgroundColor: mood ? moodColors[mood.mood] : 
                                       isSelected ? '#E0F2FE' : 
                                       isToday ? '#F3F4F6' : 'transparent',
                        borderWidth: isSelected ? 2 : 0,
                        borderColor: '#2196F3',
                      }}>
                        {mood ? (
                          <View style={{ transform: [{ scale: 0.7 }] }}>
                            {renderMoodIcon(mood.mood, 24)}
                          </View>
                        ) : (
                          <Text 
                            variant="subhead"
                            className={`${
                              isToday ? 'text-blue-500 font-semibold' : 
                              isSameMonth(day, currentMonth) ? 'text-gray-700' : 'text-gray-300'
                            }`}
                          >
                            {format(day, 'd')}
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Selected Date Info */}
              {selectedDate && (
                <View style={{ 
                  marginTop: 20, 
                  padding: 16, 
                  backgroundColor: '#F9FAFB', 
                  borderRadius: 16,
                }}>
                  <Text 
                    variant="subhead" 
                    className="text-gray-600 font-semibold mb-1"
                  >
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </Text>
                  {(() => {
                    const selectedMoodData = getMoodForDate(selectedDate);
                    if (selectedMoodData) {
                      return (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ marginRight: 8 }}>
                            {renderMoodIcon(selectedMoodData.mood, 20)}
                          </View>
                          <Text 
                            variant="body" 
                            className="text-[#5A4A3A]"
                          >
                            You felt {selectedMoodData.mood}
                          </Text>
                        </View>
                      );
                    } else {
                      return (
                        <Text 
                          variant="body" 
                          className="text-muted-foreground"
                        >
                          No mood logged for this day
                        </Text>
                      );
                    }
                  })()}
                </View>
              )}
            </View>
          </View>

          {/* Insights Section */}
          <View className="mb-8">
            <View className="flex-row items-center mb-4">
              <BarChart3 size={20} color="#5A4A3A" />
              <Text 
                variant="title3" 
                className="text-[#5A4A3A] font-bold ml-2"
              >
                Insights
              </Text>
            </View>
            
              {/* Stats Overview Cards */}
              <View className="flex-row gap-4 mb-4">
                <View className="flex-1 bg-blue-50 rounded-2xl p-5 items-center">
                  <Flame size={32} color="#1E40AF" className="mb-1" />
                  <Text 
                    variant="title2" 
                    className="text-[#1E40AF] font-bold"
                  >
                    {moodStats?.currentStreak || 0}
                  </Text>
                  <Text 
                    variant="caption1" 
                    className="text-[#1E40AF] opacity-80"
                  >
                    Day Streak
                  </Text>
                </View>

                <View style={{
                  flex: 1,
                  backgroundColor: '#D0F1EB',
                  borderRadius: 20,
                  padding: 20,
                  alignItems: 'center',
                }}>
                  <BarChart3 size={32} color="#047857" className="mb-1" />
                  <Text 
                    variant="title2" 
                    className="text-[#047857] font-bold"
                  >
                    {moodStats?.totalEntries || 0}
                  </Text>
                  <Text 
                    variant="caption1" 
                    className="text-[#047857] opacity-80"
                  >
                    Total Logs
                  </Text>
                </View>
              </View>

              {/* Mood Distribution */}
              <View className="bg-white/40 rounded-2xl p-6 shadow-sm">
                <Text 
                  variant="heading" 
                  className="text-[#5A4A3A] font-semibold mb-6"
                >
                  Mood Distribution
                </Text>
                
                {(() => {
                  const chartData: MoodData[] = ['sad', 'anxious', 'neutral', 'happy', 'angry'].map((mood) => {
                    const count = moodData?.filter(m => m.mood === mood).length || 0;
                    const percentage = moodData?.length ? (count / moodData.length) * 100 : 0;
                    
                    return {
                      mood,
                      count,
                      percentage,
                      color: moodChartColors[mood] || '#7ED321'
                    };
                  });
                  
                  return <LiquidGlassVisualization data={chartData} />;
                })()}
              </View>

              {/* Most Common Mood */}
              {moodStats?.mostCommonMood && (
                <View className="bg-yellow-100 rounded-2xl p-5 flex-row items-center justify-between mt-4">
                  <View>
                    <Text 
                      variant="subhead" 
                      className="text-[#92400E] opacity-80 mb-1"
                    >
                      Most Common Mood
                    </Text>
                    <Text 
                      variant="heading" 
                      className="text-[#92400E] font-semibold"
                    >
                      {moodStats.mostCommonMood}
                    </Text>
                  </View>
                  <View style={{ transform: [{ scale: 1.5 }] }}>
                    {renderMoodIcon(moodStats.mostCommonMood, 32)}
                  </View>
                </View>
              )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}