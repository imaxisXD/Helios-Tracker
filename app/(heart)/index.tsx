import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Link } from 'expo-router';
import { useFitnessData } from '@/hooks/use-fitness-data';
import { useComputedStats } from '@/hooks/use-computed-stats';
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
import MiniSparkline from '@/components/charts/mini-sparkline';
import { computeHRZones, downsampleHR } from '@/lib/data-transforms';
import { formatShortDate, getRelativeDay } from '@/lib/date-utils';
import { formatBPM, formatNumber } from '@/lib/format-utils';
import { ScoreRing } from '@/components/ui/score-ring';
import { getStrainColor } from '@/lib/strain';

const MAX_HR = 190;

async function triggerHaptic() {
  if (Platform.OS === 'ios') {
    try {
      const Haptics = await import('expo-haptics');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  }
}

export default function HeartRateScreen() {
  const {
    dailyHRSummary,
    getHeartRateForDay,
    getStrainForDay,
  } = useFitnessData();
  const { restingHeartRate, todayStrain } = useComputedStats();

  // Get sorted list of dates that have HR data
  const sortedDates = useMemo(() => {
    const dates = Array.from(dailyHRSummary.keys()).sort();
    return dates;
  }, [dailyHRSummary]);

  // Initialize selected date to the last day with data
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (sortedDates.length === 0) return '';
    return sortedDates[sortedDates.length - 1];
  });

  // Current index in sorted dates
  const selectedIndex = useMemo(
    () => sortedDates.indexOf(selectedDate),
    [sortedDates, selectedDate],
  );

  const canGoBack = selectedIndex > 0;
  const canGoForward = selectedIndex < sortedDates.length - 1;

  const handlePrev = useCallback(() => {
    if (canGoBack) {
      triggerHaptic();
      setSelectedDate(sortedDates[selectedIndex - 1]);
    }
  }, [canGoBack, sortedDates, selectedIndex]);

  const handleNext = useCallback(() => {
    if (canGoForward) {
      triggerHaptic();
      setSelectedDate(sortedDates[selectedIndex + 1]);
    }
  }, [canGoForward, sortedDates, selectedIndex]);

  // Daily HR summary for selected date
  const daySummary = useMemo(
    () => (selectedDate ? dailyHRSummary.get(selectedDate) : undefined),
    [dailyHRSummary, selectedDate],
  );

  // HR records for selected day (downsampled for chart)
  const dayRecords = useMemo(() => {
    if (!selectedDate) return [];
    const raw = getHeartRateForDay(selectedDate);
    return downsampleHR(raw, 288);
  }, [getHeartRateForDay, selectedDate]);

  // Chart data format
  const chartData = useMemo(
    () => dayRecords.map((r) => ({ time: r.time, heartRate: r.heartRate })),
    [dayRecords],
  );

  // HR zones for selected day
  const zones = useMemo(() => {
    if (!selectedDate) return null;
    const raw = getHeartRateForDay(selectedDate);
    if (raw.length === 0) return null;
    return computeHRZones(raw, MAX_HR);
  }, [getHeartRateForDay, selectedDate]);

  const dayStrain = useMemo(
    () => (selectedDate ? getStrainForDay(selectedDate) : undefined),
    [getStrainForDay, selectedDate],
  );

  // Resting HR trend from dailyHRSummary
  const restingTrend = useMemo(() => {
    return sortedDates
      .map((d) => dailyHRSummary.get(d)?.resting ?? 0)
      .filter((v) => v > 0);
  }, [sortedDates, dailyHRSummary]);

  // Latest resting HR
  const latestResting = daySummary?.resting ?? restingHeartRate ?? null;

  if (sortedDates.length === 0) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: HeliosColors.background }}
        contentContainerStyle={{
          padding: HeliosSpacing.screenPadding,
          paddingBottom: HeliosSpacing.xxl,
        }}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text
          style={{
            ...HeliosTypography.heroTitle,
            color: HeliosColors.textPrimary,
            marginBottom: HeliosSpacing.lg,
          }}
        >
          {'HEART RATE'}
        </Text>
        <Text
          style={{
            ...HeliosTypography.body,
            color: HeliosColors.textSecondary,
          }}
        >
          {'No heart rate data available yet.'}
        </Text>
      </ScrollView>
    );
  }

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
      {/* Title */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text
          style={{
            ...HeliosTypography.heroTitle,
            color: HeliosColors.textPrimary,
            marginBottom: HeliosSpacing.lg,
            marginTop: HeliosSpacing.xxl,
          }}
        >
          {'HEART RATE'}
        </Text>
      </Animated.View>

      {/* Day navigation */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: HeliosSpacing.md,
        }}
      >
        <Pressable
          onPress={handlePrev}
          style={{
            opacity: canGoBack ? 1 : 0.3,
            padding: HeliosSpacing.sm,
          }}
          disabled={!canGoBack}
        >
          <Ionicons name="chevron-back-sharp" size={24} color={HeliosColors.accent} />
        </Pressable>

        <Link href={`/(heart)/day/${selectedDate}`} asChild>
          <Pressable>
            <View style={{ alignItems: 'center' }}>
              <Text
                style={{
                  ...HeliosTypography.cardTitle,
                  color: HeliosColors.textPrimary,
                }}
              >
                {getRelativeDay(selectedDate)}
              </Text>
              <Text
                style={{
                  ...HeliosTypography.label,
                  color: HeliosColors.textSecondary,
                  marginTop: 2,
                }}
              >
                {formatShortDate(selectedDate)}
              </Text>
            </View>
          </Pressable>
        </Link>

        <Pressable
          onPress={handleNext}
          style={{
            opacity: canGoForward ? 1 : 0.3,
            padding: HeliosSpacing.sm,
          }}
          disabled={!canGoForward}
        >
          <Ionicons name="chevron-forward-sharp" size={24} color={HeliosColors.accent} />
        </Pressable>
      </View>

      {/* Stats grid */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
      <BrutalistCard
        style={{ marginBottom: HeliosSpacing.cardGap }}
        verticalText="DAILY SUMMARY"
      >
        <Text
          style={{
            ...HeliosTypography.label,
            color: HeliosColors.textOnCardMuted,
            marginBottom: HeliosSpacing.sm,
          }}
        >
          {formatShortDate(selectedDate).toUpperCase()}
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
        <View style={{ marginTop: HeliosSpacing.sm }}>
          <DecorativeBarcode width={160} height={24} label="HEART DATA" />
        </View>
      </BrutalistCard>
      </Animated.View>

      {/* Daily HR chart */}
      <SectionHeader title="DAILY HEART RATE" subtitle={formatShortDate(selectedDate)} />
      <View style={{ marginTop: HeliosSpacing.md, marginBottom: HeliosSpacing.lg, overflow: 'visible', zIndex: 10 }}>
        <HeartRateLineChart data={chartData} height={180} showLabels />
      </View>

      <DottedDivider />

      {/* HR Zone breakdown */}
      {zones ? (
        <View style={{ marginTop: HeliosSpacing.lg }}>
          <SectionHeader title="HR ZONES" subtitle={`MAX HR: ${MAX_HR} BPM`} />
          <BrutalistCard style={{ marginTop: HeliosSpacing.md }}>
            {/* Stacked horizontal bar */}
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

      {dayStrain ? (
        <View style={{ marginTop: HeliosSpacing.lg }}>
          <SectionHeader title="DAILY STRAIN" subtitle={formatShortDate(selectedDate)} />
          <BrutalistCard style={{ marginTop: HeliosSpacing.md }} accentDot>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: HeliosSpacing.lg, paddingRight: 28 }}>
              <ScoreRing
                value={dayStrain.strain}
                max={21}
                size={90}
                strokeWidth={7}
                color={getStrainColor(dayStrain.level)}
                label="STRAIN"
              />
              <View style={{ flex: 1 }}>
                <Text style={{ ...HeliosTypography.sectionTitle, color: getStrainColor(dayStrain.level) }}>
                  {dayStrain.level.toUpperCase()}
                </Text>
                <Text style={{ ...HeliosTypography.metricSmall, color: HeliosColors.textOnCard, fontVariant: ['tabular-nums'], marginTop: HeliosSpacing.xs }}>
                  {`TRIMP: ${dayStrain.rawTRIMP}`}
                </Text>
                <View style={{ flexDirection: 'row', gap: HeliosSpacing.md, marginTop: HeliosSpacing.sm }}>
                  <Text style={{ ...HeliosTypography.label, color: HeliosColors.textOnCardMuted }}>
                    {`CARDIO ${dayStrain.zoneMinutes.cardio}m`}
                  </Text>
                  <Text style={{ ...HeliosTypography.label, color: HeliosColors.textOnCardMuted }}>
                    {`PEAK ${dayStrain.zoneMinutes.peak}m`}
                  </Text>
                </View>
              </View>
            </View>
          </BrutalistCard>
        </View>
      ) : null}

      {/* Resting HR trend */}
      <View style={{ marginTop: HeliosSpacing.lg }}>
        <SectionHeader title="RESTING HR TREND" />
        <View style={{ marginTop: HeliosSpacing.md }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-end',
              gap: HeliosSpacing.lg,
              marginBottom: HeliosSpacing.md,
            }}
          >
            <MetricBlock
              value={latestResting ? `${Math.round(latestResting)}` : '--'}
              label="RESTING BPM"
              size="large"
              color={HeliosColors.heartRed}
            />
            <Text
              style={{
                ...HeliosTypography.bodySmall,
                color: HeliosColors.textSecondary,
                marginBottom: 4,
              }}
            >
              {`${sortedDates.length} days tracked`}
            </Text>
          </View>
          <MiniSparkline
            data={restingTrend}
            width={320}
            height={60}
            color={HeliosColors.heartRed}
          />
        </View>
      </View>

      <View style={{ marginTop: HeliosSpacing.lg }}>
        <DottedDivider />
      </View>

      {/* Readings count */}
      {daySummary ? (
        <View style={{ marginTop: HeliosSpacing.lg, alignItems: 'center' }}>
          <Text
            style={{
              ...HeliosTypography.label,
              color: HeliosColors.textSecondary,
            }}
          >
            {`${formatNumber(daySummary.count)} READINGS ON ${formatShortDate(selectedDate).toUpperCase()}`}
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
