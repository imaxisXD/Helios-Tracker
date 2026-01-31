import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import {
  HeliosColors,
  HeliosTypography,
  HeliosSpacing,
} from '@/constants/theme';

interface ActivityRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  value?: string;
  color?: string;
  trackColor?: string;
}

export default function ActivityRing({
  progress,
  size = 120,
  strokeWidth = 10,
  label,
  value,
  color,
  trackColor,
}: ActivityRingProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - clampedProgress);
  const center = size / 2;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={size} height={size}>
        {/* Background track */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor ?? HeliosColors.lineSubtle}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color ?? HeliosColors.accent}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${center}, ${center}`}
        />
      </Svg>

      {/* Center content */}
      <View
        style={{
          position: 'absolute',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {value !== undefined && (
          <Text
            style={{
              ...HeliosTypography.metricMedium,
              color: HeliosColors.textPrimary,
              fontVariant: ['tabular-nums'],
            }}
          >
            {value}
          </Text>
        )}
        {label !== undefined && (
          <Text
            style={{
              ...HeliosTypography.label,
              color: HeliosColors.textSecondary,
              fontSize: 9,
              marginTop: HeliosSpacing.xs,
            }}
          >
            {label}
          </Text>
        )}
      </View>
    </View>
  );
}
