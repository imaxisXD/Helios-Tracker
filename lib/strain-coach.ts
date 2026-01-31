// ---------------------------------------------------------------------------
// Helios-Tracker  --  Daily strain coaching based on recovery
// ---------------------------------------------------------------------------

import type {
  ComputedRecoveryScore,
  ComputedStrainCoach,
} from './data-types';
import { HeliosColors } from '@/constants/theme';

// ---------------------------------------------------------------------------
// Strain target
// ---------------------------------------------------------------------------

/**
 * Compute a recommended strain target range for the day based on the current
 * recovery score.
 *
 * Returns sensible moderate defaults when no recovery data is available.
 */
export function computeStrainTarget(
  recovery: ComputedRecoveryScore | null,
): ComputedStrainCoach {
  if (recovery === null) {
    return {
      targetMin: 7,
      targetMax: 14,
      label: 'MODERATE',
      description: 'No recovery data — aim for a balanced effort.',
    };
  }

  switch (recovery.level) {
    case 'green':
      return {
        targetMin: 14,
        targetMax: 21,
        label: 'PUSH HARD',
        description:
          'High recovery — your body is ready for intense training.',
      };
    case 'yellow':
      return {
        targetMin: 7,
        targetMax: 14,
        label: 'MODERATE',
        description:
          'Moderate recovery — maintain steady effort, avoid overreaching.',
      };
    case 'red':
      return {
        targetMin: 0,
        targetMax: 7,
        label: 'ACTIVE RECOVERY',
        description:
          'Low recovery — focus on light movement and rest.',
      };
  }
}

// ---------------------------------------------------------------------------
// Color helper
// ---------------------------------------------------------------------------

/** Map a coach label to a theme color. */
export function getCoachColor(label: string): string {
  switch (label) {
    case 'PUSH HARD':
      return HeliosColors.recoveryGreen;
    case 'MODERATE':
      return HeliosColors.recoveryYellow;
    case 'ACTIVE RECOVERY':
      return HeliosColors.recoveryRed;
    default:
      return HeliosColors.textSecondary;
  }
}
