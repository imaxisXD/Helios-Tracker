import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  HeliosColors,
  HeliosTypography,
  HeliosSpacing,
} from '@/constants/theme';
import { BrutalistCard } from '@/components/ui/brutalist-card';
import { triggerHaptic } from '@/lib/haptics';
import { ACCENT_RIPPLE } from '@/lib/press-styles';

type Props = {
  onConnect: () => void;
  onSkip: () => void;
  loading: boolean;
};

const DATA_TYPES: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'heart-sharp', label: 'Heart Rate' },
  { icon: 'footsteps-sharp', label: 'Steps & Distance' },
  { icon: 'moon-sharp', label: 'Sleep Sessions' },
  { icon: 'barbell-sharp', label: 'Exercise Sessions' },
  { icon: 'flame-sharp', label: 'Calories Burned' },
  { icon: 'body-sharp', label: 'Weight & Body Fat' },
];

export function HealthConnectPermissionScreen({ onConnect, onSkip, loading }: Props) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: HeliosColors.background }}
      contentContainerStyle={{
        padding: HeliosSpacing.screenPadding,
        paddingTop: 80,
        paddingBottom: HeliosSpacing.xxl,
      }}
    >
      {/* Title */}
      <Text
        style={{
          ...HeliosTypography.heroTitle,
          color: HeliosColors.textPrimary,
          marginBottom: HeliosSpacing.xs,
        }}
      >
        {'CONNECT YOUR'}
      </Text>
      <Text
        style={{
          ...HeliosTypography.heroTitle,
          color: HeliosColors.accent,
          marginBottom: HeliosSpacing.lg,
        }}
      >
        {'HEALTH DATA'}
      </Text>
      <View
        style={{
          width: 48,
          height: 4,
          backgroundColor: HeliosColors.accent,
          marginBottom: HeliosSpacing.xl,
        }}
      />

      {/* Description */}
      <Text
        style={{
          ...HeliosTypography.body,
          color: HeliosColors.textSecondary,
          marginBottom: HeliosSpacing.xl,
          lineHeight: 22,
        }}
      >
        {'Helios reads your fitness data from Health Connect. Your Zepp app syncs data there automatically. We only request read access \u2014 nothing is modified or uploaded.'}
      </Text>

      {/* Data types card */}
      <BrutalistCard
        style={{ marginBottom: HeliosSpacing.xl }}
        verticalText="PERMISSIONS"
      >
        <View style={{ paddingRight: 28, gap: HeliosSpacing.md }}>
          <Text
            style={{
              ...HeliosTypography.cardTitle,
              color: HeliosColors.textOnCard,
              marginBottom: HeliosSpacing.sm,
            }}
          >
            {'Data We Read'}
          </Text>
          {DATA_TYPES.map((item) => (
            <View
              key={item.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: HeliosSpacing.md,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  borderCurve: 'continuous',
                  backgroundColor: HeliosColors.accentDim,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={HeliosColors.accent}
                />
              </View>
              <Text
                style={{
                  ...HeliosTypography.body,
                  color: HeliosColors.textOnCard,
                }}
              >
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </BrutalistCard>

      {/* Connect button */}
      <Pressable
        onPress={() => {
          triggerHaptic();
          onConnect();
        }}
        android_ripple={{ color: 'rgba(0,0,0,0.15)', borderless: false }}
        disabled={loading}
        style={({ pressed }) => ({
          backgroundColor: loading
            ? HeliosColors.textSecondary
            : HeliosColors.accent,
          paddingVertical: HeliosSpacing.md,
          borderRadius: 12,
          borderCurve: 'continuous',
          alignItems: 'center',
          opacity: pressed ? 0.9 : 1,
          marginBottom: HeliosSpacing.lg,
        })}
      >
        <Text
          style={{
            ...HeliosTypography.sectionTitle,
            color: HeliosColors.textOnCard,
            fontSize: 24,
          }}
        >
          {loading ? 'CONNECTING...' : 'CONNECT'}
        </Text>
      </Pressable>

      {/* Skip link */}
      <Pressable
        onPress={() => {
          triggerHaptic();
          onSkip();
        }}
        android_ripple={ACCENT_RIPPLE}
        style={({ pressed }) => ({
          alignSelf: 'center',
          paddingVertical: HeliosSpacing.sm,
          paddingHorizontal: HeliosSpacing.lg,
          opacity: pressed ? 0.6 : 1,
          borderRadius: 8,
        })}
      >
        <Text
          style={{
            ...HeliosTypography.label,
            color: HeliosColors.textSecondary,
          }}
        >
          {'SKIP FOR NOW'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
