import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { HeliosColors } from '@/constants/theme';

type DottedDividerProps = {
  count?: number;
  color?: string;
};

const DOT_SIZE = 6;
const DOT_GAP = 4;

export function DottedDivider({
  count = 20,
  color = HeliosColors.accent,
}: DottedDividerProps) {
  const totalWidth = count * DOT_SIZE + (count - 1) * DOT_GAP;
  const radius = DOT_SIZE / 2;

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={totalWidth} height={DOT_SIZE}>
        {Array.from({ length: count }).map((_, i) => (
          <Circle
            key={i}
            cx={i * (DOT_SIZE + DOT_GAP) + radius}
            cy={radius}
            r={radius}
            fill={color}
          />
        ))}
      </Svg>
    </View>
  );
}
