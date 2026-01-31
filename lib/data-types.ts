// ---------------------------------------------------------------------------
// Helios-Tracker  --  TypeScript interfaces for all fitness data entities
// ---------------------------------------------------------------------------

/** User profile information. */
export interface User {
  userId: string;
  gender: number;
  height: number;
  weight: number;
  nickName: string;
  avatar: string;
  /** Format: "YYYY-MM" (e.g. "1999-02") */
  birthday: string;
}

/** Daily activity summary (154 rows). */
export interface Activity {
  /** Format: "YYYY-MM-DD" */
  date: string;
  steps: number;
  /** Distance in meters. */
  distance: number;
  /** Run distance in meters. */
  runDistance: number;
  calories: number;
}

/** Per-minute step count (19K rows). */
export interface ActivityMinute {
  /** Format: "YYYY-MM-DD" */
  date: string;
  /** Format: "HH:mm" */
  time: string;
  steps: number;
}

/** Activity stage with start/stop windows (871 rows). */
export interface ActivityStage {
  /** Format: "YYYY-MM-DD" */
  date: string;
  /** Format: "HH:mm" */
  start: string;
  /** Format: "HH:mm" */
  stop: string;
  /** Distance in meters. */
  distance: number;
  calories: number;
  steps: number;
}

/** A single nap entry within a sleep record. */
export interface SleepNap {
  /** ISO datetime string. */
  start: string;
  /** ISO datetime string. */
  end: string;
}

/** Nightly sleep summary (154 rows). */
export interface Sleep {
  /** Format: "YYYY-MM-DD" */
  date: string;
  /** Deep sleep duration in minutes. */
  deepSleepTime: number;
  /** Shallow / light sleep duration in minutes. */
  shallowSleepTime: number;
  /** Awake duration in minutes. */
  wakeTime: number;
  /** ISO datetime string for sleep start. */
  start: string;
  /** ISO datetime string for sleep stop. */
  stop: string;
  /** REM sleep duration in minutes. */
  REMTime: number;
  /** Array of nap intervals. */
  naps: SleepNap[];
}

/** Per-minute sleep stage data (49K rows). */
export interface SleepMinute {
  /** Format: "YYYY-MM-DD" */
  date: string;
  /** Format: "HH:mm" */
  time: string;
  stage: "LIGHT" | "DEEP" | "REM";
  hr: number;
  respiratory_rate: number | null;
}

/** Automatic heart-rate measurement (150K rows). */
export interface HeartRateAuto {
  /** Format: "YYYY-MM-DD" */
  date: string;
  /** Format: "HH:mm" */
  time: string;
  heartRate: number;
}

/** Pre-computed daily heart-rate summary (for the HR index). */
export interface DailyHRSummary {
  /** Format: "YYYY-MM-DD" */
  date: string;
  min: number;
  max: number;
  avg: number;
  resting: number;
  /** Number of HR readings that day (used internally during construction). */
  count: number;
}

/** Individual sport / workout session (157 rows). */
export interface Sport {
  /** Sport type code: 8 = Outdoor Run, 21 = Indoor Cycling, 223 = Gym / Free Training. */
  type: number;
  /** ISO datetime string for workout start. */
  startTime: string;
  /** Duration in seconds. */
  sportTime: number;
  maxPace: number;
  minPace: number;
  /** Distance in meters. */
  distance: number;
  avgPace: number;
  /** Energy burned in kcal. */
  calories: number;
}

/** Body composition measurement (1 row). */
export interface Body {
  /** ISO datetime string. */
  time: string;
  /** Weight in kg. */
  weight: number;
  /** Height in cm. */
  height: number;
  bmi: number;
  fatRate: number | null;
  bodyWaterRate: number | null;
  boneMass: number | null;
  metabolism: number | null;
  muscleRate: number | null;
  visceralFat: number | null;
}

// ---------------------------------------------------------------------------
// New metrics (recovery, strain, health monitor, journal, strength)
// ---------------------------------------------------------------------------

export interface HRVDaily {
  user_id: string;
  /** Format: "YYYY-MM-DD" */
  date: string;
  rmssd_ms: number | null;
  sdnn_ms: number | null;
  ln_rmssd: number | null;
  /** ISO datetime string */
  measured_at: string;
  source: string;
  device: string;
  quality: string;
}

export interface HRVSample {
  user_id: string;
  /** ISO datetime string */
  start_time: string;
  /** ISO datetime string */
  end_time: string;
  rmssd_ms: number | null;
  sdnn_ms: number | null;
  hr_avg: number | null;
  artifact_ratio: number | null;
  source: string;
  device: string;
}

export interface SpO2Sample {
  user_id: string;
  /** ISO datetime string */
  recorded_at: string;
  spo2_percent: number | null;
  measurement_type: string;
  source: string;
  device: string;
  quality: string;
}

export interface SkinTempSample {
  user_id: string;
  /** ISO datetime string */
  recorded_at: string;
  temp_c: number | null;
  baseline_c: number | null;
  delta_c: number | null;
  source: string;
  device: string;
}

export interface HealthMonitorDaily {
  user_id: string;
  /** Format: "YYYY-MM-DD" */
  date: string;
  rhr_bpm: number | null;
  hrv_rmssd: number | null;
  resp_rate_bpm: number | null;
  spo2_avg: number | null;
  temp_delta_c: number | null;
  status: string;
  source: string;
}

export interface RecoveryDaily {
  user_id: string;
  /** Format: "YYYY-MM-DD" */
  date: string;
  recovery_score: number | null;
  rhr_bpm: number | null;
  hrv_rmssd: number | null;
  spo2_avg: number | null;
  temp_delta_c: number | null;
  sleep_debt_min: number | null;
  strain_prevday: number | null;
  source: string;
}

export interface StressScore {
  user_id: string;
  /** ISO datetime string */
  recorded_at: string;
  stress_score: number | null;
  hrv_rmssd: number | null;
  hr_bpm: number | null;
  confidence: number | null;
  source: string;
  device: string;
}

export interface BreathworkSession {
  session_id: string;
  user_id: string;
  /** ISO datetime string */
  start_time: string;
  /** ISO datetime string */
  end_time: string;
  pattern: string;
  cycles: number | null;
  notes: string;
  source: string;
}

export interface StrainDaily {
  user_id: string;
  /** Format: "YYYY-MM-DD" */
  date: string;
  cardio_strain: number | null;
  muscular_strain: number | null;
  total_strain: number | null;
  zone_rest_min: number | null;
  zone_fatburn_min: number | null;
  zone_cardio_min: number | null;
  zone_peak_min: number | null;
  active_calories: number | null;
  source: string;
}

export interface WorkoutStrain {
  workout_id: string;
  user_id: string;
  /** ISO datetime string */
  start_time: string;
  /** ISO datetime string */
  end_time: string;
  workout_type: string;
  cardio_strain: number | null;
  muscular_strain: number | null;
  total_strain: number | null;
  avg_hr: number | null;
  max_hr: number | null;
  calories: number | null;
  source: string;
}

export interface StrengthWorkout {
  workout_id: string;
  user_id: string;
  /** ISO datetime string */
  start_time: string;
  /** ISO datetime string */
  end_time: string;
  name: string;
  notes: string;
  source: string;
}

export interface StrengthSet {
  set_id: string;
  workout_id: string;
  exercise_id: string;
  set_index: number | null;
  reps: number | null;
  weight: number | null;
  unit: string;
  rpe: number | null;
  rest_seconds: number | null;
  tempo: string;
  range_of_motion: string;
  completed: number | null;
}

export interface ExerciseCatalogItem {
  exercise_id: string;
  name: string;
  muscle_group: string;
  equipment: string;
  is_bodyweight: number | null;
}

export interface SleepNeedDaily {
  user_id: string;
  /** Format: "YYYY-MM-DD" */
  date: string;
  recommended_sleep_min: number | null;
  actual_sleep_min: number | null;
  sleep_debt_min: number | null;
  nap_min: number | null;
  bedtime_target: string;
  wake_target: string;
  source: string;
}

export interface SleepSchedule {
  user_id: string;
  preferred_bedtime: string;
  preferred_wake_time: string;
  chronotype: string;
  timezone: string;
}

export interface JournalEntry {
  entry_id: string;
  user_id: string;
  /** Format: "YYYY-MM-DD" */
  date: string;
  /** Format: "HH:mm" */
  time: string;
  tag: string;
  quantity: number | null;
  unit: string;
  notes: string;
  source: string;
}

export interface Goal {
  goal_id: string;
  user_id: string;
  goal_type: string;
  target_value: number | null;
  target_unit: string;
  start_date: string;
  end_date: string;
  status: string;
  notes: string;
}

export interface VO2MaxRecord {
  user_id: string;
  /** Format: "YYYY-MM-DD" */
  date: string;
  vo2max_mlkgmin: number | null;
  source: string;
  device: string;
}

export interface BodyCompRecord {
  user_id: string;
  /** Format: "YYYY-MM-DD" */
  date: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  lean_mass_kg: number | null;
  waist_cm: number | null;
  source: string;
  device: string;
}

/** Master container holding every data array plus indexed Maps for large datasets. */
export interface FitnessData {
  user: User[];
  activity: Activity[];
  activityMinute: ActivityMinute[];
  activityStage: ActivityStage[];
  sleep: Sleep[];
  sleepMinute: SleepMinute[];
  heartRateAuto: HeartRateAuto[];
  dailyHRSummary: Map<string, DailyHRSummary>;
  heartRateByDay: Map<string, HeartRateAuto[]>;
  sleepMinuteByDay: Map<string, SleepMinute[]>;
  activityMinuteByDay: Map<string, ActivityMinute[]>;
  sport: Sport[];
  body: Body[];
  hrvDaily: HRVDaily[];
  hrvSamples: HRVSample[];
  spo2Samples: SpO2Sample[];
  skinTempSamples: SkinTempSample[];
  healthMonitorDaily: HealthMonitorDaily[];
  recoveryDaily: RecoveryDaily[];
  stressScores: StressScore[];
  breathworkSessions: BreathworkSession[];
  strainDaily: StrainDaily[];
  workoutStrain: WorkoutStrain[];
  strengthWorkouts: StrengthWorkout[];
  strengthSets: StrengthSet[];
  exerciseCatalog: ExerciseCatalogItem[];
  sleepNeedDaily: SleepNeedDaily[];
  sleepSchedule: SleepSchedule[];
  journalEntries: JournalEntry[];
  goals: Goal[];
  vo2Max: VO2MaxRecord[];
  bodyComp: BodyCompRecord[];
  // Computed scoring Maps
  computedStrain: Map<string, ComputedDailyStrain>;
  computedRecovery: Map<string, ComputedRecoveryScore>;
  computedSleepScore: Map<string, ComputedEnhancedSleepScore>;
  computedVO2Max: ComputedVO2Max | null;
}

// ---------------------------------------------------------------------------
// Computed scoring types (WHOOP-like features)
// ---------------------------------------------------------------------------

export interface ComputedDailyStrain {
  date: string;
  rawTRIMP: number;
  /** Strain on 0-21 scale. */
  strain: number;
  zoneMinutes: { rest: number; fatBurn: number; cardio: number; peak: number };
  level: 'rest' | 'light' | 'moderate' | 'high' | 'all-out';
}

export interface ComputedRecoveryScore {
  date: string;
  /** Recovery on 0-100 scale. */
  score: number;
  rhrBpm: number;
  rhrBaseline: number;
  sleepComponent: number;
  strainComponent: number;
  level: 'green' | 'yellow' | 'red';
}

export interface ComputedEnhancedSleepScore {
  date: string;
  /** Overall sleep score on 0-100 scale. */
  score: number;
  /** Sufficiency sub-score (0-100). */
  sufficiency: number;
  /** Efficiency sub-score (0-100). */
  efficiency: number;
  /** Stage quality sub-score (0-100). */
  stageQuality: number;
  /** Consistency sub-score (0-100). */
  consistency: number;
  level: 'green' | 'yellow' | 'red';
}

export interface ComputedVO2Max {
  vo2max: number;
  classification: string;
  percentile: number;
}

export interface ComputedSleepNeed {
  recommendedMin: number;
  baseMin: number;
  strainAdjustMin: number;
  debtAdjustMin: number;
}

export interface ComputedStrainCoach {
  targetMin: number;
  targetMax: number;
  label: string;
  description: string;
}

// ---- Convenience aliases (used in hooks and context) ----
export type UserData = User;
export type ActivityDay = Activity;
export type SleepNight = Sleep;
export type SleepMinuteRecord = SleepMinute;
export type HeartRateRecord = HeartRateAuto;
export type SportSession = Sport;
export type BodyData = Body;
