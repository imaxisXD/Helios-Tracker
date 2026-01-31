// ---------------------------------------------------------------------------
// Helios-Tracker  --  Sport type mapping (codes -> display names & icons)
// ---------------------------------------------------------------------------

/**
 * Map a numeric sport type code to a human-readable name.
 *
 * Known codes:
 *   8   -> Outdoor Run
 *   21  -> Indoor Cycling
 *   223 -> Gym / Free Training
 */
export function sportTypeName(type: number): string {
  switch (type) {
    case 8:
      return "Outdoor Run";
    case 21:
      return "Indoor Cycling";
    case 223:
      return "Gym / Free Training";
    default:
      return "Unknown";
  }
}

/**
 * Map a numeric sport type code to an Ionicons icon name.
 *
 * Known codes:
 *   8   -> walk-sharp       (running/walking)
 *   21  -> bicycle-sharp    (cycling)
 *   223 -> barbell-sharp    (weight training)
 */
export function sportTypeIcon(type: number): string {
  switch (type) {
    case 8:
      return "walk-sharp";
    case 21:
      return "bicycle-sharp";
    case 223:
      return "barbell-sharp";
    default:
      return "help-circle-sharp";
  }
}
