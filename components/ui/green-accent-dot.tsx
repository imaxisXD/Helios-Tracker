import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { HeliosColors } from '@/constants/theme';

type GreenAccentDotProps = {
  size?: number;
  style?: ViewStyle;
};

export function GreenAccentDot({ size = 24, style }: GreenAccentDotProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderCurve: 'continuous',
        backgroundColor: HeliosColors.accent,
        ...style,
      }}
    />
  );
}
