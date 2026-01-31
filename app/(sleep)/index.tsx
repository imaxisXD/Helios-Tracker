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
import ActivityRing from '@/components/charts/activity-ring';
import SleepStackedBar from '@/components/charts/sleep-stacked-bar';
import {
  HeliosColors,
  HeliosTypography,
  HeliosSpacing,
} from '@/constants/theme';
import { formatDuration } from '@/lib/date-utils';
import { formatShortDate, getRelativeDay } from '@/lib/date-utils';
import { ScoreRing } from '@/components/ui/score-ring';
import { getSleepScoreColor } from '@/lib/sleep-score';
import { formatSleepDuration } from '@/lib/sleep-need';

const screenWidth = Dimensions.get('window').width;

export default function SleepScreen() {
  const { sleep } = useFitnessData();
  const { sleepQualityScore, todaySleepScore, sleepNeed } = useComputedStats();
  const { range, setRange, filterByRange } = useDateRange('7d');

  const filteredSleep = useMemo(
    () => filterByRange(sleep),
    [filterByRange, sleep],
  );

  // Compute average stage breakdown percentages for the range
  const stageBreakdown = useMemo(() => {
    const totals = { deep: 0, light: 0, rem: 0, wake: 0 };
    for (const night of filteredSleep) {
      totals.deep += night.deepSleepTime;
      totals.light += night.shallowSleepTime;
      totals.rem += night.REMTime;
      totals.wake += night.wakeTime;
    }
    const grandTotal = totals.deep + totals.light + totals.rem + totals.wake;
    if (grandTotal === 0) {
      return { deep: 0, light: 0, rem: 0, wake: 0, total: 0 };
    }
    return {
      deep: (totals.deep / grandTotal) * 100,
      light: (totals.light / grandTotal) * 100,
      rem: (totals.rem / grandTotal) * 100,
      wake: (totals.wake / grandTotal) * 100,
      total: grandTotal,
    };
  }, [filteredSleep]);

  // Stacked bar chart data
  const stackedBarData = useMemo(
    () =>
      filteredSleep.map((night) => ({
        date: night.date,
        deep: night.deepSleepTime,
        light: night.shallowSleepTime,
        rem: night.REMTime,
        wake: night.wakeTime,
      })),
    [filteredSleep],
  );

  // Recent nights list (sorted descending by date)
  const recentNights = useMemo(
    () =>
      [...filteredSleep]
        .filter(
          (n) =>
            n.deepSleepTime + n.shallowSleepTime + n.REMTime > 0,
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [filteredSleep],
  );

  // Format ISO datetime to "HH:mm" for bed/wake times
  function formatBedWakeTime(isoStr: string): string {
    if (!isoStr) return '--:--';
    try {
      const d = new Date(isoStr);
      const h = d.getHours().toString().padStart(2, '0');
      const m = d.getMinutes().toString().padStart(2, '0');
      const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
      const displayH = d.getHours() % 12 === 0 ? 12 : d.getHours() % 12;
      return `${displayH}:${m} ${ampm}`;
    } catch {
      return '--:--';
    }
  }

  const qualityScore = sleepQualityScore ?? 0;
  const qualityProgress = qualityScore / 100;

  const STAGE_LEGEND = [
    { label: 'Deep', color: HeliosColors.sleepDeep, pct: stageBreakdown.deep },
    { label: 'Light', color: HeliosColors.sleepLight, pct: stageBreakdown.light },
    { label: 'REM', color: HeliosColors.sleepREM, pct: stageBreakdown.rem },
    { label: 'Wake', color: HeliosColors.wakeOrange, pct: stageBreakdown.wake },
  ];

  // Total bar width for horizontal stacked bar (excluding padding)
  const barWidth = screenWidth - HeliosSpacing.screenPadding * 2 - HeliosSpacing.cardPadding * 2 - 36;

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
          {'SLEEP'}
        </Text>
        <View
          style={{
            width: 48,
            height: 4,
            backgroundColor: HeliosColors.sleepDeep,
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

      {/* Sleep Quality Score Ring */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(400)}
        style={{
          paddingHorizontal: HeliosSpacing.screenPadding,
          marginBottom: HeliosSpacing.lg,
        }}
      >
        <BrutalistCard accentDot verticalText="SLEEP SCORE">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: HeliosSpacing.lg, paddingRight: 36 }}>
            <ScoreRing
              value={todaySleepScore?.score ?? qualityScore ?? 0}
              max={100}
              size={120}
              strokeWidth={10}
              color={getSleepScoreColor(todaySleepScore?.level ?? 'red')}
              label="SCORE"
            />
            <View style={{ flex: 1 }}>
              <Text style={{ ...HeliosTypography.cardTitle, color: HeliosColors.textOnCard, marginBottom: HeliosSpacing.xs }}>
                {'Sleep Score'}
              </Text>
              <Text style={{ ...HeliosTypography.bodySmall, color: HeliosColors.textOnCardMuted }}>
                {(todaySleepScore?.score ?? qualityScore ?? 0) >= 70
                  ? 'Great sleep quality. Keep it up!'
                  : (todaySleepScore?.score ?? qualityScore ?? 0) >= 40
                    ? 'Moderate sleep, room for improvement.'
                    : (todaySleepScore?.score ?? qualityScore ?? 0) > 0
                      ? 'Sleep quality could be better.'
                      : 'No sleep data available yet.'}
              </Text>
            </View>
          </View>
        </BrutalistCard>
      </Animated.View>

      {todaySleepScore ? (
        <Animated.View
          entering={FadeInDown.delay(150).duration(400)}
          style={{ paddingHorizontal: HeliosSpacing.screenPadding, marginBottom: HeliosSpacing.lg }}
        >
          <BrutalistCard verticalText="SUB-SCORES">
            <View style={{ paddingRight: 36, gap: HeliosSpacing.md }}>
              {[
                { label: 'SUFFICIENCY', value: todaySleepScore.sufficiency },
                { label: 'EFFICIENCY', value: todaySleepScore.efficiency },
                { label: 'STAGE QUALITY', value: todaySleepScore.stageQuality },
                { label: 'CONSISTENCY', value: todaySleepScore.consistency },
              ].map((sub) => (
                <View key={sub.label}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ ...HeliosTypography.label, color: HeliosColors.textOnCardMuted }}>
                      {sub.label}
                    </Text>
                    <Text style={{ ...HeliosTypography.metricSmall, color: HeliosColors.textOnCard, fontVariant: ['tabular-nums'] }}>
                      {`${Math.round(sub.value)}`}
                    </Text>
                  </View>
                  <View style={{ height: 6, borderRadius: 3, borderCurve: 'continuous', backgroundColor: HeliosColors.lineOnCard, overflow: 'hidden' }}>
                    <View style={{ width: `${Math.min(sub.value, 100)}%`, height: '100%', borderRadius: 3, borderCurve: 'continuous', backgroundColor: getSleepScoreColor(todaySleepScore.level) }} />
                  </View>
                </View>
              ))}
            </View>
          </BrutalistCard>
        </Animated.View>
      ) : null}

      {/* Stage Breakdown - Horizontal Stacked Bar */}
      <View
        style={{
          paddingHorizontal: HeliosSpacing.screenPadding,
          marginBottom: HeliosSpacing.lg,
        }}
      >
        <BrutalistCard verticalText="stages">
          <View style={{ paddingRight: 36 }}>
            <Text
              style={{
                ...HeliosTypography.cardTitle,
                color: HeliosColors.textOnCard,
                marginBottom: HeliosSpacing.md,
              }}
            >
              {'Stage Breakdown'}
            </Text>

            {/* Horizontal stacked bar */}
            {stageBreakdown.total > 0 ? (
              <View
                style={{
                  flexDirection: 'row',
                  height: 24,
                  borderRadius: 6,
                  borderCurve: 'continuous',
                  overflow: 'hidden',
                  marginBottom: HeliosSpacing.md,
                }}
              >
                {STAGE_LEGEND.map((stage) => (
                  <View
                    key={stage.label}
                    style={{
                      width: `${stage.pct}%`,
                      height: '100%',
                      backgroundColor: stage.color,
                    }}
                  />
                ))}
              </View>
            ) : (
              <View
                style={{
                  height: 24,
                  borderRadius: 6,
                  borderCurve: 'continuous',
                  backgroundColor: HeliosColors.lineOnCard,
                  marginBottom: HeliosSpacing.md,
                }}
              />
            )}

            {/* Legend with percentages */}
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: HeliosSpacing.md,
              }}
            >
              {STAGE_LEGEND.map((stage) => (
                <View
                  key={stage.label}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: HeliosSpacing.xs,
                  }}
                >
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      borderCurve: 'continuous',
                      backgroundColor: stage.color,
                    }}
                  />
                  <Text
                    style={{
                      ...HeliosTypography.metricSmall,
                      color: HeliosColors.textOnCard,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {`${Math.round(stage.pct)}%`}
                  </Text>
                  <Text
                    style={{
                      ...HeliosTypography.label,
                      color: HeliosColors.textOnCardMuted,
                      fontSize: 9,
                    }}
                  >
                    {stage.label.toUpperCase()}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </BrutalistCard>
      </View>

      {/* Sleep Stacked Bar Chart */}
      <View
        style={{
          paddingHorizontal: HeliosSpacing.screenPadding,
          marginBottom: HeliosSpacing.lg,
        }}
      >
        <SectionHeader
          title="Nightly Duration"
          subtitle="Sleep stage breakdown by night"
        />
        <View style={{ marginTop: HeliosSpacing.md }}>
          {stackedBarData.length > 0 ? (
            <SleepStackedBar data={stackedBarData} height={200} />
          ) : (
            <View
              style={{
                height: 200,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  ...HeliosTypography.bodySmall,
                  color: HeliosColors.textSecondary,
                }}
              >
                {'No sleep data for this period'}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={{ paddingHorizontal: HeliosSpacing.screenPadding, marginBottom: HeliosSpacing.lg }}>
        <DottedDivider />
      </View>

      {sleepNeed ? (
        <View style={{ paddingHorizontal: HeliosSpacing.screenPadding, marginBottom: HeliosSpacing.lg }}>
          <BrutalistCard>
            <Text style={{ ...HeliosTypography.label, color: HeliosColors.textOnCardMuted, marginBottom: HeliosSpacing.xs }}>
              {'RECOMMENDED SLEEP'}
            </Text>
            <Text style={{ ...HeliosTypography.metricLarge, color: HeliosColors.textOnCard, fontVariant: ['tabular-nums'] }}>
              {formatSleepDuration(sleepNeed.recommendedMin)}
            </Text>
            <View style={{ flexDirection: 'row', gap: HeliosSpacing.lg, marginTop: HeliosSpacing.sm }}>
              <Text style={{ ...HeliosTypography.metricSmall, color: HeliosColors.textOnCardMuted, fontVariant: ['tabular-nums'] }}>
                {`BASE: ${formatSleepDuration(sleepNeed.baseMin)}`}
              </Text>
              {sleepNeed.strainAdjustMin > 0 ? (
                <Text style={{ ...HeliosTypography.metricSmall, color: HeliosColors.textOnCardMuted, fontVariant: ['tabular-nums'] }}>
                  {`+${sleepNeed.strainAdjustMin}m STRAIN`}
                </Text>
              ) : null}
              {sleepNeed.debtAdjustMin > 0 ? (
                <Text style={{ ...HeliosTypography.metricSmall, color: HeliosColors.textOnCardMuted, fontVariant: ['tabular-nums'] }}>
                  {`+${Math.round(sleepNeed.debtAdjustMin)}m DEBT`}
                </Text>
              ) : null}
            </View>
          </BrutalistCard>
        </View>
      ) : null}

      {/* Recent Nights List */}
      <View
        style={{
          paddingHorizontal: HeliosSpacing.screenPadding,
        }}
      >
        <SectionHeader
          title="Recent Nights"
          subtitle="Tap a night for details"
        />
        <View style={{ marginTop: HeliosSpacing.md, gap: HeliosSpacing.cardGap }}>
          {recentNights.length === 0 ? (
            <Text
              style={{
                ...HeliosTypography.bodySmall,
                color: HeliosColors.textSecondary,
                textAlign: 'center',
                marginTop: HeliosSpacing.lg,
              }}
            >
              {'No sleep data for this period'}
            </Text>
          ) : (
            recentNights.map((night) => {
              const totalSleep =
                night.deepSleepTime +
                night.shallowSleepTime +
                night.REMTime;
              const totalWithWake = totalSleep + night.wakeTime;
              const deepPct =
                totalWithWake > 0
                  ? (night.deepSleepTime / totalWithWake) * 100
                  : 0;
              const lightPct =
                totalWithWake > 0
                  ? (night.shallowSleepTime / totalWithWake) * 100
                  : 0;
              const remPct =
                totalWithWake > 0
                  ? (night.REMTime / totalWithWake) * 100
                  : 0;
              const wakePct =
                totalWithWake > 0
                  ? (night.wakeTime / totalWithWake) * 100
                  : 0;

              return (
                <Link
                  key={night.date}
                  href={`/(sleep)/night/${night.date}`}
                  asChild
                >
                  <Pressable>
                    {({ pressed }) => (
                      <BrutalistCard
                        style={{ opacity: pressed ? 0.92 : 1 }}
                      >
                        {/* Header: date + total sleep */}
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
                              {getRelativeDay(night.date)}
                            </Text>
                            <Text
                              style={{
                                ...HeliosTypography.label,
                                color: HeliosColors.textOnCardMuted,
                                marginTop: 2,
                              }}
                            >
                              {formatShortDate(night.date)}
                            </Text>
                          </View>
                          <Text
                            style={{
                              ...HeliosTypography.metricMedium,
                              color: HeliosColors.textOnCard,
                              fontVariant: ['tabular-nums'],
                            }}
                          >
                            {formatDuration(totalSleep)}
                          </Text>
                        </View>

                        {/* Bed -> Wake times */}
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            marginBottom: HeliosSpacing.sm,
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: HeliosSpacing.xs }}>
                            <Text
                              style={{
                                ...HeliosTypography.label,
                                color: HeliosColors.textOnCardMuted,
                              }}
                            >
                              {'BED'}
                            </Text>
                            <Text
                              style={{
                                ...HeliosTypography.metricSmall,
                                color: HeliosColors.textOnCard,
                                fontVariant: ['tabular-nums'],
                              }}
                            >
                              {formatBedWakeTime(night.start)}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: HeliosSpacing.xs }}>
                            <Text
                              style={{
                                ...HeliosTypography.label,
                                color: HeliosColors.textOnCardMuted,
                              }}
                            >
                              {'WAKE'}
                            </Text>
                            <Text
                              style={{
                                ...HeliosTypography.metricSmall,
                                color: HeliosColors.textOnCard,
                                fontVariant: ['tabular-nums'],
                              }}
                            >
                              {formatBedWakeTime(night.stop)}
                            </Text>
                          </View>
                        </View>

                        {/* Thin proportional stage bar */}
                        <View
                          style={{
                            flexDirection: 'row',
                            height: 8,
                            borderRadius: 4,
                            borderCurve: 'continuous',
                            overflow: 'hidden',
                          }}
                        >
                          <View
                            style={{
                              width: `${deepPct}%`,
                              height: '100%',
                              backgroundColor: HeliosColors.sleepDeep,
                            }}
                          />
                          <View
                            style={{
                              width: `${lightPct}%`,
                              height: '100%',
                              backgroundColor: HeliosColors.sleepLight,
                            }}
                          />
                          <View
                            style={{
                              width: `${remPct}%`,
                              height: '100%',
                              backgroundColor: HeliosColors.sleepREM,
                            }}
                          />
                          <View
                            style={{
                              width: `${wakePct}%`,
                              height: '100%',
                              backgroundColor: HeliosColors.wakeOrange,
                            }}
                          />
                        </View>
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
