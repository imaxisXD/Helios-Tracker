// ---------------------------------------------------------------------------
// Shared scoring pipeline -- used by both CSV loader and Health Connect loader
// ---------------------------------------------------------------------------

import type {
  HeartRateAuto,
  Sleep,
  DailyHRSummary,
  ComputedDailyStrain,
  ComputedRecoveryScore,
  ComputedEnhancedSleepScore,
  ComputedVO2Max,
} from './data-types';
import { computeDailyStrain } from './strain';
import { computeEnhancedSleepScore } from './sleep-score';
import {
  computeNightlyRestingHR,
  computeRHRBaseline,
  computeDailyRecovery,
} from './recovery';
import { estimateVO2Max } from './vo2max';

export interface ScoreInput {
  heartRateByDay: Map<string, HeartRateAuto[]>;
  dailyHRSummary: Map<string, DailyHRSummary>;
  sleep: Sleep[];
}

export interface ComputedScores {
  computedStrain: Map<string, ComputedDailyStrain>;
  computedRecovery: Map<string, ComputedRecoveryScore>;
  computedSleepScore: Map<string, ComputedEnhancedSleepScore>;
  computedVO2Max: ComputedVO2Max | null;
}

const MAX_HR = 190;

export function computeAllScores(input: ScoreInput): ComputedScores {
  const { heartRateByDay, dailyHRSummary, sleep } = input;

  // 1. Daily strain from HR zones
  const computedStrain = new Map<string, ComputedDailyStrain>();
  for (const [date, dayRecords] of heartRateByDay) {
    computedStrain.set(date, computeDailyStrain(dayRecords, MAX_HR));
  }

  // 2. Enhanced sleep scores
  const computedSleepScore = new Map<string, ComputedEnhancedSleepScore>();
  const sortedSleep = [...sleep].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  for (let i = 0; i < sortedSleep.length; i++) {
    const night = sortedSleep[i];
    const prevNights = sortedSleep.slice(Math.max(0, i - 14), i);
    computedSleepScore.set(
      night.date,
      computeEnhancedSleepScore(night, prevNights),
    );
  }

  // 3. Nightly resting HR + rolling baseline for recovery
  const allDates = [...heartRateByDay.keys()].sort();
  const nightlyRHRMap = new Map<string, number>();
  for (const date of allDates) {
    const dayRecords = heartRateByDay.get(date);
    if (dayRecords) {
      const rhr = computeNightlyRestingHR(dayRecords);
      if (rhr !== null) {
        nightlyRHRMap.set(date, rhr);
      }
    }
  }

  // 4. Daily recovery scores
  const computedRecovery = new Map<string, ComputedRecoveryScore>();
  const sleepByDate = new Map<string, Sleep>();
  for (const s of sleep) {
    sleepByDate.set(s.date, s);
  }

  for (let i = 0; i < allDates.length; i++) {
    const date = allDates[i];
    const rhr = nightlyRHRMap.get(date) ?? null;

    // Build 14-day rolling RHR baseline
    const baselineRHRs: number[] = [];
    for (let j = Math.max(0, i - 14); j < i; j++) {
      const prevRHR = nightlyRHRMap.get(allDates[j]);
      if (prevRHR !== undefined) {
        baselineRHRs.push(prevRHR);
      }
    }
    const rhrBaseline = computeRHRBaseline(baselineRHRs);

    const sleepNight = sleepByDate.get(date) ?? null;

    // Prior day strain
    const priorDate = i > 0 ? allDates[i - 1] : null;
    const priorStrain = priorDate
      ? computedStrain.get(priorDate) ?? null
      : null;

    computedRecovery.set(
      date,
      computeDailyRecovery(date, rhr, rhrBaseline, sleepNight, priorStrain),
    );
  }

  // 5. VO2 Max estimate
  let computedVO2Max: ComputedVO2Max | null = null;
  if (dailyHRSummary.size > 0) {
    let overallMaxHR = 0;
    const restingHRs: number[] = [];
    for (const summary of dailyHRSummary.values()) {
      overallMaxHR = Math.max(overallMaxHR, summary.max);
      if (summary.resting < Infinity) {
        restingHRs.push(summary.resting);
      }
    }
    if (restingHRs.length > 0 && overallMaxHR > 0) {
      const sortedRHRs = [...restingHRs].sort((a, b) => a - b);
      const medianRHR =
        sortedRHRs.length % 2 === 1
          ? sortedRHRs[Math.floor(sortedRHRs.length / 2)]
          : (sortedRHRs[sortedRHRs.length / 2 - 1] +
              sortedRHRs[sortedRHRs.length / 2]) /
            2;
      computedVO2Max = estimateVO2Max(overallMaxHR, medianRHR);
    }
  }

  return {
    computedStrain,
    computedRecovery,
    computedSleepScore,
    computedVO2Max,
  };
}
