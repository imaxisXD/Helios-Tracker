import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFitnessData } from '@/hooks/use-fitness-data';
import { BrutalistCard } from '@/components/ui/brutalist-card';
import { MetricBlock } from '@/components/ui/metric-block';
import { DottedDivider } from '@/components/ui/dotted-divider';
import { SectionHeader } from '@/components/ui/section-header';
import { DecorativeBarcode } from '@/components/ui/decorative-barcode';
import {
  HeliosColors,
  HeliosTypography,
  HeliosSpacing,
} from '@/constants/theme';
import {
  formatNumber,
  formatDistance,
  formatCalories,
} from '@/lib/format-utils';
import {
  formatFullDate,
  formatTime,
  formatDuration,
} from '@/lib/date-utils';
import { triggerHaptic } from '@/lib/haptics';
import { ACCENT_RIPPLE } from '@/lib/press-styles';

const screenWidth = Dimensions.get('window').width;

export default function ActivityDayDetailScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const {
    activity,
    activityStage,
    getActivityMinutesForDay,
  } = useFitnessData();

  const dateStr = date ?? '';

  // Day's activity summary
  const dayActivity = useMemo(
    () => activity.find((a) => a.date === dateStr) ?? null,
    [activity, dateStr],
  );

  // Activity stages for this day
  const dayStages = useMemo(
    () =>
      activityStage
        .filter((s) => s.date === dateStr)
        .sort((a, b) => a.start.localeCompare(b.start)),
    [activityStage, dateStr],
  );

  // Hourly step breakdown from per-minute data
  const hourlySteps = useMemo(() => {
    const minutes = getActivityMinutesForDay(dateStr);
    if (minutes.length === 0) return [];

    const hourMap = new Map<number, number>();
    for (const m of minutes) {
      const [hStr] = m.time.split(':');
      const hour = parseInt(hStr, 10);
      hourMap.set(hour, (hourMap.get(hour) ?? 0) + m.steps);
    }

    const result: { hour: number; label: string; steps: number }[] = [];
    for (let h = 0; h < 24; h++) {
      const steps = hourMap.get(h) ?? 0;
      if (steps > 0) {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayHour = h % 12 === 0 ? 12 : h % 12;
        result.push({
          hour: h,
          label: `${displayHour}${ampm}`,
          steps,
        });
      }
    }
    return result;
  }, [getActivityMinutesForDay, dateStr]);

  const maxHourlySteps = useMemo(
    () => Math.max(...hourlySteps.map((h) => h.steps), 1),
    [hourlySteps],
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: HeliosColors.background }}
      contentContainerStyle={{ paddingBottom: HeliosSpacing.xxl + 40 }}
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* Back button + Header */}
      <View
        style={{
          paddingHorizontal: HeliosSpacing.screenPadding,
          paddingTop: 60,
          paddingBottom: HeliosSpacing.md,
        }}
      >
        <Pressable
          onPress={() => { triggerHaptic(); router.back(); }}
          android_ripple={ACCENT_RIPPLE}
          style={({ pressed }) => ({
            alignSelf: 'flex-start',
            paddingVertical: HeliosSpacing.xs,
            paddingRight: HeliosSpacing.md,
            opacity: pressed ? 0.6 : 1,
            marginBottom: HeliosSpacing.sm,
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

        <Text
          style={{
            ...HeliosTypography.heroTitle,
            color: HeliosColors.textPrimary,
          }}
        >
          {'ACTIVITY'}
        </Text>
        <Text
          style={{
            ...HeliosTypography.body,
            color: HeliosColors.textSecondary,
            marginTop: HeliosSpacing.xs,
          }}
        >
          {formatFullDate(dateStr)}
        </Text>
        <View
          style={{
            width: 48,
            height: 4,
            backgroundColor: HeliosColors.accent,
            marginTop: HeliosSpacing.sm,
          }}
        />
      </View>

      {/* Day's Totals Card */}
      <View
        style={{
          paddingHorizontal: HeliosSpacing.screenPadding,
          marginBottom: HeliosSpacing.lg,
        }}
      >
        <BrutalistCard accentDot verticalText="daily">
          <View style={{ paddingRight: 36 }}>
            <Text
              style={{
                ...HeliosTypography.cardTitle,
                color: HeliosColors.textOnCard,
                marginBottom: HeliosSpacing.md,
              }}
            >
              {"Day's Totals"}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <MetricBlock
                value={formatNumber(dayActivity?.steps ?? 0)}
                label="Steps"
                size="large"
                onCard
              />
              <MetricBlock
                value={formatDistance(dayActivity?.distance ?? 0)}
                label="Distance"
                size="large"
                onCard
              />
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: HeliosSpacing.md,
              }}
            >
              <MetricBlock
                value={formatCalories(dayActivity?.calories ?? 0)}
                label="Calories"
                size="large"
                onCard
              />
              <MetricBlock
                value={formatDistance(dayActivity?.runDistance ?? 0)}
                label="Run Distance"
                size="large"
                onCard
              />
            </View>
            <View style={{ marginTop: HeliosSpacing.md }}>
              <DecorativeBarcode
                width={screenWidth - HeliosSpacing.screenPadding * 2 - HeliosSpacing.cardPadding * 2 - 36}
                height={20}
                label="DAILY REPORT"
              />
            </View>
          </View>
        </BrutalistCard>
      </View>

      {/* Activity Stages */}
      <View
        style={{
          paddingHorizontal: HeliosSpacing.screenPadding,
          marginBottom: HeliosSpacing.lg,
        }}
      >
        <SectionHeader
          title="Activity Sessions"
          subtitle={`${dayStages.length} session${dayStages.length !== 1 ? 's' : ''} recorded`}
        />
        <View style={{ marginTop: HeliosSpacing.md, gap: HeliosSpacing.cardGap }}>
          {dayStages.length === 0 ? (
            <Text
              style={{
                ...HeliosTypography.bodySmall,
                color: HeliosColors.textSecondary,
                textAlign: 'center',
                marginTop: HeliosSpacing.lg,
              }}
            >
              {'No activity sessions recorded for this day'}
            </Text>
          ) : (
            dayStages.map((stage, idx) => (
              <BrutalistCard key={`${stage.start}-${idx}`}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: HeliosSpacing.sm,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: HeliosColors.accent,
                      paddingHorizontal: 10,
                      paddingVertical: 3,
                      borderRadius: 6,
                      borderCurve: 'continuous',
                    }}
                  >
                    <Text
                      style={{
                        ...HeliosTypography.label,
                        color: HeliosColors.textOnCard,
                        fontSize: 10,
                      }}
                    >
                      {`SESSION ${idx + 1}`}
                    </Text>
                  </View>
                  <Text
                    style={{
                      ...HeliosTypography.metricSmall,
                      color: HeliosColors.textOnCard,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {`${formatTime(stage.start)} - ${formatTime(stage.stop)}`}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}
                >
                  <MetricBlock
                    value={formatNumber(stage.steps)}
                    label="Steps"
                    size="small"
                    onCard
                  />
                  <MetricBlock
                    value={formatDistance(stage.distance)}
                    label="Distance"
                    size="small"
                    onCard
                  />
                  <MetricBlock
                    value={formatCalories(stage.calories)}
                    label="Calories"
                    size="small"
                    onCard
                  />
                </View>
              </BrutalistCard>
            ))
          )}
        </View>
      </View>

      <View style={{ paddingHorizontal: HeliosSpacing.screenPadding, marginBottom: HeliosSpacing.lg }}>
        <DottedDivider />
      </View>

      {/* Hourly Step Breakdown */}
      <View
        style={{
          paddingHorizontal: HeliosSpacing.screenPadding,
        }}
      >
        <SectionHeader
          title="Hourly Breakdown"
          subtitle="Steps by hour of day"
        />
        <View style={{ marginTop: HeliosSpacing.md, gap: HeliosSpacing.sm }}>
          {hourlySteps.length === 0 ? (
            <Text
              style={{
                ...HeliosTypography.bodySmall,
                color: HeliosColors.textSecondary,
                textAlign: 'center',
                marginTop: HeliosSpacing.lg,
              }}
            >
              {'No minute-level data available for this day'}
            </Text>
          ) : (
            hourlySteps.map((item) => {
              const barFraction = item.steps / maxHourlySteps;
              const barMaxWidth = screenWidth - HeliosSpacing.screenPadding * 2 - 100;

              return (
                <View
                  key={item.hour}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: HeliosSpacing.sm,
                  }}
                >
                  <Text
                    style={{
                      ...HeliosTypography.metricSmall,
                      color: HeliosColors.textSecondary,
                      width: 42,
                      textAlign: 'right',
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {item.label}
                  </Text>
                  <View
                    style={{
                      flex: 1,
                      height: 16,
                      backgroundColor: HeliosColors.surface,
                      borderRadius: 4,
                      borderCurve: 'continuous',
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        width: `${Math.max(barFraction * 100, 2)}%`,
                        height: '100%',
                        backgroundColor: HeliosColors.accent,
                        borderRadius: 4,
                        borderCurve: 'continuous',
                      }}
                    />
                  </View>
                  <Text
                    style={{
                      ...HeliosTypography.metricSmall,
                      color: HeliosColors.textPrimary,
                      width: 42,
                      textAlign: 'right',
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {formatNumber(item.steps)}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
  );
}
