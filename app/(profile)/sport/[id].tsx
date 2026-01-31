import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFitnessData } from '@/hooks/use-fitness-data';
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
  formatPace,
} from '@/lib/format-utils';
import {
  formatDurationSeconds,
  formatShortDate,
} from '@/lib/date-utils';
import { sportTypeName } from '@/lib/sport-types';
import type { Sport } from '@/lib/data-types';

async function triggerHaptic() {
  if (Platform.OS === 'ios') {
    try {
      const Haptics = await import('expo-haptics');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  }
}

export default function SportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { sport } = useFitnessData();

  const sportType = parseInt(id ?? '0', 10);
  const typeName = sportTypeName(sportType);

  // Filter sessions by type
  const sessions = useMemo(
    () => sport.filter((s) => s.type === sportType),
    [sport, sportType],
  );

  // Aggregate stats
  const aggregates = useMemo(() => {
    const totalSessions = sessions.length;
    const totalTime = sessions.reduce((sum, s) => sum + s.sportTime, 0);
    const totalDist = sessions.reduce((sum, s) => sum + s.distance, 0);
    const totalCal = sessions.reduce((sum, s) => sum + s.calories, 0);
    return { totalSessions, totalTime, totalDist, totalCal };
  }, [sessions]);

  // Sort sessions by date descending
  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => b.startTime.localeCompare(a.startTime)),
    [sessions],
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: HeliosColors.background }}
      contentContainerStyle={{
        padding: HeliosSpacing.screenPadding,
        paddingBottom: HeliosSpacing.xxl + 40,
      }}
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* Back button */}
      <Pressable
        onPress={() => { triggerHaptic(); router.back(); }}
        style={{
          marginTop: HeliosSpacing.xxl,
          marginBottom: HeliosSpacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="chevron-back" size={16} color={HeliosColors.accent} />
          <Text
            style={{
              ...HeliosTypography.label,
              color: HeliosColors.accent,
            }}
          >
            {'BACK'}
          </Text>
        </View>
      </Pressable>

      {/* Title */}
      <Text
        style={{
          ...HeliosTypography.heroTitle,
          color: HeliosColors.textPrimary,
          marginBottom: HeliosSpacing.xs,
        }}
      >
        {typeName.toUpperCase()}
      </Text>
      <Text
        style={{
          ...HeliosTypography.label,
          color: HeliosColors.textSecondary,
          marginBottom: HeliosSpacing.lg,
        }}
      >
        {`${aggregates.totalSessions} SESSIONS`}
      </Text>

      {/* Empty state */}
      {sessions.length === 0 ? (
        <View
          style={{
            paddingVertical: HeliosSpacing.xxl,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              ...HeliosTypography.body,
              color: HeliosColors.textSecondary,
            }}
          >
            {'No sessions found for this sport type.'}
          </Text>
        </View>
      ) : (
        <>
          {/* Aggregate stats */}
          <BrutalistCard
            accentDot
            style={{ marginBottom: HeliosSpacing.lg }}
            verticalText="TOTALS"
          >
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
                  value={`${aggregates.totalSessions}`}
                  label="SESSIONS"
                  size="medium"
                  onCard
                />
              </View>
              <View style={{ width: '45%' }}>
                <MetricBlock
                  value={formatDurationSeconds(aggregates.totalTime)}
                  label="TOTAL TIME"
                  size="medium"
                  onCard
                />
              </View>
              {aggregates.totalDist > 0 ? (
                <View style={{ width: '45%' }}>
                  <MetricBlock
                    value={formatDistance(aggregates.totalDist)}
                    label="TOTAL DISTANCE"
                    size="medium"
                    onCard
                  />
                </View>
              ) : null}
              <View style={{ width: '45%' }}>
                <MetricBlock
                  value={formatCalories(aggregates.totalCal)}
                  label="TOTAL CALORIES"
                  size="medium"
                  onCard
                />
              </View>
            </View>
            <View style={{ marginTop: HeliosSpacing.md }}>
              <DecorativeBarcode
                width={160}
                height={24}
                label={typeName.toUpperCase()}
              />
            </View>
          </BrutalistCard>

          <DottedDivider />

          {/* Individual sessions list */}
          <View style={{ marginTop: HeliosSpacing.lg }}>
            <SectionHeader
              title="ALL SESSIONS"
              subtitle={`SORTED BY DATE`}
            />
            <View style={{ marginTop: HeliosSpacing.md, gap: HeliosSpacing.cardGap }}>
              {sortedSessions.map((session: Sport, index: number) => {
                const dateStr = session.startTime.slice(0, 10);
                return (
                  <BrutalistCard key={`${session.startTime}-${index}`}>
                    <View style={{ paddingRight: 4 }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: HeliosSpacing.sm,
                        }}
                      >
                        <Text
                          style={{
                            ...HeliosTypography.cardTitle,
                            color: HeliosColors.textOnCard,
                          }}
                        >
                          {formatShortDate(dateStr)}
                        </Text>
                        <Text
                          style={{
                            ...HeliosTypography.label,
                            color: HeliosColors.textOnCardMuted,
                          }}
                        >
                          {formatDurationSeconds(session.sportTime)}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: 'row',
                          flexWrap: 'wrap',
                          gap: HeliosSpacing.md,
                        }}
                      >
                        {session.distance > 0 ? (
                          <MetricBlock
                            value={formatDistance(session.distance)}
                            label="DISTANCE"
                            size="small"
                            onCard
                          />
                        ) : null}
                        {session.avgPace > 0 && session.distance > 0 ? (
                          <MetricBlock
                            value={formatPace(session.avgPace)}
                            label="AVG PACE"
                            size="small"
                            onCard
                          />
                        ) : null}
                        <MetricBlock
                          value={formatCalories(session.calories)}
                          label="CALORIES"
                          size="small"
                          onCard
                        />
                      </View>
                    </View>
                  </BrutalistCard>
                );
              })}
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}
