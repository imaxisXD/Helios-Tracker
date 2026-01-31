// ---------------------------------------------------------------------------
// Helios-Tracker  --  Hook for date range filtering
// ---------------------------------------------------------------------------

import { useState, useMemo, useCallback } from 'react';
import { format, subDays } from 'date-fns';

export type DateRange = '7d' | '30d' | 'all';

interface DateRangeResult {
  /** The current range selection. */
  range: DateRange;
  /** Update the range selection. */
  setRange: (range: DateRange) => void;
  /** The set of "YYYY-MM-DD" date strings included in the current range. */
  filteredDates: string[];
  /** Filter an array of objects with a `date` property by the current range. */
  filterByRange: <T extends { date: string }>(data: T[]) => T[];
}

export function useDateRange(initialRange: DateRange = '7d'): DateRangeResult {
  const [range, setRange] = useState<DateRange>(initialRange);

  const filteredDates = useMemo(() => {
    if (range === 'all') return [];

    const days = range === '7d' ? 7 : 30;
    const dates: string[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      dates.push(format(subDays(today, i), 'yyyy-MM-dd'));
    }

    return dates;
  }, [range]);

  const filterByRange = useCallback(
    <T extends { date: string }>(data: T[]): T[] => {
      if (range === 'all') return data;

      const dateSet = new Set(filteredDates);
      return data.filter((item) => dateSet.has(item.date));
    },
    [range, filteredDates],
  );

  return { range, setRange, filteredDates, filterByRange };
}
