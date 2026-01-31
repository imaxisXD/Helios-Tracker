// ---------------------------------------------------------------------------
// Helios-Tracker  --  Aggregation and transformation functions
// ---------------------------------------------------------------------------

import { parse, startOfWeek, startOfMonth, format } from 'date-fns';
import type { ActivityDay, HeartRateRecord } from '../lib/data-types';

// ---------------------------------------------------------------------------
// Date parsing helper
// ---------------------------------------------------------------------------

function toDate(dateStr: string): Date {
  return parse(dateStr, 'yyyy-MM-dd', new Date());
}

// ---------------------------------------------------------------------------
// Grouping
// ---------------------------------------------------------------------------

/**
 * Group activity records by ISO week.
 * Keys are formatted as "YYYY-'W'ww" (e.g. "2025-W38").
 */
export function groupByWeek(
  data: ActivityDay[],
): Map<string, ActivityDay[]> {
  const map = new Map<string, ActivityDay[]>();

  for (const day of data) {
    const weekStart = startOfWeek(toDate(day.date), { weekStartsOn: 1 });
    const key = format(weekStart, "yyyy-'W'II");
    const existing = map.get(key);
    if (existing) {
      existing.push(day);
    } else {
      map.set(key, [day]);
    }
  }

  return map;
}

/**
 * Group activity records by calendar month.
 * Keys are formatted as "YYYY-MM" (e.g. "2025-09").
 */
export function groupByMonth(
  data: ActivityDay[],
): Map<string, ActivityDay[]> {
  const map = new Map<string, ActivityDay[]>();

  for (const day of data) {
    const monthStart = startOfMonth(toDate(day.date));
    const key = format(monthStart, 'yyyy-MM');
    const existing = map.get(key);
    if (existing) {
      existing.push(day);
    } else {
      map.set(key, [day]);
    }
  }

  return map;
}

// ---------------------------------------------------------------------------
// Rolling average
// ---------------------------------------------------------------------------

/**
 * Compute a simple rolling (moving) average over `window` elements.
 *
 * For the first `window - 1` elements the average is computed over however
 * many elements are available (i.e. a "partial" window at the start).
 *
 * Returns an array of the same length as `data`.
 */
export function rollingAverage(data: number[], window: number): number[] {
  if (data.length === 0) return [];
  if (window <= 1) return [...data];

  const result: number[] = [];
  let runningSum = 0;

  for (let i = 0; i < data.length; i++) {
    runningSum += data[i];

    if (i >= window) {
      runningSum -= data[i - window];
    }

    const count = Math.min(i + 1, window);
    result.push(runningSum / count);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Heart-rate zones
// ---------------------------------------------------------------------------

interface HRZone {
  minutes: number;
  percent: number;
}

interface HRZones {
  rest: HRZone;
  fatBurn: HRZone;
  cardio: HRZone;
  peak: HRZone;
}

/**
 * Categorise heart-rate records into standard training zones based on a
 * given maximum heart rate.
 *
 * Zone thresholds (fraction of maxHR):
 *   rest     : < 50%
 *   fatBurn  : 50% – 69%
 *   cardio   : 70% – 84%
 *   peak     : >= 85%
 *
 * Each record is assumed to represent one minute of measurement.
 */
export function computeHRZones(
  records: HeartRateRecord[],
  maxHR: number,
): HRZones {
  let rest = 0;
  let fatBurn = 0;
  let cardio = 0;
  let peak = 0;

  for (const rec of records) {
    const pct = rec.heartRate / maxHR;

    if (pct >= 0.85) {
      peak++;
    } else if (pct >= 0.7) {
      cardio++;
    } else if (pct >= 0.5) {
      fatBurn++;
    } else {
      rest++;
    }
  }

  const total = records.length || 1; // avoid division by zero

  return {
    rest: { minutes: rest, percent: (rest / total) * 100 },
    fatBurn: { minutes: fatBurn, percent: (fatBurn / total) * 100 },
    cardio: { minutes: cardio, percent: (cardio / total) * 100 },
    peak: { minutes: peak, percent: (peak / total) * 100 },
  };
}

// ---------------------------------------------------------------------------
// Heart-rate downsampling
// ---------------------------------------------------------------------------

/**
 * Downsample an array of heart-rate records by taking every Nth record
 * so that the result has at most `maxPoints` entries.
 *
 * If the input is already smaller than `maxPoints`, returns a shallow copy.
 */
export function downsampleHR(
  records: HeartRateRecord[],
  maxPoints: number,
): HeartRateRecord[] {
  if (records.length <= maxPoints) return [...records];

  const step = Math.ceil(records.length / maxPoints);
  const result: HeartRateRecord[] = [];

  for (let i = 0; i < records.length; i += step) {
    result.push(records[i]);
  }

  return result;
}
