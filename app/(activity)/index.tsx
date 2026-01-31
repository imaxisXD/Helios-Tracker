import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Link } from 'expo-router';
import { useFitnessData } from '@/hooks/use-fitness-data';
import { useComputedStats } from '@/hooks/use-computed-stats';
import { useDateRange } from '@/hooks/use-date-range';
import { BrutalistCard } from '@/components/ui/brutalist-card';
import { MetricBlock } from '@/components/ui/metric-block';
import { DottedDivider } from '@/components/ui/dotted-divider';
import { SectionHeader } from '@/components/ui/section-header';
import { DateRangeSelector } from '@/components/ui/date-range-selector';
import { DecorativeBarcode } from '@/components/ui/decorative-barcode';
import StepsBarChart from '@/components/charts/steps-bar-chart';
import CaloriesAreaChart from '@/components/charts/calories-area-chart';
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
  formatShortDate,
  formatTime,
  getRelativeDay,
} from '@/lib/date-utils';
import { CARD_RIPPLE, PRESS_SCALE } from '@/lib/press-styles';

const screenWidth = Dimensions.get('window').width;

export default function ActivityScreen() {
  const { activity, activityStage } = useFitnessData();
  const { totalSteps, totalDistance, totalCalories } = useComputedStats();
  const { range, setRange, filterByRange } = useDateRange('7d');

  const filteredActivity = useMemo(
    () => filterByRange(activity),
    [filterByRange, activity],
  );

  const filteredStages = useMemo(
    () => filterByRange(activityStage),
    [filterByRange, activityStage],
  );

  // Summary totals for selected range
  const rangeSummary = useMemo(() => {
    const data = filteredActivity;
    const steps = data.reduce((sum, d) => sum + d.steps, 0);
    const distance = data.reduce((sum, d) => sum + d.distance, 0);
    const calories = data.reduce((sum, d) => sum + d.calories, 0);
    return { steps, distance, calories };
  }, [filteredActivity]);

  // Chart data for steps
  const stepsChartData = useMemo(
    () =>
      filteredActivity.map((d) => ({
        date: d.date,
        steps: d.steps,
      })),
    [filteredActivity],
  );

  // Chart data for calories
  const caloriesChartData = useMemo(
    () =>
      filteredActivity.map((d) => ({
        date: d.date,
        calories: d.calories,
      })),
    [filteredActivity],
  );

  // Group activity stages by date for the sessions list
  const stagesByDate = useMemo(() => {
    const map = new Map<
      string,
      { start: string; stop: string; steps: number; distance: number; calories: number }[]
    >();
    for (const stage of filteredStages) {
      const existing = map.get(stage.date);
      const entry = {
        start: stage.start,
        stop: stage.stop,
        steps: stage.steps,
        distance: stage.distance,
        calories: stage.calories,
      };
      if (existing) {
        existing.push(entry);
      } else {
        map.set(stage.date, [entry]);
      }
    }
    // Sort by date descending
    return Array.from(map.entries()).sort((a, b) =>
      b[0].localeCompare(a[0]),
    );
  }, [filteredStages]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: HeliosColors.background }}
      contentContainerStyle={{ paddingBottom: HeliosSpacing.xxl + 40 }}
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* Hero Title */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={{
          paddingHorizontal: HeliosSpacing.screenPadding,
          paddingTop: 60,
          paddingBottom: HeliosSpacing.md,
        }}
      >
        <Text
          style={{
            ...HeliosTypography.heroTitle,
            color: HeliosColors.textPrimary,
          }}
        >
          {'ACTIVITY'}
        </Text>
        <View
          style={{
            width: 48,
            height: 4,
            backgroundColor: HeliosColors.accent,
            marginTop: HeliosSpacing.sm,
          }}
        />
      </Animated.View>

      {/* Date Range Selector */}
      <View
        style={{
          paddingHorizontal: HeliosSpacing.screenPadding,
          paddingBottom: HeliosSpacing.lg,
        }}
      >
        <DateRangeSelector value={range} onChange={setRange} />
      </View>

      {/* Summary Stats Card */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(400)}
        style={{
          paddingHorizontal: HeliosSpacing.screenPadding,
          marginBottom: HeliosSpacing.lg,
        }}
      >
        <BrutalistCard accentDot verticalText="summary">
          <View style={{ paddingRight: 36 }}>
            <Text
              style={{
                ...HeliosTypography.cardTitle,
                color: HeliosColors.textOnCard,
                marginBottom: HeliosSpacing.md,
              }}
            >
              {'Period Totals'}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <MetricBlock
                value={formatNumber(rangeSummary.steps)}
                label="Steps"
                size="medium"
                onCard
              />
              <MetricBlock
                value={formatDistance(rangeSummary.distance)}
                label="Distance"
                size="medium"
                onCard
              />
              <MetricBlock
                value={formatCalories(rangeSummary.calories)}
                label="Calories"
                size="medium"
                onCard
              />
            </View>
            <View style={{ marginTop: HeliosSpacing.md }}>
              <DecorativeBarcode
                width={screenWidth - HeliosSpacing.screenPadding * 2 - HeliosSpacing.cardPadding * 2 - 36}
                height={24}
                label="ACTIVITY LOG"
              />
            </View>
          </View>
        </BrutalistCard>
      </Animated.View>

      {/* Steps Bar Chart */}
      <View
        style={{
          paddingHorizontal: HeliosSpacing.screenPadding,
          marginBottom: HeliosSpacing.lg,
        }}
      >
        <SectionHeader title="Daily Steps" subtitle="Steps per day" />
        <View style={{ marginTop: HeliosSpacing.md }}>
          <StepsBarChart data={stepsChartData} goalLine={8000} height={200} />
        </View>
      </View>

      <View style={{ paddingHorizontal: HeliosSpacing.screenPadding, marginBottom: HeliosSpacing.lg }}>
        <DottedDivider />
      </View>

      {/* Calories Area Chart */}
      <View
        style={{
          paddingHorizontal: HeliosSpacing.screenPadding,
          marginBottom: HeliosSpacing.lg,
        }}
      >
        <SectionHeader title="Calories Burned" subtitle="Daily energy expenditure" />
        <View style={{ marginTop: HeliosSpacing.md }}>
          <CaloriesAreaChart data={caloriesChartData} height={180} />
        </View>
      </View>

      <View style={{ paddingHorizontal: HeliosSpacing.screenPadding, marginBottom: HeliosSpacing.lg }}>
        <DottedDivider />
      </View>

      {/* Activity Sessions List */}
      <View
        style={{
          paddingHorizontal: HeliosSpacing.screenPadding,
        }}
      >
        <SectionHeader
          title="Activity Sessions"
          subtitle="Grouped by day"
        />
        <View style={{ marginTop: HeliosSpacing.md, gap: HeliosSpacing.cardGap }}>
          {stagesByDate.length === 0 ? (
            <Text
              style={{
                ...HeliosTypography.bodySmall,
                color: HeliosColors.textSecondary,
                textAlign: 'center',
                marginTop: HeliosSpacing.lg,
              }}
            >
              {'No activity sessions for this period'}
            </Text>
          ) : (
            stagesByDate.map(([date, stages]) => {
              const daySteps = stages.reduce((s, st) => s + st.steps, 0);
              const dayDistance = stages.reduce((s, st) => s + st.distance, 0);
              const dayCal = stages.reduce((s, st) => s + st.calories, 0);

              return (
                <Link key={date} href={`/(activity)/day/${date}`} asChild>
                  <Pressable
                    android_ripple={CARD_RIPPLE}
                    style={({ pressed }) => ({
                      borderRadius: HeliosSpacing.cardRadius,
                      overflow: 'hidden' as const,
                      transform: [{ scale: pressed ? PRESS_SCALE : 1 }],
                    })}
                  >
                    {({ pressed }) => (
                      <BrutalistCard
                        style={{ opacity: pressed ? 0.92 : 1 }}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: HeliosSpacing.sm,
                          }}
                        >
                          <View>
                            <Text
                              style={{
                                ...HeliosTypography.cardTitle,
                                color: HeliosColors.textOnCard,
                              }}
                            >
                              {getRelativeDay(date)}
                            </Text>
                            <Text
                              style={{
                                ...HeliosTypography.label,
                                color: HeliosColors.textOnCardMuted,
                                marginTop: 2,
                              }}
                            >
                              {formatShortDate(date)}
                            </Text>
                          </View>
                          <View
                            style={{
                              backgroundColor: HeliosColors.accent,
                              paddingHorizontal: 8,
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
                              {`${stages.length} SESSION${stages.length > 1 ? 'S' : ''}`}
                            </Text>
                          </View>
                        </View>

                        {/* Day totals row */}
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            marginBottom: HeliosSpacing.sm,
                          }}
                        >
                          <MetricBlock
                            value={formatNumber(daySteps)}
                            label="Steps"
                            size="small"
                            onCard
                          />
                          <MetricBlock
                            value={formatDistance(dayDistance)}
                            label="Distance"
                            size="small"
                            onCard
                          />
                          <MetricBlock
                            value={formatCalories(dayCal)}
                            label="Calories"
                            size="small"
                            onCard
                          />
                        </View>

                        {/* Individual sessions */}
                        {stages.slice(0, 3).map((session, idx) => (
                          <View
                            key={`${date}-${idx}`}
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              paddingVertical: HeliosSpacing.xs,
                              borderTopWidth: idx === 0 ? 1 : 0,
                              borderTopColor: HeliosColors.lineOnCard,
                            }}
                          >
                            <Text
                              style={{
                                ...HeliosTypography.metricSmall,
                                color: HeliosColors.textOnCard,
                                fontVariant: ['tabular-nums'],
                              }}
                            >
                              {`${formatTime(session.start)} - ${formatTime(session.stop)}`}
                            </Text>
                            <Text
                              style={{
                                ...HeliosTypography.metricSmall,
                                color: HeliosColors.textOnCardMuted,
                                fontVariant: ['tabular-nums'],
                              }}
                            >
                              {`${formatNumber(session.steps)} steps`}
                            </Text>
                          </View>
                        ))}
                        {stages.length > 3 ? (
                          <Text
                            style={{
                              ...HeliosTypography.label,
                              color: HeliosColors.textOnCardMuted,
                              textAlign: 'center',
                              marginTop: HeliosSpacing.xs,
                            }}
                          >
                            {`+${stages.length - 3} MORE`}
                          </Text>
                        ) : null}
                      </BrutalistCard>
                    )}
                  </Pressable>
                </Link>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
  );
}
