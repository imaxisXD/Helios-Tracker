// ---------------------------------------------------------------------------
// Helios-Tracker  --  React Context for fitness data
// ---------------------------------------------------------------------------

import React, { useState, useEffect, useCallback } from 'react';
import { loadAllData } from '../lib/csv-loader';
import type {
  FitnessData,
  HeartRateRecord,
  SleepMinuteRecord,
  ActivityMinute,
  DailyHRSummary,
  ComputedDailyStrain,
  ComputedRecoveryScore,
  ComputedEnhancedSleepScore,
  ComputedVO2Max,
} from '../lib/data-types';

// ---------------------------------------------------------------------------
// Context value shape
// ---------------------------------------------------------------------------

interface DataContextValue extends FitnessData {
  /** Heart-rate records for a given "YYYY-MM-DD" date. */
  getHeartRateForDay: (date: string) => HeartRateRecord[];
  /** Sleep-minute records for a given "YYYY-MM-DD" date. */
  getSleepMinutesForNight: (date: string) => SleepMinuteRecord[];
  /** Activity-minute records for a given "YYYY-MM-DD" date. */
  getActivityMinutesForDay: (date: string) => ActivityMinute[];
  /** Pre-computed daily HR summary (min/max/avg/resting) for a date. */
  getDailyHRSummary: (date: string) => DailyHRSummary | undefined;
  /** Pre-computed daily strain for a date. */
  getStrainForDay: (date: string) => ComputedDailyStrain | undefined;
  /** Pre-computed daily recovery for a date. */
  getRecoveryForDay: (date: string) => ComputedRecoveryScore | undefined;
  /** Pre-computed enhanced sleep score for a date. */
  getSleepScoreForDay: (date: string) => ComputedEnhancedSleepScore | undefined;
  /** Pre-computed VO2 Max estimate. */
  getVO2Max: () => ComputedVO2Max | null;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const DataContext = React.createContext<DataContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<FitnessData | null>(null);

  useEffect(() => {
    loadAllData().then(setData);
  }, []);

  // ---- Helper accessors (stable references via useCallback) ----

  const getHeartRateForDay = useCallback(
    (date: string): HeartRateRecord[] => {
      return data?.heartRateByDay.get(date) ?? [];
    },
    [data],
  );

  const getSleepMinutesForNight = useCallback(
    (date: string): SleepMinuteRecord[] => {
      return data?.sleepMinuteByDay.get(date) ?? [];
    },
    [data],
  );

  const getActivityMinutesForDay = useCallback(
    (date: string): ActivityMinute[] => {
      return data?.activityMinuteByDay.get(date) ?? [];
    },
    [data],
  );

  const getDailyHRSummary = useCallback(
    (date: string): DailyHRSummary | undefined => {
      return data?.dailyHRSummary.get(date);
    },
    [data],
  );

  const getStrainForDay = useCallback(
    (date: string): ComputedDailyStrain | undefined => {
      return data?.computedStrain.get(date);
    },
    [data],
  );

  const getRecoveryForDay = useCallback(
    (date: string): ComputedRecoveryScore | undefined => {
      return data?.computedRecovery.get(date);
    },
    [data],
  );

  const getSleepScoreForDay = useCallback(
    (date: string): ComputedEnhancedSleepScore | undefined => {
      return data?.computedSleepScore.get(date);
    },
    [data],
  );

  const getVO2Max = useCallback((): ComputedVO2Max | null => {
    return data?.computedVO2Max ?? null;
  }, [data]);

  // Keep splash screen visible while data loads
  if (!data) {
    return null;
  }

  const value: DataContextValue = {
    ...data,
    getHeartRateForDay,
    getSleepMinutesForNight,
    getActivityMinutesForDay,
    getDailyHRSummary,
    getStrainForDay,
    getRecoveryForDay,
    getSleepScoreForDay,
    getVO2Max,
  };

  return (
    <DataContext.Provider value={value}>{children}</DataContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Export the context itself (consumed via React.use in hooks)
// ---------------------------------------------------------------------------

export { DataContext };
