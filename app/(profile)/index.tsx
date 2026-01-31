import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Link } from 'expo-router';
import { useFitnessData } from '@/hooks/use-fitness-data';
import { useComputedStats } from '@/hooks/use-computed-stats';
import {
  HeliosColors,
  HeliosTypography,
  HeliosSpacing,
} from '@/constants/theme';
import { BrutalistCard } from '@/components/ui/brutalist-card';
import { MetricBlock } from '@/components/ui/metric-block';
import { DottedDivider } from '@/components/ui/dotted-divider';
import { SectionHeader } from '@/components/ui/section-header';
import { DecorativeBarcode } from '@/components/ui/decorative-barcode';
import {
  formatNumber,
  formatDistance,
  formatCalories,
} from '@/lib/format-utils';
import { formatDurationSeconds } from '@/lib/date-utils';
import { sportTypeName, sportTypeIcon } from '@/lib/sport-types';
import { ScoreRing } from '@/components/ui/score-ring';
import { getRecoveryColor } from '@/lib/recovery';
import { getStrainColor } from '@/lib/strain';
import { getVO2MaxColor } from '@/lib/vo2max';

function calculateAge(birthday: string): number {
  // birthday format: "YYYY-MM"
  const [yearStr, monthStr] = birthday.split('-');
  const birthYear = parseInt(yearStr, 10);
  const birthMonth = parseInt(monthStr, 10);
  const now = new Date();
  let age = now.getFullYear() - birthYear;
  if (now.getMonth() + 1 < birthMonth) {
    age--;
  }
  return age;
}

function genderLabel(gender: number): string {
  switch (gender) {
    case 1:
      return 'Male';
    case 2:
      return 'Female';
    default:
      return 'Other';
  }
}

interface SportGroupSummary {
  type: number;
  name: string;
  icon: string;
  count: number;
  totalTime: number; // seconds
  totalDistance: number; // meters
  totalCalories: number;
}

export default function ProfileScreen() {
  const { user, body, sport, recoveryDaily, strainDaily } = useFitnessData();
  const {
    totalSteps,
    totalDistance,
    totalCalories,
    totalSleepHours,
    totalWorkouts,
    totalWorkoutMinutes,
    todayRecovery,
    todayStrain,
    todaySleepScore,
    vo2MaxEstimate,
    avgRecovery7d,
    avgStrain7d,
    avgSleepScore7d,
  } = useComputedStats();

  const profile = user.length > 0 ? user[0] : null;
  const bodyData = body.length > 0 ? body[0] : null;

  const age = profile ? calculateAge(profile.birthday) : null;

  const latestRecovery = useMemo(() => {
    if (recoveryDaily.length === 0) return null;
    return recoveryDaily.reduce((latest, row) =>
      row.date > latest.date ? row : latest,
    );
  }, [recoveryDaily]);

  const latestStrain = useMemo(() => {
    if (strainDaily.length === 0) return null;
    return strainDaily.reduce((latest, row) =>
      row.date > latest.date ? row : latest,
    );
  }, [strainDaily]);

  // Body composition values -- only show non-null
  const bodyComposition = useMemo(() => {
    if (!bodyData) return [];
    const fields: { key: keyof typeof bodyData; label: string; unit: string }[] = [
      { key: 'fatRate', label: 'BODY FAT', unit: '%' },
      { key: 'bodyWaterRate', label: 'BODY WATER', unit: '%' },
      { key: 'muscleRate', label: 'MUSCLE', unit: '%' },
      { key: 'metabolism', label: 'METABOLISM', unit: 'kcal' },
      { key: 'boneMass', label: 'BONE MASS', unit: 'kg' },
      { key: 'visceralFat', label: 'VISCERAL FAT', unit: '' },
    ];
    return fields
      .filter((f) => bodyData[f.key] != null)
      .map((f) => ({
        label: f.label,
        value: `${bodyData[f.key]}${f.unit ? ` ${f.unit}` : ''}`,
      }));
  }, [bodyData]);

  // Sport groups
  const sportGroups = useMemo((): SportGroupSummary[] => {
    const map = new Map<number, SportGroupSummary>();
    for (const s of sport) {
      const existing = map.get(s.type);
      if (existing) {
        existing.count++;
        existing.totalTime += s.sportTime;
        existing.totalDistance += s.distance;
        existing.totalCalories += s.calories;
      } else {
        map.set(s.type, {
          type: s.type,
          name: sportTypeName(s.type),
          icon: sportTypeIcon(s.type),
          count: 1,
          totalTime: s.sportTime,
          totalDistance: s.distance,
          totalCalories: s.calories,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [sport]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: HeliosColors.background }}
      contentContainerStyle={{
        padding: HeliosSpacing.screenPadding,
        paddingBottom: HeliosSpacing.xxl + 40,
      }}
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* Title */}
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text
          style={{
            ...HeliosTypography.heroTitle,
            color: HeliosColors.textPrimary,
            marginBottom: HeliosSpacing.lg,
            marginTop: HeliosSpacing.xxl,
          }}
        >
          {'PROFILE'}
        </Text>
      </Animated.View>

      {/* User info card */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)}>
      {profile ? (
        <BrutalistCard
          accentDot
          style={{ marginBottom: HeliosSpacing.cardGap }}
        >
          <Text
            style={{
              fontFamily: HeliosTypography.heroTitle.fontFamily,
              fontSize: 36,
              lineHeight: 40,
              color: HeliosColors.textOnCard,
              marginBottom: HeliosSpacing.sm,
            }}
          >
            {profile.nickName}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: HeliosSpacing.lg,
              marginBottom: HeliosSpacing.md,
            }}
          >
            {age !== null ? (
              <View>
                <Text
                  style={{
                    ...HeliosTypography.metricMedium,
                    color: HeliosColors.textOnCard,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {`${age}`}
                </Text>
                <Text
                  style={{
                    ...HeliosTypography.label,
                    color: HeliosColors.textOnCardMuted,
                    marginTop: 2,
                  }}
                >
                  {'AGE'}
                </Text>
              </View>
            ) : null}
            <View>
              <Text
                style={{
                  ...HeliosTypography.metricMedium,
                  color: HeliosColors.textOnCard,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {`${profile.height}`}
              </Text>
              <Text
                style={{
                  ...HeliosTypography.label,
                  color: HeliosColors.textOnCardMuted,
                  marginTop: 2,
                }}
              >
                {'HEIGHT CM'}
              </Text>
            </View>
            <View>
              <Text
                style={{
                  ...HeliosTypography.metricMedium,
                  color: HeliosColors.textOnCard,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {`${profile.weight}`}
              </Text>
              <Text
                style={{
                  ...HeliosTypography.label,
                  color: HeliosColors.textOnCardMuted,
                  marginTop: 2,
                }}
              >
                {'WEIGHT KG'}
              </Text>
            </View>
            <View>
              <Text
                style={{
                  ...HeliosTypography.metricMedium,
                  color: HeliosColors.textOnCard,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {genderLabel(profile.gender)}
              </Text>
              <Text
                style={{
                  ...HeliosTypography.label,
                  color: HeliosColors.textOnCardMuted,
                  marginTop: 2,
                }}
              >
                {'GENDER'}
              </Text>
            </View>
          </View>
          <DecorativeBarcode width={180} height={28} label="USER ID" />
        </BrutalistCard>
      ) : (
        <View style={{ marginBottom: HeliosSpacing.cardGap }}>
          <Text
            style={{
              ...HeliosTypography.body,
              color: HeliosColors.textSecondary,
            }}
          >
            {'No user data available.'}
          </Text>
        </View>
      )}
      </Animated.View>

      {/* Insights - Recovery & Strain */}
      <View style={{ marginTop: HeliosSpacing.lg }}>
        <SectionHeader title="INSIGHTS" subtitle="Recovery + Strain" />
        <View style={{ marginTop: HeliosSpacing.md }}>
          <BrutalistCard accentDot verticalText="TODAY">
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingRight: 28, paddingVertical: HeliosSpacing.sm }}>
              <ScoreRing
                value={todayRecovery?.score ?? 0}
                max={100}
                size={80}
                strokeWidth={6}
                color={getRecoveryColor(todayRecovery?.level ?? 'red')}
                label="RECOVERY"
              />
              <ScoreRing
                value={todayStrain?.strain ?? 0}
                max={21}
                size={80}
                strokeWidth={6}
                color={getStrainColor(todayStrain?.level ?? 'rest')}
                label="STRAIN"
              />
            </View>
          </BrutalistCard>
        </View>
      </View>

      {vo2MaxEstimate ? (
        <View style={{ marginTop: HeliosSpacing.lg }}>
          <SectionHeader title="VO2 MAX" subtitle="ESTIMATED" />
          <View style={{ marginTop: HeliosSpacing.md }}>
            <BrutalistCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: HeliosSpacing.lg }}>
                <View>
                  <Text style={{ ...HeliosTypography.metricLarge, color: getVO2MaxColor(vo2MaxEstimate.classification), fontVariant: ['tabular-nums'] }}>
                    {`${vo2MaxEstimate.vo2max}`}
                  </Text>
                  <Text style={{ ...HeliosTypography.label, color: HeliosColors.textOnCardMuted, marginTop: 2 }}>
                    {'ML/KG/MIN'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ ...HeliosTypography.cardTitle, color: HeliosColors.textOnCard }}>
                    {vo2MaxEstimate.classification}
                  </Text>
                  <Text style={{ ...HeliosTypography.metricSmall, color: HeliosColors.textOnCardMuted, fontVariant: ['tabular-nums'], marginTop: HeliosSpacing.xs }}>
                    {`Top ${100 - vo2MaxEstimate.percentile}%`}
                  </Text>
                </View>
              </View>
            </BrutalistCard>
          </View>
        </View>
      ) : null}

      {(avgRecovery7d !== null || avgStrain7d !== null || avgSleepScore7d !== null) ? (
        <View style={{ marginTop: HeliosSpacing.lg }}>
          <SectionHeader title="7-DAY AVERAGES" />
          <View style={{ marginTop: HeliosSpacing.md }}>
            <BrutalistCard>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: HeliosSpacing.md }}>
                {avgRecovery7d !== null ? (
                  <View style={{ width: '30%' }}>
                    <MetricBlock value={`${avgRecovery7d}`} label="RECOVERY" size="medium" onCard />
                  </View>
                ) : null}
                {avgStrain7d !== null ? (
                  <View style={{ width: '30%' }}>
                    <MetricBlock value={`${avgStrain7d}`} label="STRAIN" size="medium" onCard />
                  </View>
                ) : null}
                {avgSleepScore7d !== null ? (
                  <View style={{ width: '30%' }}>
                    <MetricBlock value={`${avgSleepScore7d}`} label="SLEEP" size="medium" onCard />
                  </View>
                ) : null}
              </View>
            </BrutalistCard>
          </View>
        </View>
      ) : null}

      {/* Body Stats card */}
      {bodyData ? (
        <>
          <SectionHeader title="BODY STATS" />
          <BrutalistCard
            style={{ marginTop: HeliosSpacing.md, marginBottom: HeliosSpacing.cardGap }}
            verticalText="COMPOSITION"
          >
            <MetricBlock
              value={bodyData.bmi.toFixed(1)}
              label="BMI"
              size="large"
              onCard
            />
            {bodyComposition.length > 0 ? (
              <>
                <View
                  style={{
                    height: 1,
                    backgroundColor: HeliosColors.lineOnCard,
                    marginVertical: HeliosSpacing.md,
                  }}
                />
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: HeliosSpacing.md,
                    paddingRight: 28,
                  }}
                >
                  {bodyComposition.map((item) => (
                    <View key={item.label} style={{ width: '45%' }}>
                      <MetricBlock
                        value={item.value}
                        label={item.label}
                        size="small"
                        onCard
                      />
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </BrutalistCard>
        </>
      ) : null}

      <DottedDivider />

      {/* Lifetime Stats */}
      <View style={{ marginTop: HeliosSpacing.lg }}>
        <SectionHeader title="LIFETIME STATS" />
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: HeliosSpacing.md,
            marginTop: HeliosSpacing.md,
          }}
        >
          <View style={{ width: '45%' }}>
            <MetricBlock
              value={formatNumber(totalSteps)}
              label="TOTAL STEPS"
              size="medium"
            />
          </View>
          <View style={{ width: '45%' }}>
            <MetricBlock
              value={formatDistance(totalDistance)}
              label="TOTAL DISTANCE"
              size="medium"
            />
          </View>
          <View style={{ width: '45%' }}>
            <MetricBlock
              value={formatCalories(totalCalories)}
              label="TOTAL CALORIES"
              size="medium"
            />
          </View>
          <View style={{ width: '45%' }}>
            <MetricBlock
              value={`${formatNumber(Math.round(totalSleepHours))} hrs`}
              label="TOTAL SLEEP"
              size="medium"
            />
          </View>
          <View style={{ width: '45%' }}>
            <MetricBlock
              value={`${totalWorkouts}`}
              label="TOTAL WORKOUTS"
              size="medium"
            />
          </View>
          <View style={{ width: '45%' }}>
            <MetricBlock
              value={`${formatNumber(Math.round(totalWorkoutMinutes / 60))} hrs`}
              label="WORKOUT TIME"
              size="medium"
            />
          </View>
        </View>
      </View>

      <View style={{ marginTop: HeliosSpacing.lg }}>
        <DottedDivider />
      </View>

      {/* Workouts / Sport Breakdown */}
      {sportGroups.length > 0 ? (
        <View style={{ marginTop: HeliosSpacing.lg }}>
          <SectionHeader title="WORKOUTS" subtitle={`${totalWorkouts} SESSIONS`} />
          <View style={{ marginTop: HeliosSpacing.md, gap: HeliosSpacing.cardGap }}>
            {sportGroups.map((group) => (
              <Link
                key={group.type}
                href={`/(profile)/sport/${group.type}`}
                asChild
              >
                <BrutalistCard
                  onPress={() => {}}
                  verticalText={group.name.toUpperCase()}
                >
                  <View style={{ paddingRight: 28 }}>
                    <Text
                      style={{
                        ...HeliosTypography.cardTitle,
                        color: HeliosColors.textOnCard,
                        marginBottom: HeliosSpacing.sm,
                      }}
                    >
                      {group.name}
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: HeliosSpacing.md,
                      }}
                    >
                      <MetricBlock
                        value={`${group.count}`}
                        label="SESSIONS"
                        size="small"
                        onCard
                      />
                      <MetricBlock
                        value={formatDurationSeconds(group.totalTime)}
                        label="TOTAL TIME"
                        size="small"
                        onCard
                      />
                      {group.totalDistance > 0 ? (
                        <MetricBlock
                          value={formatDistance(group.totalDistance)}
                          label="DISTANCE"
                          size="small"
                          onCard
                        />
                      ) : null}
                      <MetricBlock
                        value={formatCalories(group.totalCalories)}
                        label="CALORIES"
                        size="small"
                        onCard
                      />
                    </View>
                  </View>
                </BrutalistCard>
              </Link>
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}
