// ---------------------------------------------------------------------------
// Helios-Tracker  --  Dashboard (flagship screen)
// ---------------------------------------------------------------------------

import React, { useMemo } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { format, parseISO } from 'date-fns';

import {
  HeliosColors,
  HeliosTypography,
  HeliosFonts,
  HeliosSpacing,
} from '@/constants/theme';

import { useFitnessData } from '@/hooks/use-fitness-data';
import { useComputedStats } from '@/hooks/use-computed-stats';

import { BrutalistCard } from '@/components/ui/brutalist-card';
import { MetricBlock } from '@/components/ui/metric-block';
import { DottedDivider } from '@/components/ui/dotted-divider';
import { DecorativeBarcode } from '@/components/ui/decorative-barcode';
import { SectionHeader } from '@/components/ui/section-header';
import { TickerBar } from '@/components/ui/ticker-bar';
import MiniSparkline from '@/components/charts/mini-sparkline';
import ActivityRing from '@/components/charts/activity-ring';

import { ScoreRing } from '@/components/ui/score-ring';
import { getRecoveryColor } from '@/lib/recovery';
import { getStrainColor } from '@/lib/strain';
import { getSleepScoreColor } from '@/lib/sleep-score';
import { getCoachColor } from '@/lib/strain-coach';

import { formatNumber, formatDistance } from '@/lib/format-utils';
import { formatDuration, formatDurationSeconds, getRelativeDay, getWeekDates } from '@/lib/date-utils';
import { sportTypeName } from '@/lib/sport-types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatHeaderDate(): string {
  return format(new Date(), 'EEE MMM dd, yyyy').toUpperCase();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DashboardScreen() {
  const {
    activity,
    heartRateAuto,
    sport,
  } = useFitnessData();

  const {
    todayActivity,
    lastNightSleep,
    latestHeartRate,
    restingHeartRate,
    stepGoalPercent,
    sleepQualityScore,
    weeklyAvgSteps,
    avgCaloriesPerDay,
    todayStrain,
    todayRecovery,
    todaySleepScore,
    strainCoach,
    sleepNeed,
  } = useComputedStats();

  // ---- Derived data ----

  // Activity to display: today or most recent
  const displayActivity = useMemo(() => {
    if (todayActivity) return { data: todayActivity, isToday: true };
    const sorted = [...activity].reverse();
    const recent = sorted.find((a) => a.steps > 0);
    return recent ? { data: recent, isToday: false } : null;
  }, [todayActivity, activity]);

  // Step goal fraction (0-1)
  const stepGoalFraction = useMemo(() => {
    return Math.min(stepGoalPercent / 100, 1);
  }, [stepGoalPercent]);

  // Walk vs run distance for today card
  const walkRunBreakdown = useMemo(() => {
    if (!displayActivity) return null;
    const { data } = displayActivity;
    const runDist = data.runDistance;
    const walkDist = data.distance - runDist;
    return {
      walk: formatDistance(walkDist > 0 ? walkDist : 0),
      run: formatDistance(runDist),
    };
  }, [displayActivity]);

  // Sleep stage proportions
  const sleepStages = useMemo(() => {
    if (!lastNightSleep) return null;
    const deep = lastNightSleep.deepSleepTime;
    const light = lastNightSleep.shallowSleepTime;
    const rem = lastNightSleep.REMTime;
    const wake = lastNightSleep.wakeTime;
    const total = deep + light + rem + wake;
    if (total === 0) return null;
    return {
      deep: deep / total,
      light: light / total,
      rem: rem / total,
      wake: wake / total,
      totalMinutes: deep + light + rem,
    };
  }, [lastNightSleep]);

  // Sleep bed/wake times
  const sleepTimes = useMemo(() => {
    if (!lastNightSleep) return null;
    try {
      const bed = format(parseISO(lastNightSleep.start), 'h:mm a');
      const wakeUp = format(parseISO(lastNightSleep.stop), 'h:mm a');
      return { bed, wakeUp };
    } catch {
      return null;
    }
  }, [lastNightSleep]);

  // Heart rate sparkline data (last 30 readings)
  const hrSparklineData = useMemo(() => {
    const slice = heartRateAuto.slice(-30);
    return slice.map((r) => r.heartRate);
  }, [heartRateAuto]);

  // Last workout
  const lastWorkout = useMemo(() => {
    if (sport.length === 0) return null;
    return sport[sport.length - 1];
  }, [sport]);

  // Weekly overview: last 7 days of step data
  const weeklyData = useMemo(() => {
    const dates = getWeekDates();
    return dates.map((dateStr) => {
      const dayActivity = activity.find((a) => a.date === dateStr);
      const steps = dayActivity?.steps ?? 0;
      const goalMet = steps >= 8000;
      const dayDate = new Date(dateStr + 'T00:00:00');
      const dayLabel = format(dayDate, 'EEEEE');
      return { date: dateStr, dayLabel, steps, goalMet };
    });
  }, [activity]);

  // Ticker items
  const tickerItems = useMemo(() => {
    const items: string[] = [];
    if (displayActivity) {
      items.push(`STEPS: ${formatNumber(displayActivity.data.steps)}`);
      items.push(`CALORIES: ${formatNumber(displayActivity.data.calories)}`);
    }
    if (latestHeartRate) {
      items.push(`BPM: ${latestHeartRate.heartRate}`);
    }
    if (restingHeartRate) {
      items.push(`RESTING HR: ${restingHeartRate}`);
    }
    items.push(`AVG STEPS/WEEK: ${formatNumber(weeklyAvgSteps)}`);
    items.push(`AVG CAL/DAY: ${formatNumber(avgCaloriesPerDay)}`);
    if (todayStrain) {
      items.push(`STRAIN: ${todayStrain.strain.toFixed(1)}`);
    }
    if (todayRecovery) {
      items.push(`RECOVERY: ${todayRecovery.score}%`);
    }
    if (items.length === 0) {
      items.push('HELIOS TRACKER // NO DATA');
    }
    return items;
  }, [displayActivity, latestHeartRate, restingHeartRate, weeklyAvgSteps, avgCaloriesPerDay, todayStrain, todayRecovery]);

  // ---- Render ----

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ flex: 1, backgroundColor: HeliosColors.background }}
      contentContainerStyle={{ paddingBottom: HeliosSpacing.xxl + 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ================================================================ */}
      {/* 1. HERO HEADER                                                    */}
      {/* ================================================================ */}
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={{
          paddingHorizontal: HeliosSpacing.screenPadding,
          paddingTop: 64,
          paddingBottom: HeliosSpacing.lg,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View>
            <Text
              style={{
                ...HeliosTypography.heroTitle,
                fontSize: 72,
                lineHeight: 72,
                letterSpacing: 3,
                color: HeliosColors.textPrimary,
              }}
            >
              HELIOS
            </Text>
            <Text
              style={{
                ...HeliosTypography.label,
                color: HeliosColors.textSecondary,
                marginTop: HeliosSpacing.sm,
              }}
            >
              {formatHeaderDate()}
            </Text>
            <View
              style={{
                width: 60,
                height: 2,
                backgroundColor: HeliosColors.accent,
                marginTop: HeliosSpacing.sm,
              }}
            />
          </View>
          <Text
            style={{
              ...HeliosTypography.script,
              color: HeliosColors.accent,
              marginBottom: 4,
            }}
          >
            Metrics
          </Text>
        </View>
      </Animated.View>

      {/* ================================================================ */}
      {/* SCORES ROW                                                        */}
      {/* ================================================================ */}
      <Animated.View entering={FadeInDown.delay(50).duration(400)} style={{ paddingHorizontal: HeliosSpacing.screenPadding, marginBottom: HeliosSpacing.lg }}>
        <BrutalistCard verticalText="SCORES">
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: HeliosSpacing.sm, paddingRight: 28 }}>
            <ScoreRing
              value={todayRecovery?.score ?? 0}
              max={100}
              size={90}
              strokeWidth={7}
              color={getRecoveryColor(todayRecovery?.level ?? 'red')}
              label="RECOVERY"
            />
            <ScoreRing
              value={todayStrain?.strain ?? 0}
              max={21}
              size={90}
              strokeWidth={7}
              color={getStrainColor(todayStrain?.level ?? 'rest')}
              label="STRAIN"
            />
            <ScoreRing
              value={todaySleepScore?.score ?? 0}
              max={100}
              size={90}
              strokeWidth={7}
              color={getSleepScoreColor(todaySleepScore?.level ?? 'red')}
              label="SLEEP"
            />
          </View>
        </BrutalistCard>

        <View style={{ marginTop: HeliosSpacing.cardGap }}>
          <BrutalistCard accentDot>
            <Text style={{ ...HeliosTypography.label, color: HeliosColors.textOnCardMuted, marginBottom: HeliosSpacing.xs }}>
              {"TODAY'S TARGET"}
            </Text>
            <Text style={{ ...HeliosTypography.sectionTitle, color: getCoachColor(strainCoach.label), marginBottom: HeliosSpacing.xs }}>
              {strainCoach.label}
            </Text>
            <Text style={{ ...HeliosTypography.metricSmall, color: HeliosColors.textOnCard, fontVariant: ['tabular-nums'], marginBottom: HeliosSpacing.sm }}>
              {`STRAIN TARGET: ${strainCoach.targetMin}\u2013${strainCoach.targetMax}`}
            </Text>
            <Text style={{ ...HeliosTypography.bodySmall, color: HeliosColors.textOnCardMuted }}>
              {strainCoach.description}
            </Text>
          </BrutalistCard>
        </View>
      </Animated.View>

      {/* ================================================================ */}
      {/* 2. TODAY SUMMARY CARD                                             */}
      {/* ================================================================ */}
      <Animated.View entering={FadeInDown.delay(150).duration(400)} style={{ paddingHorizontal: HeliosSpacing.screenPadding }}>
        <BrutalistCard
          accentDot
          verticalText="PEAK PERFORMANCE"
          style={{ paddingRight: 40 }}
        >
          {!displayActivity ? (
            <Text
              style={{
                ...HeliosTypography.body,
                color: HeliosColors.textOnCardMuted,
              }}
            >
              No activity data yet.
            </Text>
          ) : (
            <>
              {!displayActivity.isToday ? (
                <Text
                  style={{
                    ...HeliosTypography.label,
                    color: HeliosColors.textOnCardMuted,
                    marginBottom: HeliosSpacing.sm,
                  }}
                >
                  LAST RECORDED {'\u2014'} {getRelativeDay(displayActivity.data.date).toUpperCase()}
                </Text>
              ) : null}

              {/* Metric row */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: HeliosSpacing.md,
                }}
              >
                <MetricBlock
                  value={formatNumber(displayActivity.data.steps)}
                  label="STEPS"
                  size="medium"
                  onCard
                />
                <MetricBlock
                  value={formatDistance(displayActivity.data.distance)}
                  label="DISTANCE"
                  size="medium"
                  onCard
                />
                <MetricBlock
                  value={formatNumber(displayActivity.data.calories)}
                  label="KCAL"
                  size="medium"
                  onCard
                />
              </View>

              {/* Activity ring + breakdown */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: HeliosSpacing.md,
                }}
              >
                <ActivityRing
                  progress={stepGoalFraction}
                  size={80}
                  strokeWidth={8}
                  label="GOAL"
                  value={`${Math.round(stepGoalPercent)}%`}
                />
                {walkRunBreakdown ? (
                  <View style={{ gap: HeliosSpacing.xs }}>
                    <Text
                      style={{
                        ...HeliosTypography.metricSmall,
                        color: HeliosColors.textOnCard,
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      Walk {walkRunBreakdown.walk}
                    </Text>
                    <Text
                      style={{
                        ...HeliosTypography.metricSmall,
                        color: HeliosColors.textOnCard,
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      Run{'  '}{walkRunBreakdown.run}
                    </Text>
                  </View>
                ) : null}
              </View>
            </>
          )}
        </BrutalistCard>
      </Animated.View>

      {/* Divider */}
      <View style={{ marginVertical: HeliosSpacing.lg }}>
        <DottedDivider />
      </View>

      {/* ================================================================ */}
      {/* 3. SLEEP SUMMARY CARD                                             */}
      {/* ================================================================ */}
      <Animated.View entering={FadeInDown.delay(250).duration(400)} style={{ paddingHorizontal: HeliosSpacing.screenPadding }}>
        <BrutalistCard>
          <Text
            style={{
              ...HeliosTypography.cardTitle,
              color: HeliosColors.textOnCard,
              marginBottom: HeliosSpacing.sm,
            }}
          >
            LAST NIGHT
          </Text>

          {!lastNightSleep || !sleepStages ? (
            <Text
              style={{
                ...HeliosTypography.body,
                color: HeliosColors.textOnCardMuted,
              }}
            >
              No sleep data recorded.
            </Text>
          ) : (
            <>
              {/* Total sleep + quality score */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  gap: HeliosSpacing.xl,
                  marginBottom: HeliosSpacing.md,
                }}
              >
                <MetricBlock
                  value={formatDuration(sleepStages.totalMinutes)}
                  label="TOTAL SLEEP"
                  size="large"
                  onCard
                />
                {sleepQualityScore !== null ? (
                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                      <Text
                        style={{
                          ...HeliosTypography.metricMedium,
                          color: HeliosColors.textOnCard,
                          fontVariant: ['tabular-nums'],
                        }}
                      >
                        {sleepQualityScore}
                      </Text>
                      <Text
                        style={{
                          ...HeliosTypography.metricSmall,
                          color: HeliosColors.textOnCardMuted,
                          fontVariant: ['tabular-nums'],
                        }}
                      >
                        /100
                      </Text>
                    </View>
                    <Text
                      style={{
                        ...HeliosTypography.label,
                        color: HeliosColors.textOnCardMuted,
                        marginTop: 2,
                      }}
                    >
                      QUALITY
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Stage proportion bar */}
              <View
                style={{
                  height: 12,
                  borderRadius: 6,
                  borderCurve: 'continuous',
                  overflow: 'hidden',
                  flexDirection: 'row',
                  marginBottom: HeliosSpacing.sm,
                }}
              >
                <View
                  style={{
                    flex: sleepStages.deep,
                    backgroundColor: HeliosColors.sleepDeep,
                  }}
                />
                <View
                  style={{
                    flex: sleepStages.light,
                    backgroundColor: HeliosColors.sleepLight,
                  }}
                />
                <View
                  style={{
                    flex: sleepStages.rem,
                    backgroundColor: HeliosColors.sleepREM,
                  }}
                />
                <View
                  style={{
                    flex: sleepStages.wake,
                    backgroundColor: HeliosColors.wakeOrange,
                  }}
                />
              </View>

              {/* Stage legend */}
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: HeliosSpacing.md,
                  marginBottom: HeliosSpacing.sm,
                }}
              >
                {[
                  { label: 'Deep', color: HeliosColors.sleepDeep, pct: sleepStages.deep },
                  { label: 'Light', color: HeliosColors.sleepLight, pct: sleepStages.light },
                  { label: 'REM', color: HeliosColors.sleepREM, pct: sleepStages.rem },
                  { label: 'Wake', color: HeliosColors.wakeOrange, pct: sleepStages.wake },
                ].map((stage) => (
                  <View key={stage.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: stage.color,
                      }}
                    />
                    <Text
                      style={{
                        ...HeliosTypography.label,
                        color: HeliosColors.textOnCardMuted,
                        fontSize: 9,
                      }}
                    >
                      {stage.label.toUpperCase()} {Math.round(stage.pct * 100)}%
                    </Text>
                  </View>
                ))}
              </View>

              {/* Bed / wake time */}
              {sleepTimes ? (
                <View style={{ flexDirection: 'row', gap: HeliosSpacing.lg }}>
                  <Text
                    style={{
                      ...HeliosTypography.metricSmall,
                      color: HeliosColors.textOnCardMuted,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    BED {sleepTimes.bed}
                  </Text>
                  <Text
                    style={{
                      ...HeliosTypography.metricSmall,
                      color: HeliosColors.textOnCardMuted,
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    WAKE {sleepTimes.wakeUp}
                  </Text>
                </View>
              ) : null}
            </>
          )}
        </BrutalistCard>
      </Animated.View>

      {/* Divider */}
      <View style={{ marginVertical: HeliosSpacing.lg }}>
        <DottedDivider />
      </View>

      {/* ================================================================ */}
      {/* 4. HEART RATE CARD                                                */}
      {/* ================================================================ */}
      <Animated.View entering={FadeInDown.delay(350).duration(400)} style={{ paddingHorizontal: HeliosSpacing.screenPadding }}>
        <BrutalistCard accentDot>
          <Text
            style={{
              ...HeliosTypography.cardTitle,
              color: HeliosColors.textOnCard,
              marginBottom: HeliosSpacing.sm,
            }}
          >
            HEART RATE
          </Text>

          {!latestHeartRate ? (
            <Text
              style={{
                ...HeliosTypography.body,
                color: HeliosColors.textOnCardMuted,
              }}
            >
              No heart rate data.
            </Text>
          ) : (
            <>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  marginBottom: HeliosSpacing.xs,
                }}
              >
                <View>
                  <MetricBlock
                    value={`${latestHeartRate.heartRate}`}
                    label="LATEST BPM"
                    size="large"
                    onCard
                    color={HeliosColors.heartRed}
                  />
                  {restingHeartRate !== null ? (
                    <Text
                      style={{
                        ...HeliosTypography.metricSmall,
                        color: HeliosColors.textOnCardMuted,
                        marginTop: HeliosSpacing.xs,
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      Resting {restingHeartRate} BPM
                    </Text>
                  ) : null}
                </View>
                {hrSparklineData.length > 2 ? (
                  <MiniSparkline
                    data={hrSparklineData}
                    width={140}
                    height={50}
                    color={HeliosColors.heartRed}
                  />
                ) : null}
              </View>
            </>
          )}
        </BrutalistCard>
      </Animated.View>

      {/* Divider */}
      <View style={{ marginVertical: HeliosSpacing.lg }}>
        <DottedDivider />
      </View>

      {/* ================================================================ */}
      {/* 5. RECENT WORKOUT CARD                                            */}
      {/* ================================================================ */}
      <Animated.View entering={FadeInDown.delay(450).duration(400)} style={{ paddingHorizontal: HeliosSpacing.screenPadding }}>
        <BrutalistCard>
          <Text
            style={{
              ...HeliosTypography.cardTitle,
              color: HeliosColors.textOnCard,
              marginBottom: HeliosSpacing.sm,
            }}
          >
            LAST WORKOUT
          </Text>

          {!lastWorkout ? (
            <Text
              style={{
                ...HeliosTypography.body,
                color: HeliosColors.textOnCardMuted,
              }}
            >
              No workouts recorded.
            </Text>
          ) : (
            <>
              <Text
                style={{
                  ...HeliosTypography.label,
                  color: HeliosColors.textOnCardMuted,
                  marginBottom: HeliosSpacing.sm,
                }}
              >
                {sportTypeName(lastWorkout.type).toUpperCase()}
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: HeliosSpacing.sm,
                }}
              >
                <MetricBlock
                  value={formatDurationSeconds(lastWorkout.sportTime)}
                  label="DURATION"
                  size="medium"
                  onCard
                />
                <MetricBlock
                  value={formatNumber(lastWorkout.calories)}
                  label="KCAL"
                  size="medium"
                  onCard
                />
                {lastWorkout.distance > 0 ? (
                  <MetricBlock
                    value={formatDistance(lastWorkout.distance)}
                    label="DISTANCE"
                    size="medium"
                    onCard
                  />
                ) : null}
              </View>
            </>
          )}
        </BrutalistCard>
      </Animated.View>

      {/* Divider */}
      <View style={{ marginVertical: HeliosSpacing.lg }}>
        <DottedDivider />
      </View>

      {/* ================================================================ */}
      {/* 6. WEEKLY OVERVIEW STRIP                                          */}
      {/* ================================================================ */}
      <Animated.View entering={FadeInDown.delay(550).duration(400)} style={{ paddingHorizontal: HeliosSpacing.screenPadding }}>
        <SectionHeader title="THIS WEEK" />

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: HeliosSpacing.md,
          }}
        >
          {weeklyData.map((day) => {
            const barHeight = day.steps > 0 ? Math.max(6, Math.min((day.steps / 8000) * 48, 60)) : 4;
            return (
              <View
                key={day.date}
                style={{ alignItems: 'center', flex: 1, gap: HeliosSpacing.xs }}
              >
                {/* Day label */}
                <Text
                  style={{
                    ...HeliosTypography.label,
                    color: HeliosColors.textSecondary,
                    fontSize: 10,
                  }}
                >
                  {day.dayLabel}
                </Text>

                {/* Step bar */}
                <View
                  style={{
                    width: 20,
                    height: 60,
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 16,
                      height: barHeight,
                      borderRadius: 4,
                      borderCurve: 'continuous',
                      backgroundColor: day.goalMet
                        ? HeliosColors.accent
                        : HeliosColors.lineSubtle,
                    }}
                  />
                </View>

                {/* Step count */}
                <Text
                  style={{
                    fontFamily: HeliosFonts.monoRegular,
                    fontSize: 9,
                    letterSpacing: 0.5,
                    color: day.goalMet
                      ? HeliosColors.accent
                      : HeliosColors.textSecondary,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {day.steps > 0 ? (day.steps >= 1000 ? `${(day.steps / 1000).toFixed(1)}k` : `${day.steps}`) : '--'}
                </Text>
              </View>
            );
          })}
        </View>
      </Animated.View>

      {/* Divider */}
      <View style={{ marginVertical: HeliosSpacing.lg }}>
        <DottedDivider />
      </View>

      {/* ================================================================ */}
      {/* 7. DECORATIVE ELEMENTS                                            */}
      {/* ================================================================ */}
      <View
        style={{
          paddingHorizontal: HeliosSpacing.screenPadding,
          marginBottom: HeliosSpacing.lg,
        }}
      >
        <BrutalistCard style={{ alignItems: 'center', paddingVertical: HeliosSpacing.lg }}>
          <DecorativeBarcode
            width={200}
            height={40}
            label="HELIOS TRACKER // ATHLETE ID #001"
          />
        </BrutalistCard>
      </View>

      {/* Ticker bar */}
      <TickerBar items={tickerItems} />
    </ScrollView>
  );
}
