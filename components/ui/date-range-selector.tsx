import React, { useCallback } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { HeliosColors, HeliosFonts, HeliosSpacing } from '@/constants/theme';

type DateRangeValue = '7d' | '30d' | 'all';

type DateRangeSelectorProps = {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
};

const OPTIONS: { label: string; value: DateRangeValue }[] = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: 'ALL', value: 'all' },
];

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const handlePress = useCallback(
    async (optionValue: DateRangeValue) => {
      if (Platform.OS === 'ios') {
        try {
          const Haptics = await import('expo-haptics');
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {
          // Haptics not available, silently continue
        }
      }
      onChange(optionValue);
    },
    [onChange],
  );

  return (
    <View style={{ flexDirection: 'row', gap: HeliosSpacing.sm }}>
      {OPTIONS.map((option) => {
        const isActive = value === option.value;

        return (
          <Pressable
            key={option.value}
            onPress={() => handlePress(option.value)}
            style={({ pressed }) => ({
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 8,
              borderCurve: 'continuous' as const,
              backgroundColor: isActive
                ? HeliosColors.accent
                : HeliosColors.transparent,
              borderWidth: isActive ? 0 : 1,
              borderColor: isActive
                ? HeliosColors.transparent
                : HeliosColors.lineSubtle,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text
              style={{
                fontFamily: HeliosFonts.mono,
                fontSize: 13,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: isActive
                  ? HeliosColors.textOnCard
                  : HeliosColors.textSecondary,
                fontVariant: ['tabular-nums'],
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
