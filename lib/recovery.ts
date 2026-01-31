// ---------------------------------------------------------------------------
// Helios-Tracker  --  Daily recovery score computation
// ---------------------------------------------------------------------------

import type {
  HeartRateRecord,
  Sleep,
  ComputedDailyStrain,
  ComputedRecoveryScore,
} from './data-types';
import { HeliosColors } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return the median of a sorted numeric array. */
function median(sorted: number[]): number {
  const n = sorted.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  return n % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ---------------------------------------------------------------------------
// Nightly resting heart rate
// ---------------------------------------------------------------------------

/**
 * Compute the nightly resting HR from raw HR records.
 *
 * Filters records between 02:00 (inclusive) and 05:00 (exclusive), sorts by
 * heartRate ascending, and returns the median value.  Returns null when no
 * records fall within the window.
 */
export function computeNightlyRestingHR(
  hrRecords: HeartRateRecord[],
): number | null {
  const nightRecords = hrRecords.filter(
    (r) => r.time >= '02:00' && r.time < '05:00',
  );

  if (nightRecords.length === 0) return null;

  const sorted = nightRecords
    .map((r) => r.heartRate)
    .sort((a, b) => a - b);

  return median(sorted);
}

// ---------------------------------------------------------------------------
// RHR baseline (rolling 14-day median)
// ---------------------------------------------------------------------------

/**
 * Compute a resting-HR baseline from the previous 14 nights of nightly RHR
 * values.  Returns 65 bpm (reasonable default) when the array is empty.
 */
export function computeRHRBaseline(nightlyRHRs: number[]): number {
  if (nightlyRHRs.length === 0) return 65;
  const sorted = [...nightlyRHRs].sort((a, b) => a - b);
  return median(sorted);
}

// ---------------------------------------------------------------------------
// Daily recovery score
// ---------------------------------------------------------------------------

/**
 * Compute the daily recovery score from resting HR, sleep, and prior-day
 * strain.
 *
 * Weights:
 *   - RHR component   40 %
 *   - Sleep component  40 %
 *   - Strain component 20 %
 */
export function computeDailyRecovery(
  date: string,
  rhrBpm: number | null,
  rhrBaseline: number,
  sleepNight: Sleep | null,
  priorStrain: ComputedDailyStrain | null,
): ComputedRecoveryScore {
  // --- RHR component (40 %) ---
  let rhrScore: number;
  if (rhrBpm === null) {
    rhrScore = 50; // neutral default
  } else {
    const deviation = rhrBpm - rhrBaseline;
    rhrScore = Math.max(0, Math.min(100, 100 - deviation * 5));
  }

  // --- Sleep component (40 %) ---
  let sleepScore: number;
  if (sleepNight === null) {
    sleepScore = 50;
  } else {
    const actualMin =
      sleepNight.deepSleepTime +
      sleepNight.shallowSleepTime +
      sleepNight.REMTime;
    sleepScore = Math.min(100, (actualMin / 480) * 100);
  }

  // --- Strain component (20 %) ---
  let strainScore: number;
  if (priorStrain === null) {
    strainScore = 75; // rest day is good for recovery
  } else {
    strainScore = Math.max(0, 100 - (priorStrain.strain / 21) * 100);
  }

  // --- Final score ---
  const raw = rhrScore * 0.4 + sleepScore * 0.4 + strainScore * 0.2;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  const level: ComputedRecoveryScore['level'] =
    score >= 67 ? 'green' : score >= 34 ? 'yellow' : 'red';

  return {
    date,
    score,
    rhrBpm: rhrBpm ?? 0,
    rhrBaseline,
    sleepComponent: sleepScore,
    strainComponent: strainScore,
    level,
  };
}

// ---------------------------------------------------------------------------
// Color helper
// ---------------------------------------------------------------------------

/** Map a recovery level to a theme color. */
export function getRecoveryColor(level: string): string {
  switch (level) {
    case 'green':
      return HeliosColors.recoveryGreen;
    case 'yellow':
      return HeliosColors.recoveryYellow;
    case 'red':
      return HeliosColors.recoveryRed;
    default:
      return HeliosColors.textSecondary;
  }
}
