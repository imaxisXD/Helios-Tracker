import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFitnessData } from '@/hooks/use-fitness-data';
import {
  HeliosColors,
  HeliosTypography,
  HeliosSpacing,
} from '@/constants/theme';
import { BrutalistCard } from '@/components/ui/brutalist-card';
import { MetricBlock } from '@/components/ui/metric-block';
import { DottedDivider } from '@/components/ui/dotted-divider';
import { SectionHeader } from '@/components/ui/section-header';
import { DecorativeBarcode } from '@/components/ui/decorative-barcode';
import HeartRateLineChart from '@/components/charts/heart-rate-line-chart';
import { computeHRZones, downsampleHR } from '@/lib/data-transforms';
import { formatFullDate, formatShortDate } from '@/lib/date-utils';
import { formatNumber } from '@/lib/format-utils';
import { triggerHaptic } from '@/lib/haptics';
import { ACCENT_RIPPLE } from '@/lib/press-styles';

const MAX_HR = 190;

export default function HeartDayDetailScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const { getHeartRateForDay, getDailyHRSummary } = useFitnessData();

  const dateStr = date ?? '';

  // Get HR summary for the day
  const daySummary = useMemo(
    () => getDailyHRSummary(dateStr),
    [getDailyHRSummary, dateStr],
  );

  // Get raw records and downsampled chart data
  const rawRecords = useMemo(
    () => getHeartRateForDay(dateStr),
    [getHeartRateForDay, dateStr],
  );

  const chartRecords = useMemo(
    () => downsampleHR(rawRecords, 288),
    [rawRecords],
  );

  const chartData = useMemo(
    () => chartRecords.map((r) => ({ time: r.time, heartRate: r.heartRate })),
    [chartRecords],
  );

  // HR zones for the day
  const zones = useMemo(() => {
    if (rawRecords.length === 0) return null;
    return computeHRZones(rawRecords, MAX_HR);
  }, [rawRecords]);

  const zoneColors = {
    rest: '#777777',
    fatBurn: HeliosColors.accent,
    cardio: HeliosColors.wakeOrange,
    peak: HeliosColors.heartRed,
  };

  const zoneLabels = {
    rest: 'REST',
    fatBurn: 'FAT BURN',
    cardio: 'CARDIO',
    peak: 'PEAK',
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: HeliosColors.background }}
      contentContainerStyle={{
        padding: HeliosSpacing.screenPadding,
        paddingBottom: HeliosSpacing.xxl + 40,
      }}
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* Back button */}
      <Pressable
        onPress={() => { triggerHaptic(); router.back(); }}
        android_ripple={ACCENT_RIPPLE}
        style={({ pressed }) => ({
          marginTop: HeliosSpacing.xxl,
          marginBottom: HeliosSpacing.sm,
          alignSelf: 'flex-start',
          paddingVertical: HeliosSpacing.xs,
          paddingRight: HeliosSpacing.md,
          opacity: pressed ? 0.6 : 1,
          borderRadius: 8,
        })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="chevron-back" size={16} color={HeliosColors.accent} />
          <Text
            style={{
              ...HeliosTypography.label,
              color: HeliosColors.accent,
            }}
          >
            {'BACK'}
          </Text>
        </View>
      </Pressable>

      {/* Title */}
      <Text
        style={{
          ...HeliosTypography.heroTitle,
          color: HeliosColors.textPrimary,
          marginBottom: HeliosSpacing.xs,
        }}
      >
        {'HEART RATE'}
      </Text>
      <Text
        style={{
          ...HeliosTypography.body,
          color: HeliosColors.textSecondary,
          marginBottom: HeliosSpacing.lg,
        }}
      >
        {formatFullDate(dateStr)}
      </Text>

      {/* Empty state */}
      {rawRecords.length === 0 ? (
        <View
          style={{
            paddingVertical: HeliosSpacing.xxl,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              ...HeliosTypography.body,
              color: HeliosColors.textSecondary,
            }}
          >
            {'No heart rate data for this day.'}
          </Text>
        </View>
      ) : (
        <>
          {/* Full day HR chart */}
          <SectionHeader
            title="FULL DAY CHART"
            subtitle={`${formatNumber(rawRecords.length)} readings`}
          />
          <View style={{ marginTop: HeliosSpacing.md, marginBottom: HeliosSpacing.lg, overflow: 'visible', zIndex: 10 }}>
            <HeartRateLineChart data={chartData} height={220} showLabels />
          </View>

          <DottedDivider />

          {/* HR summary stats */}
          <BrutalistCard
            style={{ marginTop: HeliosSpacing.lg }}
            accentDot
            verticalText="HR SUMMARY"
          >
            <Text
              style={{
                ...HeliosTypography.cardTitle,
                color: HeliosColors.textOnCard,
                marginBottom: HeliosSpacing.md,
              }}
            >
              {formatShortDate(dateStr).toUpperCase()}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: HeliosSpacing.md,
                paddingRight: 28,
              }}
            >
              <View style={{ width: '45%' }}>
                <MetricBlock
                  value={daySummary ? `${Math.round(daySummary.resting)}` : '--'}
                  label="RESTING BPM"
                  size="medium"
                  onCard
                />
              </View>
              <View style={{ width: '45%' }}>
                <MetricBlock
                  value={daySummary ? `${Math.round(daySummary.avg)}` : '--'}
                  label="AVG BPM"
                  size="medium"
                  onCard
                />
              </View>
              <View style={{ width: '45%' }}>
                <MetricBlock
                  value={daySummary ? `${Math.round(daySummary.max)}` : '--'}
                  label="MAX BPM"
                  size="medium"
                  color={HeliosColors.heartRed}
                  onCard
                />
              </View>
              <View style={{ width: '45%' }}>
                <MetricBlock
                  value={daySummary ? `${Math.round(daySummary.min)}` : '--'}
                  label="MIN BPM"
                  size="medium"
                  onCard
                />
              </View>
            </View>
            <View style={{ marginTop: HeliosSpacing.md }}>
              <DecorativeBarcode width={140} height={20} label="HEART DETAIL" />
            </View>
          </BrutalistCard>

          {/* Zone breakdown */}
          {zones ? (
            <View style={{ marginTop: HeliosSpacing.lg }}>
              <SectionHeader title="HR ZONES" subtitle={`MAX HR: ${MAX_HR} BPM`} />
              <BrutalistCard style={{ marginTop: HeliosSpacing.md }}>
                {/* Stacked bar */}
                <View
                  style={{
                    flexDirection: 'row',
                    height: 20,
                    borderRadius: 4,
                    borderCurve: 'continuous',
                    overflow: 'hidden',
                    marginBottom: HeliosSpacing.md,
                  }}
                >
                  {(['rest', 'fatBurn', 'cardio', 'peak'] as const).map((zone) => {
                    const pct = zones[zone].percent;
                    if (pct <= 0) return null;
                    return (
                      <View
                        key={zone}
                        style={{
                          flex: pct,
                          backgroundColor: zoneColors[zone],
                        }}
                      />
                    );
                  })}
                </View>
                {/* Zone labels */}
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: HeliosSpacing.md,
                    paddingRight: 28,
                  }}
                >
                  {(['rest', 'fatBurn', 'cardio', 'peak'] as const).map((zone) => (
                    <View key={zone} style={{ width: '45%', marginBottom: HeliosSpacing.sm }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginBottom: 4,
                        }}
                      >
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            borderCurve: 'continuous',
                            backgroundColor: zoneColors[zone],
                            marginRight: HeliosSpacing.xs,
                          }}
                        />
                        <Text
                          style={{
                            ...HeliosTypography.label,
                            color: HeliosColors.textOnCardMuted,
                          }}
                        >
                          {zoneLabels[zone]}
                        </Text>
                      </View>
                      <Text
                        style={{
                          ...HeliosTypography.metricSmall,
                          color: HeliosColors.textOnCard,
                          fontVariant: ['tabular-nums'],
                        }}
                      >
                        {`${Math.round(zones[zone].percent)}% \u00B7 ${zones[zone].minutes} min`}
                      </Text>
                    </View>
                  ))}
                </View>
              </BrutalistCard>
            </View>
          ) : null}

          {/* Total readings */}
          <View style={{ marginTop: HeliosSpacing.lg }}>
            <DottedDivider />
          </View>
          <View style={{ marginTop: HeliosSpacing.lg, alignItems: 'center' }}>
            <Text
              style={{
                ...HeliosTypography.metricMedium,
                color: HeliosColors.textPrimary,
                fontVariant: ['tabular-nums'],
              }}
            >
              {formatNumber(rawRecords.length)}
            </Text>
            <Text
              style={{
                ...HeliosTypography.label,
                color: HeliosColors.textSecondary,
                marginTop: HeliosSpacing.xs,
              }}
            >
              {'TOTAL HR READINGS'}
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}
