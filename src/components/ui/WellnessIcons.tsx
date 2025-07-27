import React from 'react';
import Svg, {
  Path,
  Circle,
  Ellipse,
  G,
  LinearGradient,
  Stop,
  Defs,
} from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  secondaryColor?: string;
}

export function MindfulnessIcon({
  size = 32,
  color = '#FF6B6B',
  secondaryColor = '#FF8E8E',
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient
          id="mindfulnessGrad"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <Stop offset="0%" stopColor={color} />
          <Stop offset="100%" stopColor={secondaryColor} />
        </LinearGradient>
      </Defs>
      {/* Lotus petals */}
      <Path
        d="M16 8C18 6 22 8 22 12C22 10 24 8 26 10C24 12 22 14 20 14C22 16 20 20 16 18C18 20 16 24 14 22C16 20 18 18 18 16C16 18 12 16 14 12C12 14 8 12 10 10C12 8 14 10 14 12C14 8 16 8 16 8Z"
        fill="url(#mindfulnessGrad)"
        opacity={0.9}
      />
      {/* Center circle */}
      <Circle cx="16" cy="14" r="3" fill={color} opacity={0.8} />
      {/* Inner glow */}
      <Circle cx="16" cy="14" r="1.5" fill="white" opacity={0.6} />
    </Svg>
  );
}

export function BreathingIcon({
  size = 32,
  color = '#4ECDC4',
  secondaryColor = '#7DD3CF',
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient id="breathingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={color} />
          <Stop offset="100%" stopColor={secondaryColor} />
        </LinearGradient>
      </Defs>
      {/* Outer breath ring */}
      <Circle
        cx="16"
        cy="16"
        r="12"
        fill="none"
        stroke="url(#breathingGrad)"
        strokeWidth="2"
        opacity={0.4}
      />
      {/* Middle breath ring */}
      <Circle
        cx="16"
        cy="16"
        r="8"
        fill="none"
        stroke="url(#breathingGrad)"
        strokeWidth="2"
        opacity={0.6}
      />
      {/* Inner circle */}
      <Circle cx="16" cy="16" r="4" fill="url(#breathingGrad)" opacity={0.8} />
      {/* Center dot */}
      <Circle cx="16" cy="16" r="2" fill="white" opacity={0.9} />
      {/* Breath flow indicators */}
      <Path d="M16 4 L18 6 L16 8 L14 6 Z" fill={color} opacity={0.7} />
      <Path d="M28 16 L26 18 L24 16 L26 14 Z" fill={color} opacity={0.7} />
      <Path d="M16 28 L14 26 L16 24 L18 26 Z" fill={color} opacity={0.7} />
      <Path d="M4 16 L6 14 L8 16 L6 18 Z" fill={color} opacity={0.7} />
    </Svg>
  );
}

export function MovementIcon({
  size = 32,
  color = '#45B7D1',
  secondaryColor = '#6BC5D8',
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient id="movementGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={color} />
          <Stop offset="100%" stopColor={secondaryColor} />
        </LinearGradient>
      </Defs>
      {/* Body */}
      <Ellipse
        cx="16"
        cy="18"
        rx="3"
        ry="8"
        fill="url(#movementGrad)"
        opacity={0.8}
      />
      {/* Head */}
      <Circle cx="16" cy="8" r="3" fill="url(#movementGrad)" />
      {/* Arms in motion */}
      <Path
        d="M13 14 Q8 12 6 16 Q8 18 13 16"
        fill="url(#movementGrad)"
        opacity={0.7}
      />
      <Path
        d="M19 16 Q24 14 26 18 Q24 20 19 18"
        fill="url(#movementGrad)"
        opacity={0.7}
      />
      {/* Legs in motion */}
      <Path
        d="M14 24 Q10 28 8 26 Q12 24 14 26"
        fill="url(#movementGrad)"
        opacity={0.7}
      />
      <Path
        d="M18 26 Q22 30 24 28 Q20 26 18 28"
        fill="url(#movementGrad)"
        opacity={0.7}
      />
      {/* Motion lines */}
      <Path
        d="M4 12 L8 12 M4 16 L7 16 M4 20 L6 20"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity={0.5}
      />
    </Svg>
  );
}

export function JournalingIcon({
  size = 32,
  color = '#96CEB4',
  secondaryColor = '#B5D6C6',
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient id="journalingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={color} />
          <Stop offset="100%" stopColor={secondaryColor} />
        </LinearGradient>
      </Defs>
      {/* Journal book */}
      <Path
        d="M8 4 L24 4 Q26 4 26 6 L26 26 Q26 28 24 28 L8 28 Q6 28 6 26 L6 6 Q6 4 8 4 Z"
        fill="url(#journalingGrad)"
      />
      {/* Book spine */}
      <Path
        d="M8 4 L8 28 Q6 28 6 26 L6 6 Q6 4 8 4 Z"
        fill={color}
        opacity={0.8}
      />
      {/* Pages */}
      <Path
        d="M10 8 L22 8 M10 12 L22 12 M10 16 L20 16 M10 20 L21 20"
        stroke="white"
        strokeWidth="1"
        strokeLinecap="round"
        opacity={0.8}
      />
      {/* Pen */}
      <Path
        d="M18 14 L26 6 Q27 5 28 6 L28 8 Q27 9 26 8 L18 16 Q17 17 16 16 Q17 15 18 14 Z"
        fill={secondaryColor}
      />
      <Circle cx="27" cy="7" r="1" fill="#FFD700" />
    </Svg>
  );
}

export function RelaxationIcon({
  size = 32,
  color = '#FFEAA7',
  secondaryColor = '#FFEF9F',
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient id="relaxationGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={color} />
          <Stop offset="100%" stopColor={secondaryColor} />
        </LinearGradient>
      </Defs>
      {/* Sun/moon hybrid */}
      <Circle cx="16" cy="16" r="8" fill="url(#relaxationGrad)" />
      {/* Sun rays */}
      <G opacity={0.7}>
        <Path
          d="M16 2 L16 6"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <Path
          d="M16 26 L16 30"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <Path
          d="M30 16 L26 16"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <Path
          d="M6 16 L2 16"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <Path
          d="M25.5 6.5 L22.8 9.2"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <Path
          d="M9.2 22.8 L6.5 25.5"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <Path
          d="M25.5 25.5 L22.8 22.8"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <Path
          d="M9.2 9.2 L6.5 6.5"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </G>
      {/* Peaceful face */}
      <Circle cx="13" cy="13" r="1" fill="white" opacity={0.8} />
      <Circle cx="19" cy="13" r="1" fill="white" opacity={0.8} />
      <Path
        d="M12 19 Q16 21 20 19"
        stroke="white"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        opacity={0.8}
      />
    </Svg>
  );
}

export function RemindersIcon({
  size = 32,
  color = '#DDA0DD',
  secondaryColor = '#E4B5E4',
}: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <Defs>
        <LinearGradient id="remindersGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={color} />
          <Stop offset="100%" stopColor={secondaryColor} />
        </LinearGradient>
      </Defs>
      {/* Thought bubble main */}
      <Ellipse
        cx="20"
        cy="12"
        rx="10"
        ry="8"
        fill="url(#remindersGrad)"
        opacity={0.9}
      />
      {/* Smaller thought bubbles */}
      <Circle cx="12" cy="20" r="3" fill={color} opacity={0.7} />
      <Circle cx="8" cy="24" r="2" fill={color} opacity={0.5} />
      <Circle cx="5" cy="27" r="1" fill={color} opacity={0.3} />
      {/* Heart inside main bubble */}
      <Path
        d="M17 9 Q15 7 13 9 Q15 11 17 9 Q19 7 21 9 Q19 11 17 13 Q15 11 17 9 Z"
        fill="white"
        opacity={0.8}
      />
      {/* Sparkles */}
      <G opacity={0.6}>
        <Path
          d="M26 6 L27 8 L29 7 L27 9 L26 11 L25 9 L23 7 L25 8 Z"
          fill={secondaryColor}
        />
        <Path
          d="M6 8 L7 10 L9 9 L7 11 L6 13 L5 11 L3 9 L5 10 Z"
          fill={secondaryColor}
        />
        <Circle cx="28" cy="20" r="1" fill={color} />
        <Circle cx="4" cy="16" r="1" fill={color} />
      </G>
    </Svg>
  );
}

// Main icon renderer component
export function WellnessIcon({
  category,
  size = 32,
  color,
  secondaryColor,
}: {
  category: string;
  size?: number;
  color?: string;
  secondaryColor?: string;
}) {
  const iconProps = { size, color, secondaryColor };

  switch (category.toLowerCase()) {
    case 'mindfulness':
      return <MindfulnessIcon {...iconProps} />;
    case 'breathing':
      return <BreathingIcon {...iconProps} />;
    case 'movement':
      return <MovementIcon {...iconProps} />;
    case 'journaling':
      return <JournalingIcon {...iconProps} />;
    case 'relaxation':
      return <RelaxationIcon {...iconProps} />;
    case 'reminders':
      return <RemindersIcon {...iconProps} />;
    default:
      return <MindfulnessIcon {...iconProps} />;
  }
}

export default WellnessIcon;
