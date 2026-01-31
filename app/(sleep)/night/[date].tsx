import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFitnessData } from '@/hooks/use-fitness-data';
import { BrutalistCard } from '@/components/ui/brutalist-card';
import { MetricBlock } from '@/components/ui/metric-block';
import { DottedDivider } from '@/components/ui/dotted-divider';
import { SectionHeader } from '@/components/ui/section-header';
import SleepStageTimeline from '@/components/charts/sleep-stage-timeline';
import {
  HeliosColors,
  HeliosTypography,
  HeliosSpacing,
} from '@/constants/theme';
import { formatDuration, formatFullDate } from '@/lib/date-utils';
import { triggerHaptic } from '@/lib/haptics';
import { ACCENT_RIPPLE } from '@/lib/press-styles';

const screenWidth = Dimensions.get('window').width;

export default function SleepNightDetailScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const { sleep, getSleepMinutesForNight } = useFitnessData();

  const dateStr = date ?? '';

  // Find this night's sleep record
  const nightData = useMemo(
    () => sleep.find((s) => s.date === dateStr) ?? null,
    [sleep, dateStr],
  );

  // Per-minute sleep stages for timeline
  const sleepMinutes = useMemo(
    () => getSleepMinutesForNight(dateStr),
    [getSleepMinutesForNight, dateStr],
  );

  // Compute stage durations
  const totalSleep = nightData
    ? nightData.deepSleepTime + nightData.shallowSleepTime + nightData.REMTime
    : 0;

  const totalWithWake = nightData
    ? totalSleep + nightData.wakeTime
    : 0;

  // HR stats from sleep minute data
  const hrStats = useMemo(() => {
    const hrs = sleepMinutes.filter((m) => m.hr > 0).map((m) => m.hr);
    if (hrs.length === 0) return { min: 0, avg: 0, max: 0 };
    const min = Math.min(...hrs);
    const max = Math.max(...hrs);
    const avg = Math.round(hrs.reduce((s, h) => s + h, 0) / hrs.length);
    return { min, avg, max };
  }, [sleepMinutes]);

  // Format ISO datetime to display time
  function formatBedWakeTime(isoStr: string): string {
    if (!isoStr) return '--:--';
    try {
      const d = new Date(isoStr);
      const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
      const displayH = d.getHours() % 12 === 0 ? 12 : d.getHours() % 12;
      const m = d.getMinutes().toString().padStart(2, '0');
      return `${displayH}:${m} ${ampm}`;
    } catch {
      return '--:--';
    }
  }

  // Timeline width available
  const timelineWidth = screenWidth - HeliosSpacing.screenPadding * 2;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: HeliosColors.background }}
      contentContainerStyle={{ paddingBottom: HeliosSpacing.xxl + 40 }}
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* Back button + Header */}
      <View
        style={{
          paddingHorizontal: HeliosSpacing.screenPadding,
          paddingTop: 60,
          paddingBottom: HeliosSpacing.md,
        }}
      >
        <Pressable
          onPress={() => { triggerHaptic(); router.back(); }}
          android_ripple={ACCENT_RIPPLE}
          style={({ pressed }) => ({
            alignSelf: 'flex-start',
            paddingVertical: HeliosSpacing.xs,
            paddingRight: HeliosSpacing.md,
            opacity: pressed ? 0.6 : 1,
            marginBottom: HeliosSpacing.sm,
            borderRadius: 8,
          })}
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

        <Text
          style={{
            ...HeliosTypography.heroTitle,
            color: HeliosColors.textPrimary,
          }}
        >
          {'SLEEP'}
        </Text>
        <Text
          style={{
            ...HeliosTypography.body,
            color: HeliosColors.textSecondary,
            marginTop: HeliosSpacing.xs,
          }}
        >
          {formatFullDate(dateStr)}
        </Text>
        <View
          style={{
            width: 48,
            height: 4,
            backgroundColor: HeliosColors.sleepDeep,
            marginTop: HeliosSpacing.sm,
          }}
        />
      </View>

      {/* Night Summary Card */}
      <View
        style={{
          paddingHorizontal: HeliosSpacing.screenPadding,
          marginBottom: HeliosSpacing.lg,
        }}
      >
        <BrutalistCard accentDot verticalText="night">
          <View style={{ paddingRight: 36 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: HeliosSpacing.md,
              }}
            >
              <Text
                style={{
                  ...HeliosTypography.cardTitle,
                  color: HeliosColors.textOnCard,
                }}
              >
                {'Total Sleep Time'}
              </Text>
              <Text
                style={{
                  ...HeliosTypography.metricLarge,
                  color: HeliosColors.textOnCard,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {formatDuration(totalSleep)}
              </Text>
            </View>

            {/* Bed and Wake Times */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: HeliosSpacing.md,
                paddingBottom: HeliosSpacing.md,
                borderBottomWidth: 1,
                borderBottomColor: HeliosColors.lineOnCard,
              }}
            >
              <View>
                <Text
                  style={{
                    ...HeliosTypography.label,
                    color: HeliosColors.textOnCardMuted,
                    marginBottom: 2,
                  }}
                >
                  {'BEDTIME'}
                </Text>
                <Text
                  style={{
                    ...HeliosTypography.metricMedium,
                    color: HeliosColors.textOnCard,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {formatBedWakeTime(nightData?.start ?? '')}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={{
                    ...HeliosTypography.label,
                    color: HeliosColors.textOnCardMuted,
                    marginBottom: 2,
                  }}
                >
                  {'WAKE UP'}
                </Text>
                <Text
                  style={{
                    ...HeliosTypography.metricMedium,
                    color: HeliosColors.textOnCard,
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {formatBedWakeTime(nightData?.stop ?? '')}
                </Text>
              </View>
            </View>

            {/* In-bed duration */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  ...HeliosTypography.label,
                  color: HeliosColors.textOnCardMuted,
                }}
              >
                {'TIME IN BED'}
              </Text>
              <Text
                style={{
                  ...HeliosTypography.metricSmall,
                  color: HeliosColors.textOnCard,
                  fontVariant: ['tabular-nums'],
                }}
              >
                {formatDuration(totalWithWake)}
              </Text>
            </View>
          </View>
        </BrutalistCard>
      </View>

      {/* Stage Durations as MetricBlocks */}
      <View
        style={{
          paddingHorizontal: HeliosSpacing.screenPadding,
          marginBottom: HeliosSpacing.lg,
        }}
      >
        <SectionHeader title="Sleep Stages" subtitle="Duration per stage" />
        <View style={{ marginTop: HeliosSpacing.md }}>
          <BrutalistCard>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                gap: HeliosSpacing.md,
              }}
            >
              <View style={{ alignItems: 'center', minWidth: 70 }}>
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    borderCurve: 'continuous',
                    backgroundColor: HeliosColors.sleepDeep,
                    marginBottom: HeliosSpacing.xs,
                  }}
                />
                <MetricBlock
                  value={formatDuration(nightData?.deepSleepTime ?? 0)}
                  label="Deep"
                  size="medium"
                  onCard
                  color={HeliosColors.sleepDeep}
                />
              </View>
              <View style={{ alignItems: 'center', minWidth: 70 }}>
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    borderCurve: 'continuous',
                    backgroundColor: HeliosColors.sleepLight,
                    marginBottom: HeliosSpacing.xs,
                  }}
                />
                <MetricBlock
                  value={formatDuration(nightData?.shallowSleepTime ?? 0)}
                  label="Light"
                  size="medium"
                  onCard
                  color={HeliosColors.sleepLight}
                />
              </View>
              <View style={{ alignItems: 'center', minWidth: 70 }}>
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    borderCurve: 'continuous',
                    backgroundColor: HeliosColors.sleepREM,
                    marginBottom: HeliosSpacing.xs,
                  }}
                />
                <MetricBlock
                  value={formatDuration(nightData?.REMTime ?? 0)}
                  label="REM"
                  size="medium"
                  onCard
                  color={HeliosColors.sleepREM}
                />
              </View>
              <View style={{ alignItems: 'center', minWidth: 70 }}>
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    borderCurve: 'continuous',
                    backgroundColor: HeliosColors.wakeOrange,
                    marginBottom: HeliosSpacing.xs,
                  }}
                />
                <MetricBlock
                  value={formatDuration(nightData?.wakeTime ?? 0)}
                  label="Wake"
                  size="medium"
                  onCard
                  color={HeliosColors.wakeOrange}
                />
              </View>
            </View>
          </BrutalistCard>
        </View>
      </View>

      <View style={{ paddingHorizontal: HeliosSpacing.screenPadding, marginBottom: HeliosSpacing.lg }}>
        <DottedDivider />
      </View>

      {/* Sleep Stage Timeline */}
      <View
        style={{
          paddingHorizontal: HeliosSpacing.screenPadding,
          marginBottom: HeliosSpacing.lg,
        }}
      >
        <SectionHeader
          title="Stage Timeline"
          subtitle="Minute-by-minute sleep stages"
        />
        <View style={{ marginTop: HeliosSpacing.md }}>
          {sleepMinutes.length > 0 ? (
            <SleepStageTimeline
              stages={sleepMinutes.map((m) => ({
                time: m.time,
                stage: m.stage,
                hr: m.hr,
              }))}
              width={timelineWidth}
              height={140}
            />
          ) : (
            <View
              style={{
                height: 140,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  ...HeliosTypography.bodySmall,
                  color: HeliosColors.textSecondary,
                }}
              >
                {'No minute-level sleep data available'}
              </Text>
            </View>
          )}
        </View>

        {/* Timeline legend */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: HeliosSpacing.md,
            marginTop: HeliosSpacing.sm,
          }}
        >
          {[
            { label: 'Light', color: HeliosColors.sleepLight },
            { label: 'REM', color: HeliosColors.sleepREM },
            { label: 'Deep', color: HeliosColors.sleepDeep },
            { label: 'HR', color: HeliosColors.heartRed },
          ].map((item) => (
            <View
              key={item.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: HeliosSpacing.xs,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: item.label === 'HR' ? 2 : 8,
                  borderRadius: item.label === 'HR' ? 1 : 2,
                  backgroundColor: item.color,
                }}
              />
              <Text
                style={{
                  ...HeliosTypography.label,
                  color: HeliosColors.textSecondary,
                  fontSize: 9,
                }}
              >
                {item.label.toUpperCase()}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ paddingHorizontal: HeliosSpacing.screenPadding, marginBottom: HeliosSpacing.lg }}>
        <DottedDivider />
      </View>

      {/* Heart Rate During Sleep */}
      <View
        style={{
          paddingHorizontal: HeliosSpacing.screenPadding,
        }}
      >
        <SectionHeader
          title="Heart Rate During Sleep"
          subtitle="From sleep minute data"
        />
        <View style={{ marginTop: HeliosSpacing.md }}>
          <BrutalistCard verticalText="heart">
            <View style={{ paddingRight: 36 }}>
              {hrStats.avg > 0 ? (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                  }}
                >
                  <View style={{ alignItems: 'center' }}>
                    <Text
                      style={{
                        ...HeliosTypography.metricLarge,
                        color: HeliosColors.heartRed,
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      {`${hrStats.min}`}
                    </Text>
                    <Text
                      style={{
                        ...HeliosTypography.label,
                        color: HeliosColors.textOnCardMuted,
                        marginTop: 2,
                      }}
                    >
                      {'MIN BPM'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text
                      style={{
                        ...HeliosTypography.metricLarge,
                        color: HeliosColors.heartRed,
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      {`${hrStats.avg}`}
                    </Text>
                    <Text
                      style={{
                        ...HeliosTypography.label,
                        color: HeliosColors.textOnCardMuted,
                        marginTop: 2,
                      }}
                    >
                      {'AVG BPM'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text
                      style={{
                        ...HeliosTypography.metricLarge,
                        color: HeliosColors.heartRed,
                        fontVariant: ['tabular-nums'],
                      }}
                    >
                      {`${hrStats.max}`}
                    </Text>
                    <Text
                      style={{
                        ...HeliosTypography.label,
                        color: HeliosColors.textOnCardMuted,
                        marginTop: 2,
                      }}
                    >
                      {'MAX BPM'}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text
                  style={{
                    ...HeliosTypography.bodySmall,
                    color: HeliosColors.textOnCardMuted,
                    textAlign: 'center',
                  }}
                >
                  {'No heart rate data during sleep'}
                </Text>
              )}
            </View>
          </BrutalistCard>
        </View>
      </View>
    </ScrollView>
  );
}
