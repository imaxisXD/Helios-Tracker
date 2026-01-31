import React, { useCallback } from 'react';
import { View, Text } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import {
  HeliosColors,
  HeliosFonts,
  HeliosTypography,
  HeliosSpacing,
} from '@/constants/theme';

interface StepsBarChartProps {
  data: { date: string; steps: number }[];
  goalLine?: number;
  height?: number;
}

function formatDateLabel(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
}

export default function StepsBarChart({
  data,
  goalLine = 8000,
  height = 200,
}: StepsBarChartProps) {
  if (data.length === 0) {
    return (
      <View
        style={{
          height,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: HeliosColors.background,
        }}
      >
        <Text
          style={{
            ...HeliosTypography.bodySmall,
            color: HeliosColors.textSecondary,
          }}
        >
          {'No step data available'}
        </Text>
      </View>
    );
  }

  const maxSteps = Math.max(...data.map((d) => d.steps), goalLine);
  const yMax = Math.ceil(maxSteps / 2000) * 2000;

  const renderTooltip = useCallback((_item: { value?: number }) => {
    const val = _item?.value ?? 0;
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: HeliosColors.surface,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 20,
          borderCurve: 'continuous',
          marginBottom: 6,
          gap: 8,
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.5)',
        }}
      >
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 3,
            borderCurve: 'continuous',
            backgroundColor: HeliosColors.accent,
          }}
        />
        <Text
          style={{
            fontFamily: HeliosFonts.mono,
            fontSize: 13,
            color: HeliosColors.textPrimary,
            fontVariant: ['tabular-nums'] as ('tabular-nums')[],
          }}
        >
          {`${val.toLocaleString()} steps`}
        </Text>
      </View>
    );
  }, []);

  const barData = data.map((d) => ({
    value: d.steps,
    label: formatDateLabel(d.date),
    frontColor: HeliosColors.accent,
    barBorderTopLeftRadius: 4,
    barBorderTopRightRadius: 4,
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
        data={barData}
        height={height}
        barWidth={16}
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
        hideRules={false}
        rulesColor={HeliosColors.lineSubtle}
        rulesType="dashed"
        backgroundColor={HeliosColors.background}
        showReferenceLine1
        referenceLine1Position={goalLine}
        referenceLine1Config={{
          color: HeliosColors.textSecondary,
          dashWidth: 6,
          dashGap: 4,
          thickness: 1,
          labelText: `Goal ${goalLine.toLocaleString()}`,
          labelTextStyle: {
            color: HeliosColors.textSecondary,
            fontFamily: HeliosFonts.mono,
            fontSize: 9,
            fontVariant: ['tabular-nums'] as ('tabular-nums')[],
          },
        }}
        isAnimated
        animationDuration={600}
      />

      {/* Goal legend */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: HeliosSpacing.sm,
          gap: HeliosSpacing.xs,
        }}
      >
        <View
          style={{
            width: 16,
            height: 1,
            backgroundColor: HeliosColors.textSecondary,
            borderStyle: 'dashed',
          }}
        />
        <Text
          style={{
            ...HeliosTypography.label,
            color: HeliosColors.textSecondary,
            fontSize: 9,
            fontVariant: ['tabular-nums'],
          }}
        >
          {`GOAL: ${goalLine.toLocaleString()}`}
        </Text>
      </View>
    </View>
  );
}
