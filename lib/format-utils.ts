// ---------------------------------------------------------------------------
// Helios-Tracker  --  Number / unit formatting helpers
// ---------------------------------------------------------------------------

/**
 * Comma-separated integer: 8350 -> "8,350"
 */
export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

/**
 * Distance from meters:
 * - >= 1000 m -> "5.58 km" (two decimals)
 * - < 1000 m  -> "580 m"
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Calorie display with unit: 1210 -> "1,210 kcal"
 */
export function formatCalories(cal: number): string {
  return `${formatNumber(cal)} kcal`;
}

/**
 * Heart-rate display: 72 -> "72 BPM"
 */
export function formatBPM(bpm: number): string {
  return `${Math.round(bpm)} BPM`;
}

/**
 * Compact step count:
 * - > 9999  -> "8.4k"
 * - <= 9999 -> "8,350"
 */
export function formatSteps(steps: number): string {
  if (steps > 9999) {
    return `${(steps / 1000).toFixed(1)}k`;
  }
  return formatNumber(steps);
}

/**
 * Percentage display: 0.84 -> "84%"
 * Also handles values already in 0-100 range: 84 -> "84%"
 */
export function formatPercent(value: number): string {
  const pct = value <= 1 ? value * 100 : value;
  return `${Math.round(pct)}%`;
}

/**
 * Convert a numeric pace (seconds per meter) to a "/km" string.
 *
 * The raw pace value represents seconds-per-meter.
 * Multiply by 1000 to get seconds-per-km, then format as "M:SS /km".
 *
 * Example: 0.33 s/m -> 330 s/km -> "5:30 /km"
 */
export function formatPace(pacePerMeter: number): string {
  const totalSeconds = Math.round(pacePerMeter * 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")} /km`;
}
