// ---------------------------------------------------------------------------
// Helios-Tracker  --  Date formatting helpers (uses date-fns v4)
// ---------------------------------------------------------------------------

import { format, parse, isToday as dfIsToday, subDays, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";

/**
 * Safely turn a date string into a Date object.
 * Handles "YYYY-MM-DD" and ISO datetime strings.
 */
function toDate(date: string | Date): Date {
  if (date instanceof Date) {
    return date;
  }
  if (typeof date !== "string") {
    return new Date(String(date));
  }
  if (date.length === 10) {
    // "YYYY-MM-DD" -- parse explicitly so timezone offset doesn't shift the day
    return parse(date, "yyyy-MM-dd", new Date());
  }
  return parseISO(date);
}

/**
 * Short date: "Jan 31"
 */
export function formatShortDate(date: string | Date): string {
  return format(toDate(date), "MMM d");
}

/**
 * Full date: "Friday, Jan 31, 2026"
 */
export function formatFullDate(date: string | Date): string {
  return format(toDate(date), "EEEE, MMM d, yyyy");
}

/**
 * Convert a time string ("HH:mm") to a 12-hour display: "2:30 PM"
 */
export function formatTime(time: string): string {
  const parsed = parse(time, "HH:mm", new Date());
  return format(parsed, "h:mm a");
}

/**
 * Duration from total minutes: "7h 24m"
 */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Duration from total seconds: "1h 15m"
 */
export function formatDurationSeconds(seconds: number): string {
  return formatDuration(seconds / 60);
}

/**
 * Returns an array of "YYYY-MM-DD" strings for the last 7 days
 * ending on `referenceDate` (inclusive). Defaults to today.
 */
export function getWeekDates(referenceDate?: string | Date): string[] {
  const end = referenceDate ? toDate(referenceDate) : new Date();
  const start = subDays(end, 6);
  return eachDayOfInterval({ start, end }).map((d) => format(d, "yyyy-MM-dd"));
}

/**
 * Returns an array of "YYYY-MM-DD" strings for every day in the month
 * that contains `referenceDate`. Defaults to the current month.
 */
export function getMonthDates(referenceDate?: string | Date): string[] {
  const ref = referenceDate ? toDate(referenceDate) : new Date();
  const start = startOfMonth(ref);
  const end = endOfMonth(ref);
  return eachDayOfInterval({ start, end }).map((d) => format(d, "yyyy-MM-dd"));
}

/**
 * Returns true when the given "YYYY-MM-DD" string is today.
 */
export function isToday(date: string | Date): boolean {
  return dfIsToday(toDate(date));
}

/**
 * Short day-of-week name: "Mon", "Tue", etc.
 */
export function getDayOfWeek(date: string | Date): string {
  return format(toDate(date), "EEE");
}

/**
 * Human-friendly relative label:
 * - "Today" if the date is today
 * - "Yesterday" if the date is yesterday
 * - Otherwise the short date ("Jan 29")
 */
export function getRelativeDay(date: string | Date): string {
  const d = toDate(date);
  if (dfIsToday(d)) return "Today";

  const yesterday = subDays(new Date(), 1);
  if (format(d, "yyyy-MM-dd") === format(yesterday, "yyyy-MM-dd")) {
    return "Yesterday";
  }

  return formatShortDate(date);
}
