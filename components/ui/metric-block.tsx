import React from 'react';
import { View, Text } from 'react-native';
import {
  HeliosColors,
  HeliosTypography,
} from '@/constants/theme';

type MetricBlockProps = {
  value: string;
  label: string;
  size?: 'large' | 'medium' | 'small';
  color?: string;
  onCard?: boolean;
};

export function MetricBlock({
  value,
  label,
  size = 'large',
  color,
  onCard = false,
}: MetricBlockProps) {
  const resolvedColor = color
    ? color
    : onCard
      ? HeliosColors.textOnCard
      : HeliosColors.textPrimary;

  const valueTypography =
    size === 'large'
      ? HeliosTypography.metricLarge
      : size === 'medium'
        ? HeliosTypography.metricMedium
        : HeliosTypography.metricSmall;

  return (
    <View>
      <Text
        style={{
          ...valueTypography,
          color: resolvedColor,
          fontVariant: ['tabular-nums'],
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          ...HeliosTypography.label,
          color: onCard ? HeliosColors.textOnCardMuted : HeliosColors.textSecondary,
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
