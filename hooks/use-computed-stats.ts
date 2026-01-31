// ---------------------------------------------------------------------------
// Helios-Tracker  --  Hook that computes derived statistics from fitness data
// ---------------------------------------------------------------------------

import { useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { useFitnessData } from './use-fitness-data';
import type {
  ActivityDay,
  SleepNight,
  HeartRateRecord,
  ComputedDailyStrain,
  ComputedRecoveryScore,
  ComputedEnhancedSleepScore,
  ComputedVO2Max,
  ComputedSleepNeed,
  ComputedStrainCoach,
} from '../lib/data-types';
import { computeSleepNeed, computeSleepDebt } from '../lib/sleep-need';
import { computeStrainTarget } from '../lib/strain-coach';

interface ComputedStats {
  /** Today's activity record, or null if no data for today. */
  todayActivity: ActivityDay | null;
  /** Most recent SleepNight that has actual sleep data (total > 0). */
  lastNightSleep: SleepNight | null;
  /** The most recent heart-rate reading across all days. */
  latestHeartRate: HeartRateRecord | null;
  /** Resting heart rate estimated from 2am-5am minimum. */
  restingHeartRate: number | null;
  /** Progress toward 8,000-step goal as a percentage (0-100+). */
  stepGoalPercent: number;
  /** Weighted sleep quality score (0-100). */
  sleepQualityScore: number | null;
  /** Average steps over the last 7 days. */
  weeklyAvgSteps: number;
  /** Lifetime total steps. */
  totalSteps: number;
  /** Lifetime total distance in meters. */
  totalDistance: number;
  /** Lifetime total calories. */
  totalCalories: number;
  /** Lifetime total sleep hours. */
  totalSleepHours: number;
  /** Total number of workout sessions. */
  totalWorkouts: number;
  /** Total workout duration in minutes. */
  totalWorkoutMinutes: number;
  /** Average calories per day (only over days with data). */
  avgCaloriesPerDay: number;
  /** Latest day's computed strain score. */
  todayStrain: ComputedDailyStrain | null;
  /** Latest day's computed recovery score. */
  todayRecovery: ComputedRecoveryScore | null;
  /** Latest day's enhanced sleep score. */
  todaySleepScore: ComputedEnhancedSleepScore | null;
  /** VO2 Max estimate. */
  vo2MaxEstimate: ComputedVO2Max | null;
  /** Sleep need recommendation. */
  sleepNeed: ComputedSleepNeed | null;
  /** Strain coach recommendation. */
  strainCoach: ComputedStrainCoach;
  /** 7-day average recovery score. */
  avgRecovery7d: number | null;
  /** 7-day average strain score. */
  avgStrain7d: number | null;
  /** 7-day average sleep score. */
  avgSleepScore7d: number | null;
}

export function useComputedStats(): ComputedStats {
  const {
    activity,
    sleep,
    heartRateAuto,
    sport,
    getDailyHRSummary,
    getStrainForDay,
    getRecoveryForDay,
    getSleepScoreForDay,
    getVO2Max,
    computedStrain,
    computedRecovery,
    computedSleepScore,
  } = useFitnessData();

  return useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    // -- todayActivity --
    const todayActivity =
      activity.find((a) => a.date === todayStr) ?? null;

    // -- lastNightSleep: most recent night with actual data --
    const lastNightSleep =
      [...sleep]
        .reverse()
        .find(
          (s) =>
            s.deepSleepTime + s.shallowSleepTime + s.REMTime > 0,
        ) ?? null;

    // -- latestHeartRate: last element of the sorted HR array --
    const latestHeartRate =
      heartRateAuto.length > 0
        ? heartRateAuto[heartRateAuto.length - 1]
        : null;

    // -- restingHeartRate: from DailyHRSummary of the latest day with data --
    let restingHeartRate: number | null = null;
    if (latestHeartRate) {
      const summary = getDailyHRSummary(latestHeartRate.date);
      restingHeartRate = summary?.resting ?? null;
    }

    // -- stepGoalPercent --
    const stepGoalPercent = todayActivity
      ? (todayActivity.steps / 8000) * 100
      : 0;

    // -- sleepQualityScore --
    let sleepQualityScore: number | null = null;
    if (lastNightSleep) {
      const total =
        lastNightSleep.deepSleepTime +
        lastNightSleep.shallowSleepTime +
        lastNightSleep.REMTime +
        lastNightSleep.wakeTime;

      if (total > 0) {
        const deepPct = lastNightSleep.deepSleepTime / total;
        const remPct = lastNightSleep.REMTime / total;
        const shallowPct = lastNightSleep.shallowSleepTime / total;
        const wakePct = lastNightSleep.wakeTime / total;

        // Weighted score:
        //   Deep sleep (ideal ~20%) -> 40% weight
        //   REM sleep  (ideal ~25%) -> 30% weight
        //   Shallow    (ideal ~50%) -> 20% weight
        //   Wake time  (penalty)    -> 10% weight (inverted)
        const deepScore = Math.min(deepPct / 0.2, 1.0);
        const remScore = Math.min(remPct / 0.25, 1.0);
        const shallowScore = Math.min(shallowPct / 0.5, 1.0);
        const wakeScore = Math.max(1.0 - wakePct / 0.1, 0);

        sleepQualityScore = Math.round(
          (deepScore * 0.4 +
            remScore * 0.3 +
            shallowScore * 0.2 +
            wakeScore * 0.1) *
            100,
        );
      }
    }

    // -- weeklyAvgSteps: average over last 7 days --
    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      weekDates.push(format(subDays(new Date(), i), 'yyyy-MM-dd'));
    }
    const weekSteps = activity
      .filter((a) => weekDates.includes(a.date))
      .map((a) => a.steps);
    const weeklyAvgSteps =
      weekSteps.length > 0
        ? Math.round(
            weekSteps.reduce((sum, s) => sum + s, 0) / weekSteps.length,
          )
        : 0;

    // -- Lifetime totals --
    const totalSteps = activity.reduce((sum, a) => sum + a.steps, 0);
    const totalDistance = activity.reduce(
      (sum, a) => sum + a.distance,
      0,
    );
    const totalCalories = activity.reduce(
      (sum, a) => sum + a.calories,
      0,
    );

    // -- totalSleepHours --
    const totalSleepMinutes = sleep.reduce(
      (sum, s) =>
        sum + s.deepSleepTime + s.shallowSleepTime + s.REMTime,
      0,
    );
    const totalSleepHours = totalSleepMinutes / 60;

    // -- Sport / workout totals --
    const totalWorkouts = sport.length;
    const totalWorkoutMinutes = sport.reduce(
      (sum, s) => sum + s.sportTime / 60,
      0,
    );

    // -- avgCaloriesPerDay --
    const daysWithData = activity.filter((a) => a.calories > 0).length;
    const avgCaloriesPerDay =
      daysWithData > 0 ? Math.round(totalCalories / daysWithData) : 0;

    // -- WHOOP-like scoring: find latest day with data --
    const latestDate = latestHeartRate?.date ?? todayStr;

    const todayStrain = getStrainForDay(latestDate) ?? null;
    const todayRecovery = getRecoveryForDay(latestDate) ?? null;
    const todaySleepScore = getSleepScoreForDay(
      lastNightSleep?.date ?? latestDate,
    ) ?? null;
    const vo2MaxEstimate = getVO2Max();

    // -- Sleep need --
    let sleepNeed: ComputedSleepNeed | null = null;
    if (todayStrain) {
      const recentSleepMin = sleep
        .slice(-14)
        .map(
          (s) => s.deepSleepTime + s.shallowSleepTime + s.REMTime,
        );
      const debt = computeSleepDebt(recentSleepMin, 480);
      sleepNeed = computeSleepNeed(todayStrain.strain, debt);
    }

    // -- Strain coach --
    const strainCoach = computeStrainTarget(todayRecovery);

    // -- 7-day rolling averages --
    let avgRecovery7d: number | null = null;
    let avgStrain7d: number | null = null;
    let avgSleepScore7d: number | null = null;

    const recoveryValues: number[] = [];
    const strainValues: number[] = [];
    const sleepScoreValues: number[] = [];

    for (let i = 0; i < 7; i++) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      const r = computedRecovery.get(d);
      if (r) recoveryValues.push(r.score);
      const s = computedStrain.get(d);
      if (s) strainValues.push(s.strain);
      const ss = computedSleepScore.get(d);
      if (ss) sleepScoreValues.push(ss.score);
    }

    if (recoveryValues.length > 0) {
      avgRecovery7d = Math.round(
        recoveryValues.reduce((a, b) => a + b, 0) / recoveryValues.length,
      );
    }
    if (strainValues.length > 0) {
      avgStrain7d =
        Math.round(
          (strainValues.reduce((a, b) => a + b, 0) / strainValues.length) *
            10,
        ) / 10;
    }
    if (sleepScoreValues.length > 0) {
      avgSleepScore7d = Math.round(
        sleepScoreValues.reduce((a, b) => a + b, 0) /
          sleepScoreValues.length,
      );
    }

    return {
      todayActivity,
      lastNightSleep,
      latestHeartRate,
      restingHeartRate,
      stepGoalPercent,
      sleepQualityScore,
      weeklyAvgSteps,
      totalSteps,
      totalDistance,
      totalCalories,
      totalSleepHours,
      totalWorkouts,
      totalWorkoutMinutes,
      avgCaloriesPerDay,
      todayStrain,
      todayRecovery,
      todaySleepScore,
      vo2MaxEstimate,
      sleepNeed,
      strainCoach,
      avgRecovery7d,
      avgStrain7d,
      avgSleepScore7d,
    };
  }, [
    activity,
    sleep,
    heartRateAuto,
    sport,
    getDailyHRSummary,
    getStrainForDay,
    getRecoveryForDay,
    getSleepScoreForDay,
    getVO2Max,
    computedStrain,
    computedRecovery,
    computedSleepScore,
  ]);
}
