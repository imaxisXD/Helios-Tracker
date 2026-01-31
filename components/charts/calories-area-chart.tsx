import React, { useCallback } from 'react';
import { View, Text } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import {
  HeliosColors,
  HeliosFonts,
  HeliosSpacing,
} from '@/constants/theme';

function CaloriesTooltip({ value, date }: { value: number; date: string }) {
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
        {`${Math.round(value).toLocaleString()} kcal`}
      </Text>
      <Text
        style={{
          fontFamily: HeliosFonts.mono,
          fontSize: 10,
          color: HeliosColors.textSecondary,
          fontVariant: ['tabular-nums'] as ('tabular-nums')[],
        }}
      >
        {date}
      </Text>
    </View>
  );
}

interface CaloriesAreaChartProps {
  data: { date: string; calories: number }[];
  height?: number;
}

function formatDateLabel(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
}

export default function CaloriesAreaChart({
  data,
  height = 200,
}: CaloriesAreaChartProps) {
  const maxCal = Math.max(...data.map((d) => d.calories));
  const yMax = Math.ceil(maxCal / 100) * 100;

  const lineData = data.map((d, i) => ({
    value: d.calories,
    date: formatDateLabel(d.date),
    label: i % Math.max(1, Math.floor(data.length / 6)) === 0
      ? formatDateLabel(d.date)
      : '',
    labelTextStyle: {
      color: HeliosColors.textSecondary,
      fontFamily: HeliosFonts.mono,
      fontSize: 9,
      fontVariant: ['tabular-nums'] as ('tabular-nums')[],
    },
  }));

  const renderPointerLabel = useCallback(
    (items: { value: number; index?: number }[]) => {
      const item = items[0];
      const idx = item?.index ?? 0;
      const date = (lineData[idx] as { date?: string })?.date ?? '';
      return <CaloriesTooltip value={item?.value ?? 0} date={date} />;
    },
    [lineData]
  );

  return (
    <View
      style={{
        backgroundColor: HeliosColors.background,
        paddingVertical: HeliosSpacing.md,
        overflow: 'visible',
      }}
    >
      <LineChart
        data={lineData}
        height={height}
        maxValue={yMax}
        noOfSections={4}
        areaChart
        curved
        thickness={2}
        color={HeliosColors.accent}
        startFillColor={HeliosColors.accent}
        endFillColor="transparent"
        startOpacity={0.3}
        endOpacity={0}
        hideDataPoints
        showDataPointOnFocus
        pointerConfig={{
          showPointerStrip: true,
          pointerStripColor: HeliosColors.lineSubtle,
          pointerStripWidth: 1,
          pointerColor: HeliosColors.accent,
          radius: 5,
          pointerLabelWidth: 180,
          pointerLabelHeight: 40,
          autoAdjustPointerLabelPosition: true,
          activatePointersOnLongPress: false,
          shiftPointerLabelX: -75,
          shiftPointerLabelY: -50,
          pointerLabelComponent: renderPointerLabel,
        }}
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
    </View>
  );
}
