// ---------------------------------------------------------------------------
// Helios-Tracker  --  VO2 Max estimation from heart-rate data
// ---------------------------------------------------------------------------

import type { ComputedVO2Max } from './data-types';
import { HeliosColors } from '@/constants/theme';

// ---------------------------------------------------------------------------
// VO2 Max estimation (Uth formula)
// ---------------------------------------------------------------------------

/**
 * Estimate VO2 Max using the Uth-Sorensen-Overgaard-Pedersen formula:
 *
 *   VO2max = 15.3 * (maxHR / restingHR)
 *
 * Classification thresholds are based on standard fitness tables for males
 * aged 20-29.
 */
export function estimateVO2Max(
  maxHR: number,
  restingHR: number,
): ComputedVO2Max {
  const raw = 15.3 * (maxHR / restingHR);
  const vo2max = Math.round(raw * 10) / 10; // 1 decimal place

  let classification: string;
  let percentile: number;

  if (vo2max < 36) {
    classification = 'Poor';
    percentile = 15;
  } else if (vo2max < 42) {
    classification = 'Fair';
    percentile = 30;
  } else if (vo2max < 46) {
    classification = 'Average';
    percentile = 50;
  } else if (vo2max < 50) {
    classification = 'Good';
    percentile = 70;
  } else if (vo2max < 56) {
    classification = 'Excellent';
    percentile = 85;
  } else {
    classification = 'Superior';
    percentile = 95;
  }

  return { vo2max, classification, percentile };
}

// ---------------------------------------------------------------------------
// Color helper
// ---------------------------------------------------------------------------

/** Map a VO2 Max classification to a theme color. */
export function getVO2MaxColor(classification: string): string {
  switch (classification) {
    case 'Poor':
      return HeliosColors.recoveryRed;
    case 'Fair':
      return HeliosColors.wakeOrange;
    case 'Average':
      return HeliosColors.recoveryYellow;
    case 'Good':
      return HeliosColors.accent;
    case 'Excellent':
      return HeliosColors.recoveryGreen;
    case 'Superior':
      return HeliosColors.recoveryGreen;
    default:
      return HeliosColors.textSecondary;
  }
}
