import React from 'react';
import { View, Text } from 'react-native';
import { HeliosColors, HeliosTypography } from '@/constants/theme';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
};

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <View>
      <Text
        style={{
          ...HeliosTypography.sectionTitle,
          color: HeliosColors.textPrimary,
        }}
      >
        {title}
      </Text>

      <View
        style={{
          width: 40,
          height: 2,
          backgroundColor: HeliosColors.accent,
          marginTop: 6,
        }}
      />

      {subtitle ? (
        <Text
          style={{
            ...HeliosTypography.label,
            color: HeliosColors.textSecondary,
            marginTop: 8,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}
