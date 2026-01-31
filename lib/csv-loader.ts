// ---------------------------------------------------------------------------
// Helios-Tracker  --  CSV loading and parsing module
// ---------------------------------------------------------------------------

import { Asset } from 'expo-asset';
import Papa from 'papaparse';
import type {
  UserData,
  ActivityDay,
  ActivityMinute,
  ActivityStage,
  SleepNight,
  SleepMinuteRecord,
  HeartRateRecord,
  SportSession,
  BodyData,
  FitnessData,
  DailyHRSummary,
  HRVDaily,
  HRVSample,
  SpO2Sample,
  SkinTempSample,
  HealthMonitorDaily,
  RecoveryDaily,
  StressScore,
  BreathworkSession,
  StrainDaily,
  WorkoutStrain,
  StrengthWorkout,
  StrengthSet,
  ExerciseCatalogItem,
  SleepNeedDaily,
  SleepSchedule,
  JournalEntry,
  Goal,
  VO2MaxRecord,
  BodyCompRecord,
} from '../lib/data-types';
import { computeAllScores } from './compute-scores';

// ---------------------------------------------------------------------------
// Asset references — these are resolved at build time by Metro
// ---------------------------------------------------------------------------
const activityAsset = require('../assets/data/activity.csv');
const activityMinuteAsset = require('../assets/data/activity-minute.csv');
const activityStageAsset = require('../assets/data/activity-stage.csv');
const bodyAsset = require('../assets/data/body.csv');
const heartrateAsset = require('../assets/data/heartrate.csv');
const sleepAsset = require('../assets/data/sleep.csv');
const sleepMinuteAsset = require('../assets/data/sleep-minute.csv');
const sportAsset = require('../assets/data/sport.csv');
const userAsset = require('../assets/data/user.csv');
const hrvDailyAsset = require('../assets/data/hrv-daily.csv');
const hrvSamplesAsset = require('../assets/data/hrv-samples.csv');
const spo2SamplesAsset = require('../assets/data/spo2-samples.csv');
const skinTempSamplesAsset = require('../assets/data/skin-temp-samples.csv');
const healthMonitorDailyAsset = require('../assets/data/health-monitor-daily.csv');
const recoveryDailyAsset = require('../assets/data/recovery-daily.csv');
const stressScoreAsset = require('../assets/data/stress-score.csv');
const breathworkSessionsAsset = require('../assets/data/breathwork-sessions.csv');
const strainDailyAsset = require('../assets/data/strain-daily.csv');
const workoutStrainAsset = require('../assets/data/workout-strain.csv');
const strengthWorkoutsAsset = require('../assets/data/strength-workouts.csv');
const strengthSetsAsset = require('../assets/data/strength-sets.csv');
const exerciseCatalogAsset = require('../assets/data/exercise-catalog.csv');
const sleepNeedDailyAsset = require('../assets/data/sleep-need-daily.csv');
const sleepScheduleAsset = require('../assets/data/sleep-schedule.csv');
const journalEntriesAsset = require('../assets/data/journal-entries.csv');
const goalsAsset = require('../assets/data/goals.csv');
const vo2MaxAsset = require('../assets/data/vo2max.csv');
const bodyCompAsset = require('../assets/data/body-comp.csv');

// ---------------------------------------------------------------------------
// Generic CSV loader
// ---------------------------------------------------------------------------

/**
 * Load a bundled CSV asset, fetch its content, strip BOM, and parse with
 * PapaParse.  Returns the parsed rows typed as `T[]`.
 */
async function loadCSV<T>(module: number): Promise<T[]> {
  const [asset] = await Asset.loadAsync(module);
  const uri = asset.localUri ?? asset.uri;
  const response = await fetch(uri);
  let text = await response.text();

  // Strip BOM character if present
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  const result = Papa.parse<T>(text, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  return result.data;
}

// ---------------------------------------------------------------------------
// Heart-rate indexing helpers
// ---------------------------------------------------------------------------

function buildDailyHRSummary(
  records: HeartRateRecord[],
): Map<string, DailyHRSummary> {
  const map = new Map<string, DailyHRSummary>();

  for (const rec of records) {
    const existing = map.get(rec.date);

    if (existing) {
      existing.min = Math.min(existing.min, rec.heartRate);
      existing.max = Math.max(existing.max, rec.heartRate);
      existing.avg =
        (existing.avg * existing.count + rec.heartRate) /
        (existing.count + 1);
      existing.count += 1;

      // Resting HR estimate: use the lowest reading between 02:00 and 05:00
      if (rec.time >= '02:00' && rec.time < '05:00') {
        existing.resting = Math.min(existing.resting, rec.heartRate);
      }
    } else {
      const isResting = rec.time >= '02:00' && rec.time < '05:00';
      map.set(rec.date, {
        date: rec.date,
        min: rec.heartRate,
        max: rec.heartRate,
        avg: rec.heartRate,
        resting: isResting ? rec.heartRate : Infinity,
        count: 1,
      });
    }
  }

  // For days without any night readings, fall back to the day's minimum
  for (const summary of map.values()) {
    if (summary.resting === Infinity) {
      summary.resting = summary.min;
    }
  }

  return map;
}

function buildHeartRateByDay(
  records: HeartRateRecord[],
): Map<string, HeartRateRecord[]> {
  const map = new Map<string, HeartRateRecord[]>();
  for (const rec of records) {
    const existing = map.get(rec.date);
    if (existing) {
      existing.push(rec);
    } else {
      map.set(rec.date, [rec]);
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Sleep-minute indexing
// ---------------------------------------------------------------------------

function buildSleepMinuteByDay(
  records: SleepMinuteRecord[],
): Map<string, SleepMinuteRecord[]> {
  const map = new Map<string, SleepMinuteRecord[]>();
  for (const rec of records) {
    const existing = map.get(rec.date);
    if (existing) {
      existing.push(rec);
    } else {
      map.set(rec.date, [rec]);
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Activity-minute indexing
// ---------------------------------------------------------------------------

function buildActivityMinuteByDay(
  records: ActivityMinute[],
): Map<string, ActivityMinute[]> {
  const map = new Map<string, ActivityMinute[]>();
  for (const rec of records) {
    const existing = map.get(rec.date);
    if (existing) {
      existing.push(rec);
    } else {
      map.set(rec.date, [rec]);
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Sleep nap JSON parsing
// ---------------------------------------------------------------------------

function parseSleepNaps(sleepData: SleepNight[]): SleepNight[] {
  return sleepData.map((row) => {
    let naps = row.naps;
    if (typeof naps === 'string') {
      try {
        naps = (naps as string).length > 0 ? JSON.parse(naps as string) : [];
      } catch {
        naps = [];
      }
    }
    if (!Array.isArray(naps)) {
      naps = [];
    }
    return { ...row, naps };
  });
}

// ---------------------------------------------------------------------------
// Sport field name normalisation
// ---------------------------------------------------------------------------

/**
 * Sport CSV headers contain parenthesised units (e.g. "sportTime(s)").
 * Map them to clean camelCase property names expected by the Sport type.
 */
function normaliseSportRows(
  raw: Record<string, unknown>[],
): SportSession[] {
  return raw.map((r) => ({
    type: r['type'] as number,
    startTime: r['startTime'] as string,
    sportTime: r['sportTime(s)'] as number,
    maxPace: r['maxPace(/meter)'] as number,
    minPace: r['minPace(/meter)'] as number,
    distance: r['distance(m)'] as number,
    avgPace: r['avgPace(/meter)'] as number,
    calories: r['calories(kcal)'] as number,
  }));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Load and parse all 9 CSV files from bundled assets.
 *
 * Large datasets (heart-rate, sleep-minute, activity-minute) are additionally
 * indexed into Maps for O(1) per-day access.
 */
export async function loadAllData(): Promise<FitnessData> {
  const [
    user,
    activity,
    activityMinute,
    activityStage,
    sleep,
    sleepMinute,
    heartRateAuto,
    sportRaw,
    body,
    hrvDaily,
    hrvSamples,
    spo2Samples,
    skinTempSamples,
    healthMonitorDaily,
    recoveryDaily,
    stressScores,
    breathworkSessions,
    strainDaily,
    workoutStrain,
    strengthWorkouts,
    strengthSets,
    exerciseCatalog,
    sleepNeedDaily,
    sleepSchedule,
    journalEntries,
    goals,
    vo2Max,
    bodyComp,
  ] = await Promise.all([
    loadCSV<UserData>(userAsset),
    loadCSV<ActivityDay>(activityAsset),
    loadCSV<ActivityMinute>(activityMinuteAsset),
    loadCSV<ActivityStage>(activityStageAsset),
    loadCSV<SleepNight>(sleepAsset),
    loadCSV<SleepMinuteRecord>(sleepMinuteAsset),
    loadCSV<HeartRateRecord>(heartrateAsset),
    loadCSV<Record<string, unknown>>(sportAsset),
    loadCSV<BodyData>(bodyAsset),
    loadCSV<HRVDaily>(hrvDailyAsset),
    loadCSV<HRVSample>(hrvSamplesAsset),
    loadCSV<SpO2Sample>(spo2SamplesAsset),
    loadCSV<SkinTempSample>(skinTempSamplesAsset),
    loadCSV<HealthMonitorDaily>(healthMonitorDailyAsset),
    loadCSV<RecoveryDaily>(recoveryDailyAsset),
    loadCSV<StressScore>(stressScoreAsset),
    loadCSV<BreathworkSession>(breathworkSessionsAsset),
    loadCSV<StrainDaily>(strainDailyAsset),
    loadCSV<WorkoutStrain>(workoutStrainAsset),
    loadCSV<StrengthWorkout>(strengthWorkoutsAsset),
    loadCSV<StrengthSet>(strengthSetsAsset),
    loadCSV<ExerciseCatalogItem>(exerciseCatalogAsset),
    loadCSV<SleepNeedDaily>(sleepNeedDailyAsset),
    loadCSV<SleepSchedule>(sleepScheduleAsset),
    loadCSV<JournalEntry>(journalEntriesAsset),
    loadCSV<Goal>(goalsAsset),
    loadCSV<VO2MaxRecord>(vo2MaxAsset),
    loadCSV<BodyCompRecord>(bodyCompAsset),
  ]);

  // Post-processing: parse sleep naps JSON strings
  const parsedSleep = parseSleepNaps(sleep);

  // Post-processing: normalise sport column names
  const sport = normaliseSportRows(sportRaw);

  // Build indexed Maps for large datasets
  const dailyHRSummary = buildDailyHRSummary(heartRateAuto);
  const heartRateByDay = buildHeartRateByDay(heartRateAuto);
  const sleepMinuteByDay = buildSleepMinuteByDay(sleepMinute);
  const activityMinuteByDay = buildActivityMinuteByDay(activityMinute);

  // ---- Compute WHOOP-style scoring ----
  const { computedStrain, computedRecovery, computedSleepScore, computedVO2Max } =
    computeAllScores({ heartRateByDay, dailyHRSummary, sleep: parsedSleep });

  return {
    user,
    activity,
    activityMinute,
    activityStage,
    sleep: parsedSleep,
    sleepMinute,
    heartRateAuto,
    dailyHRSummary,
    heartRateByDay,
    sleepMinuteByDay,
    activityMinuteByDay,
    sport,
    body,
    hrvDaily,
    hrvSamples,
    spo2Samples,
    skinTempSamples,
    healthMonitorDaily,
    recoveryDaily,
    stressScores,
    breathworkSessions,
    strainDaily,
    workoutStrain,
    strengthWorkouts,
    strengthSets,
    exerciseCatalog,
    sleepNeedDaily,
    sleepSchedule,
    journalEntries,
    goals,
    vo2Max,
    bodyComp,
    computedStrain,
    computedRecovery,
    computedSleepScore,
    computedVO2Max,
  };
}
