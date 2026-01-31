import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import {
  HeliosColors,
  HeliosTypography,
  HeliosSpacing,
} from '@/constants/theme';

type ScoreRingProps = {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
  sublabel?: string;
};

export function ScoreRing({
  value,
  max,
  size = 100,
  strokeWidth = 8,
  color,
  label,
  sublabel,
}: ScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: size, height: size }}>
        <Svg
          width={size}
          height={size}
          style={{ transform: [{ rotate: '-90deg' }] }}
        >
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={HeliosColors.surface}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </Svg>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              ...HeliosTypography.metricMedium,
              color,
              fontVariant: ['tabular-nums'],
            }}
          >
            {Math.round(value)}
          </Text>
        </View>
      </View>
      <Text
        style={{
          ...HeliosTypography.label,
          color: HeliosColors.textOnCardMuted,
          marginTop: HeliosSpacing.xs,
        }}
      >
        {label}
      </Text>
      {sublabel ? (
        <Text
          style={{
            ...HeliosTypography.bodySmall,
            color: HeliosColors.textOnCardMuted,
            marginTop: 2,
          }}
        >
          {sublabel}
        </Text>
      ) : null}
    </View>
  );
}
