// ---------------------------------------------------------------------------
// Helios-Tracker  --  React Context for fitness data
// ---------------------------------------------------------------------------

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, AppState, type AppStateStatus } from 'react-native';
import { loadAllData } from '../lib/csv-loader';
import { loadFromHealthConnect } from '../lib/health-connect-loader';
import {
  checkHealthConnectStatus,
  requestHealthConnectPermissions,
  recheckPermissions,
  type HealthConnectStatus,
} from '../lib/health-connect-permissions';
import { loadLocalProfile, saveLocalProfile } from '../lib/user-profile-store';
import type {
  FitnessData,
  User,
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
  /** Current data source. */
  dataSource: 'health-connect' | 'csv';
  /** Health Connect availability status. */
  healthConnectStatus: HealthConnectStatus;
  /** Request Health Connect permissions and load data. */
  requestPermissions: () => Promise<boolean>;
  /** Reload data from Health Connect. */
  refreshData: () => Promise<void>;
  /** Update and persist the user profile locally. */
  updateProfile: (profile: User) => Promise<void>;
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
  const [dataSource, setDataSource] = useState<'health-connect' | 'csv'>('csv');
  const [hcStatus, setHcStatus] = useState<HealthConnectStatus>('not_supported');
  const loadingRef = useRef(false);

  useEffect(() => {
    async function load() {
      if (loadingRef.current) return;
      loadingRef.current = true;

      try {
      // On Android, try Health Connect first
      if (Platform.OS === 'android') {
        try {
          const status = await checkHealthConnectStatus();
          console.log('[DataContext] Health Connect status:', status);
          setHcStatus(status);

          if (status === 'ready') {
            console.log('[DataContext] Loading data from Health Connect (180 days)...');
            const hcData = await loadFromHealthConnect(180);

            // If HC has no user data, try loading from local profile store
            if (hcData.user.length === 0) {
              const localProfile = await loadLocalProfile();
              if (localProfile) {
                console.log('[DataContext] Using locally stored user profile');
                hcData.user = [localProfile];
              }
            }

            console.log('[DataContext] Health Connect data loaded:', {
              user: hcData.user.length,
              activity: hcData.activity.length,
              activityStage: hcData.activityStage.length,
              sleep: hcData.sleep.length,
              heartRate: hcData.heartRateAuto.length,
              sport: hcData.sport.length,
              body: hcData.body.length,
            });
            setData(hcData);
            setDataSource('health-connect');
            return;
          }

          if (status === 'permissions_needed') {
            console.log('[DataContext] Health Connect permissions needed -- showing permission screen');
            // Don't load anything yet -- permission screen will handle it
            return;
          }
        } catch (err) {
          console.log('[DataContext] Health Connect failed, falling back to CSV:', err);
          // Health Connect failed, fall through to CSV
        }
      }

      // Fallback: load from CSV
      console.log('[DataContext] Loading data from CSV files...');
      const csvData = await loadAllData();
      console.log('[DataContext] CSV data loaded');
      setData(csvData);
      setDataSource('csv');
      } finally {
        loadingRef.current = false;
      }
    }
    load();
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    // Try the native permission dialog first (requires delegate setup in MainActivity).
    // If the dialog fails, it falls back to opening Health Connect settings and
    // the AppState listener below will re-check when the user returns.
    const result = await requestHealthConnectPermissions();
    console.log('[DataContext] Permission request result:', result);
    if (result.allGranted) {
      setHcStatus('ready');
      try {
        console.log('[DataContext] Permissions granted, loading HC data...');
        const hcData = await loadFromHealthConnect(180);
        console.log('[DataContext] HC data loaded after permission grant');
        setData(hcData);
        setDataSource('health-connect');
        return true;
      } catch (err) {
        console.log('[DataContext] HC load failed after permission grant:', err);
        const csvData = await loadAllData();
        setData(csvData);
        setDataSource('csv');
      }
    }
    return false;
  }, []);

  // Re-check permissions when the app returns to foreground (user comes back
  // from Health Connect settings). If all permissions are now granted, load data.
  useEffect(() => {
    if (hcStatus !== 'permissions_needed' || Platform.OS !== 'android') return;

    const subscription = AppState.addEventListener(
      'change',
      async (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          const result = await recheckPermissions();
          if (result.allGranted) {
            setHcStatus('ready');
            try {
              const hcData = await loadFromHealthConnect(180);
              setData(hcData);
              setDataSource('health-connect');
            } catch {
              // Health Connect load failed, fall back to CSV
              const csvData = await loadAllData();
              setData(csvData);
              setDataSource('csv');
            }
          }
        }
      },
    );

    return () => subscription.remove();
  }, [hcStatus]);

  const refreshData = useCallback(async () => {
    if (Platform.OS === 'android' && dataSource === 'health-connect') {
      console.log('[DataContext] Refreshing Health Connect data...');
      const freshData = await loadFromHealthConnect(180);
      console.log('[DataContext] Refresh complete');
      setData(freshData);
    }
  }, [dataSource]);

  const updateProfile = useCallback(async (profile: User) => {
    await saveLocalProfile(profile);
    setData((prev) => {
      if (!prev) return prev;
      return { ...prev, user: [profile] };
    });
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

  // If permissions are needed on Android, render children with null data
  // (the root layout will show the permission screen)
  if (hcStatus === 'permissions_needed' && !data) {
    const permValue = {
      dataSource,
      healthConnectStatus: hcStatus,
      requestPermissions,
      refreshData,
      updateProfile,
    } as DataContextValue;

    return (
      <DataContext.Provider value={permValue}>{children}</DataContext.Provider>
    );
  }

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
    dataSource,
    healthConnectStatus: hcStatus,
    requestPermissions,
    refreshData,
    updateProfile,
  };

  return (
    <DataContext.Provider value={value}>{children}</DataContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Export the context itself (consumed via React.use in hooks)
// ---------------------------------------------------------------------------

export { DataContext };
