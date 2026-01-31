// ---------------------------------------------------------------------------
// Helios-Tracker  --  Recommended sleep duration computation
// ---------------------------------------------------------------------------

import type { ComputedSleepNeed } from './data-types';

// ---------------------------------------------------------------------------
// Sleep need
// ---------------------------------------------------------------------------

/**
 * Compute the recommended sleep duration based on today's strain load and
 * accumulated sleep debt.
 *
 * Base need is 480 minutes (8 hours).  Strain and debt adjustments are added
 * on top.
 */
export function computeSleepNeed(
  todayStrain: number,
  sleepDebtMin: number,
): ComputedSleepNeed {
  const baseMin = 480;

  // Strain adjustment
  let strainAdjustMin: number;
  if (todayStrain < 7) {
    strainAdjustMin = 0;
  } else if (todayStrain < 14) {
    strainAdjustMin = 15;
  } else if (todayStrain < 18) {
    strainAdjustMin = 30;
  } else {
    strainAdjustMin = 45;
  }

  // Debt catch-up: recover 25 % of debt per night, capped at 30 min
  const debtAdjustMin = Math.min(Math.max(sleepDebtMin * 0.25, 0), 30);

  const recommendedMin = baseMin + strainAdjustMin + debtAdjustMin;

  return { recommendedMin, baseMin, strainAdjustMin, debtAdjustMin };
}

// ---------------------------------------------------------------------------
// Sleep debt
// ---------------------------------------------------------------------------

/**
 * Compute total sleep debt from an array of recent actual-sleep durations
 * (up to 14 nights).
 *
 * For each night the deficit is `recommendedMin - actual`.  Positive values
 * represent debt; oversleeping does **not** generate credit.  The total debt
 * is the sum of all positive deficits.
 */
export function computeSleepDebt(
  recentSleepMinutes: number[],
  recommendedMin: number,
): number {
  let totalDebt = 0;
  for (const actual of recentSleepMinutes) {
    const deficit = recommendedMin - actual;
    if (deficit > 0) {
      totalDebt += deficit;
    }
  }
  return totalDebt;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/** Format a duration in minutes as "Xh Ym" (e.g. 510 -> "8h 30m"). */
export function formatSleepDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
}
