import React, { useMemo, useCallback } from 'react';
import { View, Text } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import {
  HeliosColors,
  HeliosFonts,
  HeliosTypography,
  HeliosSpacing,
} from '@/constants/theme';

function TooltipLabel({ value, time }: { value: number; time: string }) {
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
          backgroundColor: HeliosColors.heartRed,
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
        {`${Math.round(value)} BPM`}
      </Text>
      <Text
        style={{
          fontFamily: HeliosFonts.mono,
          fontSize: 10,
          color: HeliosColors.textSecondary,
          fontVariant: ['tabular-nums'] as ('tabular-nums')[],
        }}
      >
        {time}
      </Text>
    </View>
  );
}

interface HeartRateLineChartProps {
  data: { time: string; heartRate: number }[];
  height?: number;
  showLabels?: boolean;
}

function parseTime(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export default function HeartRateLineChart({
  data,
  height = 200,
  showLabels = true,
}: HeartRateLineChartProps) {
  const { lineData, yMin, yMax } = useMemo(() => {
    if (data.length === 0) {
      return { lineData: [], yMin: 40, yMax: 200 };
    }

    const sorted = [...data].sort(
      (a, b) => parseTime(a.time) - parseTime(b.time)
    );

    const heartRates = sorted.map((d) => d.heartRate);
    const minHR = Math.min(...heartRates);
    const maxHR = Math.max(...heartRates);
    const rangeMin = Math.max(0, Math.floor(minHR / 10) * 10 - 10);
    const rangeMax = Math.ceil(maxHR / 10) * 10 + 10;

    // Show a label approximately every 4 hours
    const totalMinutes =
      sorted.length > 1
        ? parseTime(sorted[sorted.length - 1].time) -
          parseTime(sorted[0].time)
        : 0;
    const pointsPerFourHours =
      totalMinutes > 0
        ? Math.max(1, Math.floor((sorted.length * 240) / totalMinutes))
        : sorted.length;

    const formatted = sorted.map((d, i) => {
      const shouldLabel = showLabels && i % pointsPerFourHours === 0;
      return {
        value: d.heartRate,
        label: shouldLabel ? d.time : '',
        time: d.time,
        labelTextStyle: {
          color: HeliosColors.textSecondary,
          fontFamily: HeliosFonts.mono,
          fontSize: 9,
          fontVariant: ['tabular-nums'] as ('tabular-nums')[],
        },
      };
    });

    return { lineData: formatted, yMin: rangeMin, yMax: rangeMax };
  }, [data, showLabels]);

  const renderPointerLabel = useCallback(
    (items: { value: number; index?: number }[]) => {
      const item = items[0];
      const idx = item?.index ?? 0;
      const time = (lineData[idx] as { time?: string })?.time ?? '';
      return <TooltipLabel value={item?.value ?? 0} time={time} />;
    },
    [lineData]
  );

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
          {'No heart rate data available'}
        </Text>
      </View>
    );
  }

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
        yAxisOffset={yMin}
        noOfSections={4}
        curved
        thickness={2}
        color={HeliosColors.heartRed}
        areaChart
        startFillColor={HeliosColors.heartRed}
        endFillColor="transparent"
        startOpacity={0.15}
        endOpacity={0}
        hideDataPoints
        showDataPointOnFocus
        pointerConfig={{
          showPointerStrip: true,
          pointerStripColor: HeliosColors.lineSubtle,
          pointerStripWidth: 1,
          pointerColor: HeliosColors.heartRed,
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
        formatYLabel={(val: string) =>
          `${Math.round(Number(val) + yMin)}`
        }
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
