// ---------------------------------------------------------------------------
// Helios-Tracker  --  Daily strain scoring (WHOOP-style)
// ---------------------------------------------------------------------------

import { computeHRZones } from './data-transforms';
import type { HeartRateRecord, ComputedDailyStrain } from './data-types';
import { HeliosColors } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Strain level helpers
// ---------------------------------------------------------------------------

/**
 * Map a 0-21 strain value to a descriptive level.
 */
export function getStrainLevel(
  strain: number,
): 'rest' | 'light' | 'moderate' | 'high' | 'all-out' {
  if (strain < 2) return 'rest';
  if (strain < 7) return 'light';
  if (strain < 14) return 'moderate';
  if (strain < 18) return 'high';
  return 'all-out';
}

/**
 * Return the theme colour associated with a strain level string.
 */
export function getStrainColor(level: string): string {
  switch (level) {
    case 'rest':
      return HeliosColors.textSecondary;
    case 'light':
      return HeliosColors.strainLight;
    case 'moderate':
      return HeliosColors.strainModerate;
    case 'high':
      return HeliosColors.strainHigh;
    case 'all-out':
      return HeliosColors.strainAllOut;
    default:
      return HeliosColors.textSecondary;
  }
}

// ---------------------------------------------------------------------------
// Main computation
// ---------------------------------------------------------------------------

/**
 * Compute a daily strain score from heart-rate records.
 *
 * 1. Categorise records into HR zones via `computeHRZones`.
 * 2. Calculate raw TRIMP (Training Impulse):
 *      fatBurn minutes * 1  +  cardio minutes * 2  +  peak minutes * 3
 *    (rest zone contributes 0).
 * 3. Map to a 0-21 scale using exponential saturation:
 *      strain = 21 * (1 - e^(-rawTRIMP / 100))
 * 4. Determine qualitative level from the strain value.
 */
export function computeDailyStrain(
  records: HeartRateRecord[],
  maxHR: number,
): ComputedDailyStrain {
  const zones = computeHRZones(records, maxHR);

  const rawTRIMP =
    zones.fatBurn.minutes * 1 +
    zones.cardio.minutes * 2 +
    zones.peak.minutes * 3;

  const strain =
    Math.round(21 * (1 - Math.exp(-rawTRIMP / 100)) * 10) / 10;

  const level = getStrainLevel(strain);

  return {
    date: records.length > 0 ? records[0].date : '',
    rawTRIMP,
    strain,
    zoneMinutes: {
      rest: zones.rest.minutes,
      fatBurn: zones.fatBurn.minutes,
      cardio: zones.cardio.minutes,
      peak: zones.peak.minutes,
    },
    level,
  };
}
