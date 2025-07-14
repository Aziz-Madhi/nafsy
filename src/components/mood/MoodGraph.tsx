import React from 'react';
import { View, Dimensions } from 'react-native';
import { Text } from '~/components/ui/text';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { format } from 'date-fns';

interface MoodData {
  date: Date;
  mood: number; // 1-5 scale
  emoji: string;
}

interface MoodGraphProps {
  data: MoodData[];
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRAPH_WIDTH = SCREEN_WIDTH - 48;
const GRAPH_HEIGHT = 200;
const PADDING = 20;

export function MoodGraph({ data }: MoodGraphProps) {
  if (data.length === 0) {
    return (
      <View className="bg-card rounded-2xl p-6 items-center justify-center h-[250px]">
        <Text variant="muted">No mood data yet</Text>
        <Text variant="muted" className="text-sm mt-2">
          Start tracking your mood to see trends
        </Text>
      </View>
    );
  }

  const maxValue = 5;
  const minValue = 1;
  const xStep = (GRAPH_WIDTH - PADDING * 2) / (data.length - 1 || 1);
  const yScale = (GRAPH_HEIGHT - PADDING * 2) / (maxValue - minValue);

  // Create path for the line
  const pathData = data
    .map((point, index) => {
      const x = PADDING + index * xStep;
      const y = GRAPH_HEIGHT - PADDING - (point.mood - minValue) * yScale;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Create gradient path (area under the curve)
  const areaData = `${pathData} L ${PADDING + (data.length - 1) * xStep} ${GRAPH_HEIGHT - PADDING} L ${PADDING} ${GRAPH_HEIGHT - PADDING} Z`;

  return (
    <View className="bg-card rounded-2xl p-6">
      <Text variant="title3" className="mb-4">
        Mood Trends
      </Text>
      
      <View className="mb-4">
        <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT}>
          {/* Grid lines */}
          {[1, 2, 3, 4, 5].map((value) => {
            const y = GRAPH_HEIGHT - PADDING - (value - minValue) * yScale;
            return (
              <Line
                key={value}
                x1={PADDING}
                y1={y}
                x2={GRAPH_WIDTH - PADDING}
                y2={y}
                stroke="#E5E7EB"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
            );
          })}

          {/* Area gradient */}
          <Path
            d={areaData}
            fill="#4ADE80"
            fillOpacity="0.1"
          />

          {/* Line */}
          <Path
            d={pathData}
            stroke="#4ADE80"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {data.map((point, index) => {
            const x = PADDING + index * xStep;
            const y = GRAPH_HEIGHT - PADDING - (point.mood - minValue) * yScale;
            return (
              <Circle
                key={index}
                cx={x}
                cy={y}
                r="6"
                fill="#4ADE80"
                stroke="white"
                strokeWidth="2"
              />
            );
          })}

          {/* Date labels */}
          {data.map((point, index) => {
            if (index % Math.ceil(data.length / 5) === 0 || index === data.length - 1) {
              const x = PADDING + index * xStep;
              return (
                <SvgText
                  key={index}
                  x={x}
                  y={GRAPH_HEIGHT - 5}
                  fill="#9CA3AF"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {format(point.date, 'MMM d')}
                </SvgText>
              );
            }
            return null;
          })}
        </Svg>
      </View>

      {/* Legend */}
      <View className="flex-row justify-between px-4">
        {['😢', '😔', '😐', '😊', '😄'].map((emoji, index) => (
          <View key={index} className="items-center">
            <Text className="text-sm">{emoji}</Text>
            <Text variant="muted" className="text-xs mt-1">
              {index + 1}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}