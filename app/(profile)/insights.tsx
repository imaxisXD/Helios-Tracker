import React from 'react';
import { ScrollView, View, Text, useWindowDimensions, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFitnessData } from '@/hooks/use-fitness-data';
import { BrutalistCard } from '@/components/ui/brutalist-card';
import { MetricBlock } from '@/components/ui/metric-block';
import { SectionHeader } from '@/components/ui/section-header';
import { DottedDivider } from '@/components/ui/dotted-divider';
import { DecorativeBarcode } from '@/components/ui/decorative-barcode';
import {
  HeliosColors,
  HeliosTypography,
  HeliosSpacing,
} from '@/constants/theme';
import {
  formatDuration,
  formatShortDate,
} from '@/lib/date-utils';
import { formatNumber } from '@/lib/format-utils';

type DatedRow = { date: string };
type TimedRow = { recorded_at: string };
type StartedRow = { start_time: string };

function latestByDate<T extends DatedRow>(rows: T[]): T | null {
  if (rows.length === 0) return null;
  return rows.reduce((latest, row) =>
    row.date > latest.date ? row : latest,
  );
}

function latestByRecorded<T extends TimedRow>(rows: T[]): T | null {
  if (rows.length === 0) return null;
  return rows.reduce((latest, row) =>
    row.recorded_at > latest.recorded_at ? row : latest,
  );
}

function latestByStart<T extends StartedRow>(rows: T[]): T | null {
  if (rows.length === 0) return null;
  return rows.reduce((latest, row) =>
    row.start_time > latest.start_time ? row : latest,
  );
}

function formatSigned(value: number | null | undefined, unit: string): string {
  if (value === null || value === undefined) return '--';
  const rounded = Math.round(value * 10) / 10;
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded}${unit}`;
}

function formatMaybe(
  value: number | null | undefined,
  suffix = '',
  fractionDigits = 0,
): string {
  if (value === null || value === undefined) return '--';
  const display =
    fractionDigits > 0 ? value.toFixed(fractionDigits) : formatNumber(value);
  return `${display}${suffix}`;
}

function formatDurationMaybe(value: number | null | undefined): string {
  if (value === null || value === undefined) return '--';
  return formatDuration(value);
}

async function triggerHaptic() {
  if (process.env.EXPO_OS === 'ios') {
    try {
      const Haptics = await import('expo-haptics');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  }
}

export default function InsightsScreen() {
  const router = useRouter();
  const {
    recoveryDaily,
    strainDaily,
    healthMonitorDaily,
    stressScores,
    sleepNeedDaily,
    vo2Max,
    bodyComp,
    journalEntries,
    goals,
    strengthWorkouts,
    strengthSets,
    breathworkSessions,
  } = useFitnessData();

  const { width } = useWindowDimensions();

  const latestRecovery = latestByDate(recoveryDaily);
  const latestStrain = latestByDate(strainDaily);
  const latestHealth = latestByDate(healthMonitorDaily);
  const latestStress = latestByRecorded(stressScores);
  const latestSleepNeed = latestByDate(sleepNeedDaily);
  const latestVo2 = latestByDate(vo2Max);
  const latestBodyComp = latestByDate(bodyComp);
  const latestStrength = latestByStart(strengthWorkouts);
  const latestBreathwork = latestByStart(breathworkSessions);

  const recentJournal = [...journalEntries]
    .sort((a, b) => {
      const aKey = `${a.date} ${a.time ?? ''}`;
      const bKey = `${b.date} ${b.time ?? ''}`;
      return bKey.localeCompare(aKey);
    })
    .slice(0, 3);

  const activeGoals = goals.filter(
    (g) => g.status?.toLowerCase() === 'active',
  );

  const strengthSetCount = latestStrength
    ? strengthSets.filter(
        (s) => s.workout_id === latestStrength.workout_id,
      ).length
    : 0;

  const barcodeWidth =
    width -
    HeliosSpacing.screenPadding * 2 -
    HeliosSpacing.cardPadding * 2 -
    36;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: HeliosColors.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        padding: HeliosSpacing.screenPadding,
        paddingBottom: HeliosSpacing.xxl + 40,
        gap: HeliosSpacing.lg,
      }}
    >
      <Animated.View entering={FadeInDown.duration(400)}>
        <Pressable
          onPress={() => { triggerHaptic(); router.back(); }}
          style={{
            marginTop: HeliosSpacing.xxl,
            marginBottom: HeliosSpacing.sm,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Ionicons name="chevron-back" size={16} color={HeliosColors.accent} />
          <Text
            style={{
              ...HeliosTypography.label,
              color: HeliosColors.accent,
            }}
          >
            {'BACK'}
          </Text>
        </Pressable>
        <Text
          style={{
            ...HeliosTypography.heroTitle,
            color: HeliosColors.textPrimary,
          }}
        >
          {'INSIGHTS'}
        </Text>
        <Text
          style={{
            ...HeliosTypography.body,
            color: HeliosColors.textSecondary,
            marginTop: HeliosSpacing.xs,
          }}
        >
          {'Recovery, strain, sleep, and habits overview'}
        </Text>
        <View
          style={{
            width: 56,
            height: 4,
            backgroundColor: HeliosColors.accent,
            marginTop: HeliosSpacing.sm,
          }}
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
        <SectionHeader title="Recovery & Strain" />
        <View style={{ marginTop: HeliosSpacing.md, gap: HeliosSpacing.cardGap }}>
          <BrutalistCard verticalText="RECOVERY" accentDot>
            {latestRecovery ? (
              <>
                <Text
                  style={{
                    ...HeliosTypography.label,
                    color: HeliosColors.textOnCardMuted,
                    marginBottom: HeliosSpacing.sm,
                  }}
                >
                  {formatShortDate(latestRecovery.date).toUpperCase()}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: HeliosSpacing.md,
                    paddingRight: 28,
                  }}
                >
                  <View style={{ width: '45%' }}>
                    <MetricBlock
                      value={formatMaybe(latestRecovery.recovery_score)}
                      label="RECOVERY"
                      size="large"
                      onCard
                    />
                  </View>
                  <View style={{ width: '45%' }}>
                    <MetricBlock
                      value={formatMaybe(latestRecovery.rhr_bpm)}
                      label="RHR"
                      size="medium"
                      onCard
                    />
                  </View>
                  <View style={{ width: '45%' }}>
                    <MetricBlock
                      value={formatMaybe(latestRecovery.hrv_rmssd, '', 1)}
                      label="HRV RMSSD"
                      size="small"
                      onCard
                    />
                  </View>
                  <View style={{ width: '45%' }}>
                    <MetricBlock
                      value={formatMaybe(latestRecovery.spo2_avg, '%')}
                      label="SPO2"
                      size="small"
                      onCard
                    />
                  </View>
                  <View style={{ width: '45%' }}>
                    <MetricBlock
                      value={formatSigned(latestRecovery.temp_delta_c, '°C')}
                      label="TEMP DELTA"
                      size="small"
                      onCard
                    />
                  </View>
                  <View style={{ width: '45%' }}>
                    <MetricBlock
                      value={formatDurationMaybe(latestRecovery.sleep_debt_min)}
                      label="SLEEP DEBT"
                      size="small"
                      onCard
                    />
                  </View>
                </View>
              </>
            ) : (
              <Text
                style={{
                  ...HeliosTypography.bodySmall,
                  color: HeliosColors.textOnCardMuted,
                  textAlign: 'center',
                  paddingVertical: HeliosSpacing.md,
                }}
              >
                {'No recovery data yet'}
              </Text>
            )}
          </BrutalistCard>

          <BrutalistCard verticalText="STRAIN">
            {latestStrain ? (
              <>
                <Text
                  style={{
                    ...HeliosTypography.label,
                    color: HeliosColors.textOnCardMuted,
                    marginBottom: HeliosSpacing.sm,
                  }}
                >
                  {formatShortDate(latestStrain.date).toUpperCase()}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: HeliosSpacing.md,
                    paddingRight: 28,
                  }}
                >
                  <View style={{ width: '45%' }}>
                    <MetricBlock
                      value={formatMaybe(latestStrain.total_strain, '', 1)}
                      label="TOTAL"
                      size="large"
                      onCard
                    />
                  </View>
                  <View style={{ width: '45%' }}>
                    <MetricBlock
                      value={formatMaybe(latestStrain.cardio_strain, '', 1)}
                      label="CARDIO"
                      size="medium"
                      onCard
                    />
                  </View>
                  <View style={{ width: '45%' }}>
                    <MetricBlock
                      value={formatMaybe(latestStrain.muscular_strain, '', 1)}
                      label="MUSCULAR"
                      size="small"
                      onCard
                    />
                  </View>
                  <View style={{ width: '45%' }}>
                    <MetricBlock
                      value={formatMaybe(latestStrain.active_calories, ' kcal')}
                      label="ACTIVE CAL"
                      size="small"
                      onCard
                    />
                  </View>
                </View>
                <View style={{ marginTop: HeliosSpacing.md }}>
                  <DecorativeBarcode
                    width={barcodeWidth}
                    height={22}
                    label="STRAIN ZONES"
                  />
                </View>
              </>
            ) : (
              <Text
                style={{
                  ...HeliosTypography.bodySmall,
                  color: HeliosColors.textOnCardMuted,
                  textAlign: 'center',
                  paddingVertical: HeliosSpacing.md,
                }}
              >
                {'No strain data yet'}
              </Text>
            )}
          </BrutalistCard>
        </View>
      </Animated.View>

      <DottedDivider />

      <Animated.View entering={FadeInDown.delay(200).duration(400)}>
        <SectionHeader title="Health Monitor" />
        <View style={{ marginTop: HeliosSpacing.md, gap: HeliosSpacing.cardGap }}>
          <BrutalistCard verticalText="HEALTH">
            {latestHealth ? (
              <>
                <Text
                  style={{
                    ...HeliosTypography.label,
                    color: HeliosColors.textOnCardMuted,
                    marginBottom: HeliosSpacing.sm,
                  }}
                >
                  {formatShortDate(latestHealth.date).toUpperCase()}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: HeliosSpacing.md,
                    paddingRight: 28,
                  }}
                >
                  <View style={{ width: '45%' }}>
                    <MetricBlock
                      value={formatMaybe(latestHealth.rhr_bpm)}
                      label="RHR"
                      size="medium"
                      onCard
                    />
                  </View>
                  <View style={{ width: '45%' }}>
                    <MetricBlock
                      value={formatMaybe(latestHealth.hrv_rmssd, '', 1)}
                      label="HRV"
                      size="medium"
                      onCard
                    />
                  </View>
                  <View style={{ width: '45%' }}>
                    <MetricBlock
                      value={formatMaybe(latestHealth.resp_rate_bpm, '', 1)}
                      label="RESP RATE"
                      size="small"
                      onCard
                    />
                  </View>
                  <View style={{ width: '45%' }}>
                    <MetricBlock
                      value={formatMaybe(latestHealth.spo2_avg, '%')}
                      label="SPO2"
                      size="small"
                      onCard
                    />
                  </View>
                  <View style={{ width: '45%' }}>
                    <MetricBlock
                      value={formatSigned(latestHealth.temp_delta_c, '°C')}
                      label="TEMP DELTA"
                      size="small"
                      onCard
                    />
                  </View>
                  <View style={{ width: '45%' }}>
                    <MetricBlock
                      value={(latestHealth.status ?? '--').toUpperCase()}
                      label="STATUS"
                      size="small"
                      onCard
                    />
                  </View>
                </View>
              </>
            ) : (
              <Text
                style={{
                  ...HeliosTypography.bodySmall,
                  color: HeliosColors.textOnCardMuted,
                  textAlign: 'center',
                  paddingVertical: HeliosSpacing.md,
                }}
              >
                {'No health monitor data yet'}
              </Text>
            )}
          </BrutalistCard>

          <BrutalistCard verticalText="STRESS">
            {latestStress ? (
              <>
                <Text
                  style={{
                    ...HeliosTypography.label,
                    color: HeliosColors.textOnCardMuted,
                    marginBottom: HeliosSpacing.sm,
                  }}
                >
                  {formatShortDate(latestStress.recorded_at).toUpperCase()}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: HeliosSpacing.md,
                    paddingRight: 28,
                  }}
                >
                  <View style={{ width: '45%' }}>
                    <MetricBlock
                      value={formatMaybe(latestStress.stress_score, '', 1)}
                      label="STRESS"
                      size="large"
                      onCard
                    />
                  </View>
                  <View style={{ width: '45%' }}>
                    <MetricBlock
                      value={formatMaybe(latestStress.hrv_rmssd, '', 1)}
                      label="HRV"
                      size="medium"
                      onCard
                    />
                  </View>
                  <View style={{ width: '45%' }}>
                    <MetricBlock
                      value={formatMaybe(latestStress.hr_bpm)}
                      label="HR BPM"
                      size="small"
                      onCard
                    />
                  </View>
                  <View style={{ width: '45%' }}>
                    <MetricBlock
                      value={formatMaybe(
                        latestStress.confidence != null
                          ? Math.round(latestStress.confidence * 100)
                          : null,
                        '%',
                      )}
                      label="CONFIDENCE"
                      size="small"
                      onCard
                    />
                  </View>
                </View>
              </>
            ) : (
              <Text
                style={{
                  ...HeliosTypography.bodySmall,
                  color: HeliosColors.textOnCardMuted,
                  textAlign: 'center',
                  paddingVertical: HeliosSpacing.md,
                }}
              >
                {'No stress data yet'}
              </Text>
            )}
          </BrutalistCard>
        </View>
      </Animated.View>

      <DottedDivider />

      <Animated.View entering={FadeInDown.delay(300).duration(400)}>
        <SectionHeader title="Sleep Planner & Fitness" />
        <View style={{ marginTop: HeliosSpacing.md, gap: HeliosSpacing.cardGap }}>
          <BrutalistCard verticalText="SLEEP">
            {latestSleepNeed ? (
              <>
                <Text
                  style={{
                    ...HeliosTypography.label,
                    color: HeliosColors.textOnCardMuted,
                    marginBottom: HeliosSpacing.sm,
                  }}
                >
                  {formatShortDate(latestSleepNeed.date).toUpperCase()}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: HeliosSpacing.md,
                    paddingRight: 28,
                  }}
                >
                  <View style={{ width: '45%' }}>
                    <MetricBlock
                      value={formatDurationMaybe(
                        latestSleepNeed.recommended_sleep_min,
                      )}
                      label="RECOMMENDED"
                      size="medium"
                      onCard
                    />
                  </View>
                  <View style={{ width: '45%' }}>
                    <MetricBlock
                      value={formatDurationMaybe(
                        latestSleepNeed.actual_sleep_min,
                      )}
                      label="ACTUAL"
                      size="medium"
                      onCard
                    />
                  </View>
                  <View style={{ width: '45%' }}>
                    <MetricBlock
                      value={formatDurationMaybe(
                        latestSleepNeed.sleep_debt_min,
                      )}
                      label="SLEEP DEBT"
                      size="small"
                      onCard
                    />
                  </View>
                  <View style={{ width: '45%' }}>
                    <MetricBlock
                      value={formatDurationMaybe(latestSleepNeed.nap_min)}
                      label="NAPS"
                      size="small"
                      onCard
                    />
                  </View>
                </View>
                <View style={{ marginTop: HeliosSpacing.sm }}>
                  <Text
                    style={{
                      ...HeliosTypography.label,
                      color: HeliosColors.textOnCardMuted,
                    }}
                  >
                    {`TARGET ${latestSleepNeed.bedtime_target} → ${latestSleepNeed.wake_target}`}
                  </Text>
                </View>
              </>
            ) : (
              <Text
                style={{
                  ...HeliosTypography.bodySmall,
                  color: HeliosColors.textOnCardMuted,
                  textAlign: 'center',
                  paddingVertical: HeliosSpacing.md,
                }}
              >
                {'No sleep planner data yet'}
              </Text>
            )}
          </BrutalistCard>

          <BrutalistCard verticalText="FITNESS">
            <View style={{ paddingRight: 28, gap: HeliosSpacing.sm }}>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: HeliosSpacing.md,
                }}
              >
                <View style={{ width: '45%' }}>
                  <MetricBlock
                    value={latestVo2 ? `${latestVo2.vo2max_mlkgmin}` : '--'}
                    label="VO2 MAX"
                    size="medium"
                    onCard
                  />
                </View>
                <View style={{ width: '45%' }}>
                  <MetricBlock
                    value={
                      latestBodyComp?.body_fat_pct != null
                        ? `${latestBodyComp.body_fat_pct}%`
                        : '--'
                    }
                    label="BODY FAT"
                    size="small"
                    onCard
                  />
                </View>
                <View style={{ width: '45%' }}>
                  <MetricBlock
                    value={
                      latestBodyComp?.lean_mass_kg != null
                        ? `${latestBodyComp.lean_mass_kg} kg`
                        : '--'
                    }
                    label="LEAN MASS"
                    size="small"
                    onCard
                  />
                </View>
                <View style={{ width: '45%' }}>
                  <MetricBlock
                    value={
                      latestBodyComp?.waist_cm != null
                        ? `${latestBodyComp.waist_cm} cm`
                        : '--'
                    }
                    label="WAIST"
                    size="small"
                    onCard
                  />
                </View>
              </View>
              {latestBodyComp ? (
                <Text
                  style={{
                    ...HeliosTypography.label,
                    color: HeliosColors.textOnCardMuted,
                  }}
                >
                  {formatShortDate(latestBodyComp.date).toUpperCase()}
                </Text>
              ) : null}
            </View>
          </BrutalistCard>
        </View>
      </Animated.View>

      <DottedDivider />

      <Animated.View entering={FadeInDown.delay(400).duration(400)}>
        <SectionHeader title="Habits & Training" />
        <View style={{ marginTop: HeliosSpacing.md, gap: HeliosSpacing.cardGap }}>
          <BrutalistCard verticalText="JOURNAL">
            {recentJournal.length > 0 ? (
              <View style={{ gap: HeliosSpacing.sm, paddingRight: 28 }}>
                {recentJournal.map((entry) => (
                  <View key={entry.entry_id}>
                    <Text
                      style={{
                        ...HeliosTypography.metricSmall,
                        color: HeliosColors.textOnCard,
                      }}
                    >
                      {`${entry.tag.toUpperCase()} ${
                        entry.quantity != null ? entry.quantity : ''
                      } ${entry.unit ?? ''}`.trim()}
                    </Text>
                    <Text
                      style={{
                        ...HeliosTypography.label,
                        color: HeliosColors.textOnCardMuted,
                        marginTop: 2,
                      }}
                    >
                      {`${formatShortDate(entry.date)} ${entry.time ?? ''}`.trim()}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text
                style={{
                  ...HeliosTypography.bodySmall,
                  color: HeliosColors.textOnCardMuted,
                  textAlign: 'center',
                  paddingVertical: HeliosSpacing.md,
                }}
              >
                {'No journal entries yet'}
              </Text>
            )}
          </BrutalistCard>

          <BrutalistCard verticalText="GOALS">
            {activeGoals.length > 0 ? (
              <View style={{ gap: HeliosSpacing.sm, paddingRight: 28 }}>
                {activeGoals.slice(0, 3).map((goal) => (
                  <View key={goal.goal_id}>
                    <Text
                      style={{
                        ...HeliosTypography.metricSmall,
                        color: HeliosColors.textOnCard,
                      }}
                    >
                      {`${goal.goal_type.toUpperCase()} · ${goal.target_value} ${goal.target_unit}`}
                    </Text>
                    <Text
                      style={{
                        ...HeliosTypography.label,
                        color: HeliosColors.textOnCardMuted,
                        marginTop: 2,
                      }}
                    >
                      {`${goal.start_date} → ${goal.end_date}`}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text
                style={{
                  ...HeliosTypography.bodySmall,
                  color: HeliosColors.textOnCardMuted,
                  textAlign: 'center',
                  paddingVertical: HeliosSpacing.md,
                }}
              >
                {'No active goals'}
              </Text>
            )}
          </BrutalistCard>

          <BrutalistCard verticalText="TRAIN">
            <View style={{ gap: HeliosSpacing.sm, paddingRight: 28 }}>
              <View>
                <Text
                  style={{
                    ...HeliosTypography.label,
                    color: HeliosColors.textOnCardMuted,
                  }}
                >
                  {'LATEST STRENGTH'}
                </Text>
                <Text
                  style={{
                    ...HeliosTypography.metricSmall,
                    color: HeliosColors.textOnCard,
                    marginTop: 2,
                  }}
                >
                  {latestStrength
                    ? `${latestStrength.name} · ${strengthSetCount} sets`
                    : 'No strength sessions'}
                </Text>
                {latestStrength ? (
                  <Text
                    style={{
                      ...HeliosTypography.label,
                      color: HeliosColors.textOnCardMuted,
                      marginTop: 2,
                    }}
                  >
                    {formatShortDate(latestStrength.start_time).toUpperCase()}
                  </Text>
                ) : null}
              </View>

              <View>
                <Text
                  style={{
                    ...HeliosTypography.label,
                    color: HeliosColors.textOnCardMuted,
                  }}
                >
                  {'LATEST BREATHWORK'}
                </Text>
                <Text
                  style={{
                    ...HeliosTypography.metricSmall,
                    color: HeliosColors.textOnCard,
                    marginTop: 2,
                  }}
                >
                  {latestBreathwork
                    ? `${latestBreathwork.pattern} · ${latestBreathwork.cycles ?? 0} cycles`
                    : 'No breathwork sessions'}
                </Text>
                {latestBreathwork ? (
                  <Text
                    style={{
                      ...HeliosTypography.label,
                      color: HeliosColors.textOnCardMuted,
                      marginTop: 2,
                    }}
                  >
                    {formatShortDate(latestBreathwork.start_time).toUpperCase()}
                  </Text>
                ) : null}
              </View>
            </View>
          </BrutalistCard>
        </View>
      </Animated.View>
    </ScrollView>
  );
}
