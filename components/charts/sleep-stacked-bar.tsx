import React, { useCallback } from 'react';
import { View, Text } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import {
  HeliosColors,
  HeliosFonts,
  HeliosTypography,
  HeliosSpacing,
} from '@/constants/theme';

interface SleepStackedBarProps {
  data: {
    date: string;
    deep: number;
    light: number;
    rem: number;
    wake: number;
  }[];
  height?: number;
}

function formatDateLabel(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
}

const LEGEND_ITEMS = [
  { label: 'Deep', color: HeliosColors.sleepDeep },
  { label: 'Light', color: HeliosColors.sleepLight },
  { label: 'REM', color: HeliosColors.sleepREM },
  { label: 'Wake', color: HeliosColors.wakeOrange },
];

function formatMinutesToHM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function SleepStackedBar({
  data,
  height = 200,
}: SleepStackedBarProps) {
  const maxTotal = Math.max(
    ...data.map((d) => d.deep + d.light + d.rem + d.wake)
  );
  const yMax = Math.ceil(maxTotal / 60) * 60; // round to nearest hour in minutes

  const renderTooltip = useCallback(
    (item: { stacks?: { value: number; color: string }[] }) => {
      const stacks = item?.stacks ?? [];
      const deep = stacks[0]?.value ?? 0;
      const light = stacks[1]?.value ?? 0;
      const rem = stacks[2]?.value ?? 0;
      const wake = stacks[3]?.value ?? 0;
      const total = deep + light + rem + wake;
      return (
        <View
          style={{
            backgroundColor: HeliosColors.surface,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 16,
            borderCurve: 'continuous',
            marginBottom: 6,
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.5)',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: 6,
            }}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                borderCurve: 'continuous',
                backgroundColor: HeliosColors.sleepDeep,
              }}
            />
            <Text
              style={{
                fontFamily: HeliosFonts.mono,
                fontSize: 14,
                color: HeliosColors.textPrimary,
                fontVariant: ['tabular-nums'] as ('tabular-nums')[],
              }}
            >
              {formatMinutesToHM(total)}
            </Text>
          </View>
          <View style={{ gap: 2 }}>
            {([
              { label: 'Deep', val: deep, color: HeliosColors.sleepDeep },
              { label: 'Light', val: light, color: HeliosColors.sleepLight },
              { label: 'REM', val: rem, color: HeliosColors.sleepREM },
              { label: 'Wake', val: wake, color: HeliosColors.wakeOrange },
            ] as const).map((row) => (
              <View
                key={row.label}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 2,
                    backgroundColor: row.color,
                  }}
                />
                <Text
                  style={{
                    fontFamily: HeliosFonts.mono,
                    fontSize: 10,
                    color: HeliosColors.textSecondary,
                    fontVariant: ['tabular-nums'] as ('tabular-nums')[],
                  }}
                >
                  {`${row.label} ${formatMinutesToHM(row.val)}`}
                </Text>
              </View>
            ))}
          </View>
        </View>
      );
    },
    []
  );

  const stackData = data.map((d) => ({
    stacks: [
      {
        value: d.deep,
        color: HeliosColors.sleepDeep,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
      },
      {
        value: d.light,
        color: HeliosColors.sleepLight,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
      },
      {
        value: d.rem,
        color: HeliosColors.sleepREM,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
      },
      {
        value: d.wake,
        color: HeliosColors.wakeOrange,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
      },
    ],
    label: formatDateLabel(d.date),
    labelTextStyle: {
      color: HeliosColors.textSecondary,
      fontFamily: HeliosFonts.mono,
      fontSize: 9,
      fontVariant: ['tabular-nums'] as ('tabular-nums')[],
    },
  }));

  return (
    <View
      style={{
        backgroundColor: HeliosColors.background,
        paddingVertical: HeliosSpacing.md,
      }}
    >
      <BarChart
        stackData={stackData}
        height={height}
        barWidth={20}
        spacing={8}
        focusBarOnPress
        renderTooltip={renderTooltip}
        noOfSections={4}
        maxValue={yMax}
        yAxisTextStyle={{
          color: HeliosColors.textSecondary,
          fontFamily: HeliosFonts.mono,
          fontSize: 10,
          fontVariant: ['tabular-nums'] as ('tabular-nums')[],
        }}
        xAxisLabelTextStyle={{
          color: HeliosColors.textSecondary,
          fontFamily: HeliosFonts.mono,
          fontSize: 9,
          fontVariant: ['tabular-nums'] as ('tabular-nums')[],
        }}
        yAxisColor={HeliosColors.lineSubtle}
        xAxisColor={HeliosColors.lineSubtle}
        yAxisThickness={1}
        xAxisThickness={1}
        rulesColor={HeliosColors.lineSubtle}
        rulesType="dashed"
        backgroundColor={HeliosColors.background}
        isAnimated
        animationDuration={600}
      />

      {/* Legend */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          gap: HeliosSpacing.md,
          marginTop: HeliosSpacing.sm,
        }}
      >
        {LEGEND_ITEMS.map((item) => (
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
                height: 8,
                borderRadius: 2,
                borderCurve: 'continuous',
                backgroundColor: item.color,
              }}
            />
            <Text
              style={{
                ...HeliosTypography.bodySmall,
                color: HeliosColors.textSecondary,
                fontSize: 10,
              }}
            >
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
