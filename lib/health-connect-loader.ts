// ---------------------------------------------------------------------------
// Health Connect data loader -- queries Android Health Connect and transforms
// responses into the same FitnessData shape used by the CSV loader.
// ---------------------------------------------------------------------------

import type {
  Activity,
  ActivityMinute,
  ActivityStage,
  Sleep,
  SleepMinute,
  HeartRateAuto,
  Sport,
  Body,
  User,
  FitnessData,
  DailyHRSummary,
} from './data-types';
import { computeAllScores } from './compute-scores';

// Tag for all logs from this module
const TAG = '[HealthConnect]';

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function toDateStr(isoOrMs: string): string {
  const d = new Date(isoOrMs);
  return d.toISOString().slice(0, 10);
}

function toTimeStr(isoOrMs: string): string {
  const d = new Date(isoOrMs);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ---------------------------------------------------------------------------
// Map indexing helpers (same logic as csv-loader)
// ---------------------------------------------------------------------------

function buildDailyHRSummary(
  records: HeartRateAuto[],
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

  for (const summary of map.values()) {
    if (summary.resting === Infinity) {
      summary.resting = summary.min;
    }
  }

  return map;
}

function indexByDay<T extends { date: string }>(
  records: T[],
): Map<string, T[]> {
  const map = new Map<string, T[]>();
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
// Exercise type mapping: Health Connect -> Xiaomi sport codes
// ---------------------------------------------------------------------------

function mapExerciseType(hcType: number): number {
  const MAPPING: Record<number, number> = {
    8: 8,     // RUNNING -> Outdoor Run
    9: 8,     // RUNNING_TREADMILL -> treat as run
    14: 21,   // BIKING -> Indoor Cycling
    15: 21,   // BIKING_STATIONARY
    29: 223,  // HIKING -> Gym/Other
    44: 223,  // STRENGTH_TRAINING
    75: 223,  // EXERCISE_CLASS
    79: 223,  // WORKOUT (generic)
    2: 8,     // WALKING -> treat as walk (maps to outdoor run)
  };
  return MAPPING[hcType] ?? 223; // Default to Free Training
}

// ---------------------------------------------------------------------------
// Sleep stage mapping
// ---------------------------------------------------------------------------

type SleepStageType = 'LIGHT' | 'DEEP' | 'REM';

function mapSleepStage(hcStage: number): SleepStageType | null {
  // Health Connect sleep stage constants
  switch (hcStage) {
    case 1: return null;    // AWAKE
    case 2: return 'LIGHT'; // SLEEPING (generic -> light)
    case 3: return null;    // AWAKE_IN_BED
    case 4: return 'LIGHT'; // LIGHT
    case 5: return 'DEEP';  // DEEP
    case 6: return 'REM';   // REM
    default: return 'LIGHT';
  }
}

function isAwakeStage(hcStage: number): boolean {
  return hcStage === 1 || hcStage === 3;
}

// ---------------------------------------------------------------------------
// Paginated reader -- HC caps at 1000 records per call by default
// ---------------------------------------------------------------------------

type ReadRecordsFn = (
  recordType: string,
  options: Record<string, unknown>,
) => Promise<{ records: unknown[]; pageToken?: string }>;

/**
 * Fetch ALL records for a given type by following pageToken pagination.
 * Health Connect returns max 1000 records per request; this loops until
 * pageToken is exhausted.
 */
async function readAllRecords(
  readRecords: ReadRecordsFn,
  recordType: string,
  options: Record<string, unknown>,
): Promise<unknown[]> {
  const allRecords: unknown[] = [];
  let pageToken: string | undefined;
  let page = 0;

  do {
    const result = await readRecords(recordType, {
      ...options,
      ...(pageToken ? { pageToken } : {}),
    });
    allRecords.push(...result.records);
    pageToken = result.pageToken;
    page++;
  } while (pageToken);

  if (page > 1) {
    console.log(TAG, `Paginated ${recordType}: ${page} pages, ${allRecords.length} total records`);
  }

  return allRecords;
}

/**
 * Fetch records by splitting the time range into parallel chunks.
 * Each chunk is paginated independently. This dramatically reduces
 * sequential API calls for large datasets like HeartRate.
 */
async function readAllRecordsChunked(
  readRecords: ReadRecordsFn,
  recordType: string,
  startTime: string,
  endTime: string,
  chunkDays: number = 7,
): Promise<unknown[]> {
  const startMs = new Date(startTime).getTime();
  const endMs = new Date(endTime).getTime();
  const chunkMs = chunkDays * 24 * 60 * 60 * 1000;

  const chunks: { startTime: string; endTime: string }[] = [];
  let cursor = startMs;
  while (cursor < endMs) {
    const chunkEnd = Math.min(cursor + chunkMs, endMs);
    chunks.push({
      startTime: new Date(cursor).toISOString(),
      endTime: new Date(chunkEnd).toISOString(),
    });
    cursor = chunkEnd;
  }

  console.log(TAG, `Chunked ${recordType}: ${chunks.length} parallel chunks of ${chunkDays}d`);

  const results = await Promise.all(
    chunks.map((chunk) =>
      readAllRecords(readRecords, recordType, {
        timeRangeFilter: {
          operator: 'between' as const,
          startTime: chunk.startTime,
          endTime: chunk.endTime,
        },
      }).catch(() => []),
    ),
  );

  const all = results.flat();
  console.log(TAG, `Chunked ${recordType}: ${all.length} total records`);
  return all;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Load fitness data from Health Connect for the given number of past days.
 */
export async function loadFromHealthConnect(
  daysBack: number = 180,
): Promise<FitnessData> {
  const { readRecords: _readRecords } = await import('react-native-health-connect');
  // Cast to our wider type so we can pass string record-type names
  const readRecords = _readRecords as unknown as ReadRecordsFn;

  const startTime = daysAgo(daysBack).toISOString();
  const endTime = new Date().toISOString();
  const timeRangeFilter = {
    operator: 'between' as const,
    startTime,
    endTime,
  };
  const opts = { timeRangeFilter };

  console.log(TAG, 'Querying records for range:', startTime, '→', endTime);

  // Query all record types in parallel.
  // Large datasets (HR, Steps, Distance) use chunked parallel loading
  // to reduce sequential API calls (HR was 38 sequential pages before).
  const [
    hrRecords,
    stepsRecords,
    sleepRecords,
    exerciseRecords,
    distanceRecordsRaw,
    activeCalRecords,
    totalCalRecords,
    weightRecords,
    heightRecords,
    bodyFatRecords,
  ] = await Promise.all([
    readAllRecordsChunked(readRecords, 'HeartRate', startTime, endTime, 7),
    readAllRecordsChunked(readRecords, 'Steps', startTime, endTime, 30),
    readAllRecords(readRecords, 'SleepSession', opts).catch(() => []),
    readAllRecords(readRecords, 'ExerciseSession', opts).catch(() => []),
    readAllRecordsChunked(readRecords, 'Distance', startTime, endTime, 30),
    readAllRecords(readRecords, 'ActiveCaloriesBurned', opts).catch(() => []),
    readAllRecords(readRecords, 'TotalCaloriesBurned', opts).catch(() => []),
    readAllRecords(readRecords, 'Weight', opts).catch(() => []),
    readAllRecords(readRecords, 'Height', opts).catch(() => []),
    readAllRecords(readRecords, 'BodyFat', opts).catch(() => []),
  ]);

  console.log(TAG, 'Record counts (after pagination):', {
    heartRate: hrRecords.length,
    steps: stepsRecords.length,
    sleep: sleepRecords.length,
    exercise: exerciseRecords.length,
    distance: distanceRecordsRaw.length,
    activeCal: activeCalRecords.length,
    totalCal: totalCalRecords.length,
    weight: weightRecords.length,
    height: heightRecords.length,
    bodyFat: bodyFatRecords.length,
  });

  // Log first few raw records for each type to inspect shape
  if (hrRecords.length > 0) {
    console.log(TAG, 'HR sample (first 2):', JSON.stringify(hrRecords.slice(0, 2)));
  }
  if (stepsRecords.length > 0) {
    console.log(TAG, 'Steps sample (first 2):', JSON.stringify(stepsRecords.slice(0, 2)));
  }
  if (sleepRecords.length > 0) {
    console.log(TAG, 'Sleep sample (first 2):', JSON.stringify(sleepRecords.slice(0, 2)));
  }
  if (exerciseRecords.length > 0) {
    console.log(TAG, 'Exercise sample (first 2):', JSON.stringify(exerciseRecords.slice(0, 2)));
  }

  // --- Transform Heart Rate ---
  const heartRateAuto: HeartRateAuto[] = [];
  for (const rec of hrRecords as HCHeartRateRecord[]) {
    if (rec.samples) {
      for (const sample of rec.samples) {
        const time = sample.time ?? rec.startTime;
        heartRateAuto.push({
          date: toDateStr(time),
          time: toTimeStr(time),
          heartRate: Math.round(sample.beatsPerMinute),
        });
      }
    }
  }

  // --- Transform Steps -> Activity (daily) + ActivityMinute ---
  const stepsByDate = new Map<string, number>();
  const activityMinuteList: ActivityMinute[] = [];
  for (const rec of stepsRecords as HCStepsRecord[]) {
    const date = toDateStr(rec.startTime);
    stepsByDate.set(date, (stepsByDate.get(date) ?? 0) + (rec.count ?? 0));
    // Add as minute-level data
    activityMinuteList.push({
      date,
      time: toTimeStr(rec.startTime),
      steps: rec.count ?? 0,
    });
  }

  // Build daily distance and calorie maps
  const distanceByDate = new Map<string, number>();
  for (const rec of distanceRecordsRaw as HCDistanceRecord[]) {
    const date = toDateStr(rec.startTime);
    distanceByDate.set(
      date,
      (distanceByDate.get(date) ?? 0) + (rec.distance?.inMeters ?? 0),
    );
  }

  const caloriesByDate = new Map<string, number>();
  for (const rec of totalCalRecords as HCCaloriesRecord[]) {
    const date = toDateStr(rec.startTime);
    caloriesByDate.set(
      date,
      (caloriesByDate.get(date) ?? 0) + (rec.energy?.inKilocalories ?? 0),
    );
  }
  // Fallback to active calories if total not available
  if (caloriesByDate.size === 0) {
    for (const rec of activeCalRecords as HCCaloriesRecord[]) {
      const date = toDateStr(rec.startTime);
      caloriesByDate.set(
        date,
        (caloriesByDate.get(date) ?? 0) + (rec.energy?.inKilocalories ?? 0),
      );
    }
  }

  // Combine into Activity[] (daily summaries)
  const allDates = new Set([
    ...stepsByDate.keys(),
    ...distanceByDate.keys(),
    ...caloriesByDate.keys(),
  ]);
  const activity: Activity[] = [];
  for (const date of allDates) {
    activity.push({
      date,
      steps: stepsByDate.get(date) ?? 0,
      distance: distanceByDate.get(date) ?? 0,
      runDistance: 0,
      calories: Math.round(caloriesByDate.get(date) ?? 0),
    });
  }
  activity.sort((a, b) => a.date.localeCompare(b.date));

  // --- Transform Sleep Sessions ---
  const sleep: Sleep[] = [];
  const sleepMinuteList: SleepMinute[] = [];

  for (const rec of sleepRecords as HCSleepSessionRecord[]) {
    let deepMin = 0;
    let lightMin = 0;
    let remMin = 0;
    let wakeMin = 0;

    if (rec.stages && rec.stages.length > 0) {
      for (const stage of rec.stages) {
        const startMs = new Date(stage.startTime).getTime();
        const endMs = new Date(stage.endTime).getTime();
        const durationMin = Math.round((endMs - startMs) / 60000);

        if (isAwakeStage(stage.stage)) {
          wakeMin += durationMin;
        } else {
          const mapped = mapSleepStage(stage.stage);
          if (mapped === 'DEEP') deepMin += durationMin;
          else if (mapped === 'REM') remMin += durationMin;
          else lightMin += durationMin;
        }

        // Generate per-minute sleep records
        const mappedStage = mapSleepStage(stage.stage);
        if (mappedStage) {
          const date = toDateStr(stage.startTime);
          for (let t = startMs; t < endMs; t += 60000) {
            sleepMinuteList.push({
              date,
              time: toTimeStr(new Date(t).toISOString()),
              stage: mappedStage,
              hr: 0,
              respiratory_rate: null,
            });
          }
        }
      }
    } else {
      // No stages - estimate as all light sleep
      const startMs = new Date(rec.startTime).getTime();
      const endMs = new Date(rec.endTime).getTime();
      lightMin = Math.round((endMs - startMs) / 60000);
    }

    const date = toDateStr(rec.startTime);
    sleep.push({
      date,
      deepSleepTime: deepMin,
      shallowSleepTime: lightMin,
      wakeTime: wakeMin,
      REMTime: remMin,
      start: rec.startTime,
      stop: rec.endTime,
      naps: [],
    });
  }
  sleep.sort((a, b) => a.date.localeCompare(b.date));

  // --- Transform Exercise Sessions -> Sport + ActivityStage ---
  // Build time-indexed distance and calorie records for exercise enrichment
  const distanceRecords = distanceRecordsRaw as HCDistanceRecord[];
  const calorieRecords = (totalCalRecords.length > 0
    ? totalCalRecords
    : activeCalRecords) as HCCaloriesRecord[];

  const sport: Sport[] = [];
  const activityStage: ActivityStage[] = [];

  for (const rec of exerciseRecords as HCExerciseRecord[]) {
    const startMs = new Date(rec.startTime).getTime();
    const endMs = new Date(rec.endTime).getTime();
    const durationSec = Math.round((endMs - startMs) / 1000);

    // Correlate distance records that overlap with this exercise session
    let exerciseDistance = 0;
    for (const dr of distanceRecords) {
      const drStart = new Date(dr.startTime).getTime();
      const drEnd = new Date(dr.endTime).getTime();
      if (drStart >= startMs && drEnd <= endMs) {
        exerciseDistance += dr.distance?.inMeters ?? 0;
      }
    }

    // Correlate calorie records that overlap with this exercise session
    let exerciseCalories = 0;
    for (const cr of calorieRecords) {
      const crStart = new Date(cr.startTime).getTime();
      const crEnd = new Date(cr.endTime).getTime();
      if (crStart >= startMs && crEnd <= endMs) {
        exerciseCalories += cr.energy?.inKilocalories ?? 0;
      }
    }

    sport.push({
      type: mapExerciseType(rec.exerciseType ?? 79),
      startTime: rec.startTime,
      sportTime: durationSec,
      maxPace: 0,
      minPace: 0,
      distance: Math.round(exerciseDistance),
      avgPace: 0,
      calories: Math.round(exerciseCalories),
    });

    // Also build an ActivityStage entry from each exercise session
    const date = toDateStr(rec.startTime);
    // Count steps during this exercise from the step records
    let exerciseSteps = 0;
    for (const sr of stepsRecords as HCStepsRecord[]) {
      const srStart = new Date(sr.startTime).getTime();
      const srEnd = new Date(sr.endTime).getTime();
      if (srStart >= startMs && srEnd <= endMs) {
        exerciseSteps += sr.count ?? 0;
      }
    }

    activityStage.push({
      date,
      start: toTimeStr(rec.startTime),
      stop: toTimeStr(rec.endTime),
      distance: Math.round(exerciseDistance),
      calories: Math.round(exerciseCalories),
      steps: exerciseSteps,
    });
  }

  console.log(TAG, 'Exercise enrichment:', {
    sportCount: sport.length,
    activityStageCount: activityStage.length,
    sportsWithDistance: sport.filter((s) => s.distance > 0).length,
    sportsWithCalories: sport.filter((s) => s.calories > 0).length,
  });

  // --- Transform Body Data ---
  const body: Body[] = [];
  const latestWeight = (weightRecords as HCWeightRecord[]).at(-1);
  const latestHeight = (heightRecords as HCHeightRecord[]).at(-1);
  const latestBodyFat = (bodyFatRecords as HCBodyFatRecord[]).at(-1);

  if (latestWeight || latestHeight || latestBodyFat) {
    const weightKg = latestWeight?.weight?.inKilograms ?? 0;
    const heightM = latestHeight?.height?.inMeters ?? 0;
    const heightCm = heightM * 100;
    const bmi = heightM > 0 ? weightKg / (heightM * heightM) : 0;

    body.push({
      time: latestWeight?.time ?? latestHeight?.time ?? new Date().toISOString(),
      weight: weightKg,
      height: heightCm,
      bmi: Math.round(bmi * 10) / 10,
      fatRate: latestBodyFat?.percentage ?? null,
      bodyWaterRate: null,
      boneMass: null,
      metabolism: null,
      muscleRate: null,
      visceralFat: null,
    });
  }

  // --- Construct User from body data ---
  // Health Connect doesn't provide user profile metadata (name, birthday, gender),
  // so we build a minimal User from what HC does give us (weight, height).
  const user: User[] = [];
  if (latestWeight || latestHeight) {
    const weightKg = latestWeight?.weight?.inKilograms ?? 0;
    const heightCm = (latestHeight?.height?.inMeters ?? 0) * 100;
    user.push({
      userId: 'health-connect',
      gender: 0, // Unknown -- HC doesn't expose this
      height: Math.round(heightCm),
      weight: Math.round(weightKg * 10) / 10,
      nickName: 'Health Connect User',
      avatar: '',
      birthday: '', // HC doesn't expose this
    });
    console.log(TAG, 'Constructed user from HC body data:', {
      height: heightCm,
      weight: weightKg,
    });
  } else {
    console.log(TAG, 'No weight/height records in HC -- user[] will be empty');
  }

  // --- Build indexes ---
  const dailyHRSummary = buildDailyHRSummary(heartRateAuto);
  const heartRateByDay = indexByDay(heartRateAuto);
  const sleepMinuteByDay = indexByDay(sleepMinuteList);
  const activityMinuteByDay = indexByDay(activityMinuteList);

  // --- Compute scores ---
  const { computedStrain, computedRecovery, computedSleepScore, computedVO2Max } =
    computeAllScores({ heartRateByDay, dailyHRSummary, sleep });

  // --- Final summary log ---
  console.log(TAG, 'Transformed data summary:', {
    user: user.length,
    heartRateRecords: heartRateAuto.length,
    activityDays: activity.length,
    activityMinutes: activityMinuteList.length,
    activityStages: activityStage.length,
    sleepNights: sleep.length,
    sleepMinutes: sleepMinuteList.length,
    sports: sport.length,
    bodyRecords: body.length,
    hrDaySummaries: dailyHRSummary.size,
    dateRange:
      activity.length > 0
        ? `${activity[0].date} → ${activity[activity.length - 1].date}`
        : 'none',
  });

  return {
    user,
    activity,
    activityMinute: activityMinuteList,
    activityStage,
    sleep,
    sleepMinute: sleepMinuteList,
    heartRateAuto,
    dailyHRSummary,
    heartRateByDay,
    sleepMinuteByDay,
    activityMinuteByDay,
    sport,
    body,
    // Empty arrays for data types HC can't provide
    hrvDaily: [],
    hrvSamples: [],
    spo2Samples: [],
    skinTempSamples: [],
    healthMonitorDaily: [],
    recoveryDaily: [],
    stressScores: [],
    breathworkSessions: [],
    strainDaily: [],
    workoutStrain: [],
    strengthWorkouts: [],
    strengthSets: [],
    exerciseCatalog: [],
    sleepNeedDaily: [],
    sleepSchedule: [],
    journalEntries: [],
    goals: [],
    vo2Max: [],
    bodyComp: [],
    computedStrain,
    computedRecovery,
    computedSleepScore,
    computedVO2Max,
  };
}

// ---------------------------------------------------------------------------
// Health Connect record type shapes (minimal, for casting)
// ---------------------------------------------------------------------------

interface HCHeartRateRecord {
  startTime: string;
  endTime: string;
  samples?: Array<{ time?: string; beatsPerMinute: number }>;
}

interface HCStepsRecord {
  startTime: string;
  endTime: string;
  count?: number;
}

interface HCDistanceRecord {
  startTime: string;
  endTime: string;
  distance?: { inMeters: number };
}

interface HCCaloriesRecord {
  startTime: string;
  endTime: string;
  energy?: { inKilocalories: number };
}

interface HCSleepSessionRecord {
  startTime: string;
  endTime: string;
  stages?: Array<{
    startTime: string;
    endTime: string;
    stage: number;
  }>;
}

interface HCExerciseRecord {
  startTime: string;
  endTime: string;
  exerciseType?: number;
}

interface HCWeightRecord {
  time: string;
  weight?: { inKilograms: number };
}

interface HCHeightRecord {
  time: string;
  height?: { inMeters: number };
}

interface HCBodyFatRecord {
  time: string;
  percentage?: number;
}
