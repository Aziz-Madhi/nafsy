import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface SoundWaveIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function SoundWaveIcon({
  size = 24,
  color = 'black',
  strokeWidth = 2,
}: SoundWaveIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 11V13M6 10V14M9 11V13M12 9V15M15 6V18M18 10V14M21 11V13"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
