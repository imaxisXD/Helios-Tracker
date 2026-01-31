// ---------------------------------------------------------------------------
// Helios-Tracker  --  Enhanced sleep scoring with 4 sub-components
// ---------------------------------------------------------------------------

import type { Sleep, ComputedEnhancedSleepScore } from './data-types';
import { HeliosColors } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return the theme colour for a sleep score level.
 */
export function getSleepScoreColor(level: string): string {
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

/**
 * Extract the bedtime "hour" from an ISO datetime string, normalised so
 * that after-midnight times sort correctly relative to evening times.
 *
 * e.g.  "2025-01-15T23:30:00" -> 23.5
 *       "2025-01-16T00:15:00" -> 24.25  (treated as 0.25 + 24)
 *
 * Convention: hours 0-12 are treated as "after midnight" and shifted by +24
 * so they sort after late-evening hours.
 */
function bedtimeHour(isoString: string): number {
  const d = new Date(isoString);
  const h = d.getHours() + d.getMinutes() / 60;
  // If hour <= 12, assume it's an after-midnight bedtime
  return h <= 12 ? h + 24 : h;
}

/**
 * Compute the median of a numeric array. Returns 0 for empty input.
 */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ---------------------------------------------------------------------------
// Sub-score computations
// ---------------------------------------------------------------------------

/**
 * Sufficiency: how close total sleep is to the 8-hour target.
 * Weight: 0.30
 */
function scoreSufficiency(night: Sleep): number {
  const actualMin =
    night.deepSleepTime + night.shallowSleepTime + night.REMTime;
  return Math.min((actualMin / 480) * 100, 100);
}

/**
 * Efficiency: ratio of actual sleep time to total time in bed.
 * Weight: 0.25
 */
function scoreEfficiency(night: Sleep): number {
  const totalInBed =
    night.deepSleepTime +
    night.shallowSleepTime +
    night.REMTime +
    night.wakeTime;
  if (totalInBed <= 0) return 0;
  return ((totalInBed - night.wakeTime) / totalInBed) * 100;
}

/**
 * Stage quality: how closely sleep stage proportions match ideal targets.
 * Ideal: deep 20%, REM 25%, light 55%.
 * Weight: 0.25
 */
function scoreStageQuality(night: Sleep): number {
  const actualMin =
    night.deepSleepTime + night.shallowSleepTime + night.REMTime;
  if (actualMin <= 0) return 0;

  const deepPct = night.deepSleepTime / actualMin;
  const remPct = night.REMTime / actualMin;
  const lightPct = night.shallowSleepTime / actualMin;

  const deepDeviation = Math.abs(deepPct - 0.2) / 0.2;
  const remDeviation = Math.abs(remPct - 0.25) / 0.25;
  const lightDeviation = Math.abs(lightPct - 0.55) / 0.55;

  return Math.max(
    0,
    100 - (deepDeviation + remDeviation + lightDeviation) * 33.33,
  );
}

/**
 * Consistency: how closely tonight's bedtime matches recent median.
 * Each hour of deviation costs 25 points.
 * Weight: 0.20
 *
 * Falls back to a neutral 75 when fewer than 3 previous nights are available.
 */
function scoreConsistency(night: Sleep, prevNights: Sleep[]): number {
  if (prevNights.length < 3) return 75;

  const prevBedHours = prevNights.map((n) => bedtimeHour(n.start));
  const medianBedHour = median(prevBedHours);

  const currentBedHour = bedtimeHour(night.start);
  const bedtimeDeviation = Math.abs(currentBedHour - medianBedHour);

  return Math.max(0, 100 - bedtimeDeviation * 25);
}

// ---------------------------------------------------------------------------
// Main computation
// ---------------------------------------------------------------------------

/**
 * Compute an enhanced sleep score with four weighted sub-components.
 *
 * | Component      | Weight |
 * |----------------|--------|
 * | Sufficiency    | 0.30   |
 * | Efficiency     | 0.25   |
 * | Stage Quality  | 0.25   |
 * | Consistency    | 0.20   |
 *
 * @param night      The current night's sleep record.
 * @param prevNights Previous nights used for the consistency sub-score
 *                   (ideally the last 7-14 nights, ordered oldest-first).
 */
export function computeEnhancedSleepScore(
  night: Sleep,
  prevNights: Sleep[],
): ComputedEnhancedSleepScore {
  const sufficiency = scoreSufficiency(night);
  const efficiency = scoreEfficiency(night);
  const stageQuality = scoreStageQuality(night);
  const consistency = scoreConsistency(night, prevNights);

  const score = Math.round(
    sufficiency * 0.3 +
      efficiency * 0.25 +
      stageQuality * 0.25 +
      consistency * 0.2,
  );

  let level: 'green' | 'yellow' | 'red';
  if (score >= 70) {
    level = 'green';
  } else if (score >= 40) {
    level = 'yellow';
  } else {
    level = 'red';
  }

  return {
    date: night.date,
    score,
    sufficiency,
    efficiency,
    stageQuality,
    consistency,
    level,
  };
}
