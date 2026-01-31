import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, TextInput } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useFitnessData } from '@/hooks/use-fitness-data';
import { useComputedStats } from '@/hooks/use-computed-stats';
import {
  HeliosColors,
  HeliosFonts,
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
import { CARD_RIPPLE, PRESS_SCALE } from '@/lib/press-styles';
import { triggerHaptic } from '@/lib/haptics';
import type { User } from '@/lib/data-types';

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
  const { user, body, sport, recoveryDaily, strainDaily, dataSource, updateProfile } = useFitnessData();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editBirthday, setEditBirthday] = useState('');
  const [editGender, setEditGender] = useState(0);
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

  function openEditModal() {
    setEditName(profile?.nickName ?? '');
    setEditHeight(profile?.height ? `${profile.height}` : '');
    setEditWeight(profile?.weight ? `${profile.weight}` : '');
    setEditBirthday(profile?.birthday ?? '');
    setEditGender(profile?.gender ?? 0);
    setEditModalVisible(true);
    triggerHaptic();
  }

  async function handleSaveProfile() {
    const updated: User = {
      userId: profile?.userId ?? 'local',
      nickName: editName.trim() || 'User',
      height: parseFloat(editHeight) || 0,
      weight: parseFloat(editWeight) || 0,
      birthday: editBirthday.trim(),
      gender: editGender,
      avatar: profile?.avatar ?? '',
    };
    await updateProfile(updated);
    setEditModalVisible(false);
    triggerHaptic();
  }

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
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: HeliosSpacing.sm,
            marginTop: HeliosSpacing.xs,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor:
                dataSource === 'health-connect'
                  ? HeliosColors.accent
                  : HeliosColors.textSecondary,
            }}
          />
          <Text
            style={{
              ...HeliosTypography.label,
              color: HeliosColors.textSecondary,
            }}
          >
            {dataSource === 'health-connect' ? 'HEALTH CONNECT' : 'LOCAL CSV'}
          </Text>
        </View>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: HeliosSpacing.sm }}>
            <DecorativeBarcode width={140} height={28} label="USER ID" />
            <Pressable
              onPress={openEditModal}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingVertical: HeliosSpacing.xs,
                paddingHorizontal: HeliosSpacing.sm,
              }}
            >
              <Ionicons name="create-sharp" size={14} color={HeliosColors.textOnCardMuted} />
              <Text style={{ ...HeliosTypography.label, color: HeliosColors.textOnCardMuted }}>
                {'EDIT'}
              </Text>
            </Pressable>
          </View>
        </BrutalistCard>
      ) : (
        <Pressable onPress={openEditModal}>
          <BrutalistCard style={{ marginBottom: HeliosSpacing.cardGap }}>
            <View style={{ alignItems: 'center', paddingVertical: HeliosSpacing.lg }}>
              <Ionicons name="person-add-sharp" size={32} color={HeliosColors.accent} />
              <Text
                style={{
                  ...HeliosTypography.cardTitle,
                  color: HeliosColors.textOnCard,
                  marginTop: HeliosSpacing.md,
                }}
              >
                {'SET UP PROFILE'}
              </Text>
              <Text
                style={{
                  ...HeliosTypography.bodySmall,
                  color: HeliosColors.textOnCardMuted,
                  marginTop: HeliosSpacing.xs,
                  textAlign: 'center',
                }}
              >
                {'Tap to add your name, height, weight, and birthday.'}
              </Text>
            </View>
          </BrutalistCard>
        </Pressable>
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
                <Pressable
                  android_ripple={CARD_RIPPLE}
                  style={({ pressed }) => ({
                    borderRadius: HeliosSpacing.cardRadius,
                    overflow: 'hidden' as const,
                    opacity: pressed ? 0.92 : 1,
                    transform: [{ scale: pressed ? PRESS_SCALE : 1 }],
                  })}
                >
                  <BrutalistCard
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
                </Pressable>
              </Link>
            ))}
          </View>
        </View>
      ) : null}

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: HeliosColors.cardLight,
              borderTopLeftRadius: HeliosSpacing.cardRadius * 2,
              borderTopRightRadius: HeliosSpacing.cardRadius * 2,
              padding: HeliosSpacing.screenPadding,
              paddingBottom: HeliosSpacing.xxl,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: HeliosSpacing.lg }}>
              <Text style={{ ...HeliosTypography.sectionTitle, color: HeliosColors.textOnCard }}>
                {'EDIT PROFILE'}
              </Text>
              <Pressable onPress={() => setEditModalVisible(false)} hitSlop={12}>
                <Ionicons name="close-sharp" size={24} color={HeliosColors.textOnCard} />
              </Pressable>
            </View>

            <ProfileField label="NAME" value={editName} onChangeText={setEditName} />
            <ProfileField label="HEIGHT (CM)" value={editHeight} onChangeText={setEditHeight} keyboardType="numeric" />
            <ProfileField label="WEIGHT (KG)" value={editWeight} onChangeText={setEditWeight} keyboardType="numeric" />
            <ProfileField label="BIRTHDAY (YYYY-MM)" value={editBirthday} onChangeText={setEditBirthday} placeholder="1995-06" />

            <Text style={{ ...HeliosTypography.label, color: HeliosColors.textOnCardMuted, marginBottom: HeliosSpacing.sm, marginTop: HeliosSpacing.md }}>
              {'GENDER'}
            </Text>
            <View style={{ flexDirection: 'row', gap: HeliosSpacing.sm, marginBottom: HeliosSpacing.lg }}>
              {[
                { value: 1, label: 'MALE' },
                { value: 2, label: 'FEMALE' },
                { value: 0, label: 'OTHER' },
              ].map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => setEditGender(opt.value)}
                  style={{
                    flex: 1,
                    paddingVertical: HeliosSpacing.sm,
                    borderRadius: HeliosSpacing.sm,
                    backgroundColor: editGender === opt.value ? HeliosColors.accent : HeliosColors.cardBorder,
                    alignItems: 'center',
                    borderCurve: 'continuous',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: HeliosFonts.mono,
                      fontSize: 12,
                      letterSpacing: 1,
                      color: editGender === opt.value ? HeliosColors.background : HeliosColors.textOnCardMuted,
                    }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={handleSaveProfile}
              style={{
                backgroundColor: HeliosColors.accent,
                paddingVertical: HeliosSpacing.md,
                borderRadius: HeliosSpacing.sm,
                alignItems: 'center',
                borderCurve: 'continuous',
              }}
            >
              <Text
                style={{
                  fontFamily: HeliosFonts.mono,
                  fontSize: 14,
                  fontWeight: '600',
                  letterSpacing: 1.5,
                  color: HeliosColors.background,
                }}
              >
                {'SAVE PROFILE'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Profile field component
// ---------------------------------------------------------------------------

function ProfileField({
  label,
  value,
  onChangeText,
  keyboardType,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: 'default' | 'numeric';
  placeholder?: string;
}) {
  return (
    <View style={{ marginBottom: HeliosSpacing.md }}>
      <Text
        style={{
          fontFamily: HeliosFonts.mono,
          fontSize: 11,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: HeliosColors.textOnCardMuted,
          marginBottom: HeliosSpacing.xs,
        }}
      >
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? 'default'}
        placeholder={placeholder}
        placeholderTextColor={HeliosColors.textOnCardMuted}
        style={{
          fontFamily: HeliosFonts.mono,
          fontSize: 16,
          color: HeliosColors.textOnCard,
          backgroundColor: HeliosColors.cardBorder,
          paddingHorizontal: HeliosSpacing.md,
          paddingVertical: HeliosSpacing.sm + 2,
          borderRadius: HeliosSpacing.sm,
          borderCurve: 'continuous',
        }}
      />
    </View>
  );
}
