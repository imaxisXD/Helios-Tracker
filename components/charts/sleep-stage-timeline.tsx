import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import Svg, {
  Rect,
  Line,
  G,
  Text as SvgText,
  Polyline,
} from 'react-native-svg';
import {
  HeliosColors,
  HeliosFonts,
  HeliosTypography,
  HeliosSpacing,
} from '@/constants/theme';

interface SleepStageTimelineProps {
  stages: {
    time: string;
    stage: 'LIGHT' | 'DEEP' | 'REM';
    hr: number;
  }[];
  width: number;
  height?: number;
}

const STAGE_ORDER = ['LIGHT', 'REM', 'DEEP'] as const;

const STAGE_COLORS: Record<string, string> = {
  DEEP: HeliosColors.sleepDeep,
  REM: HeliosColors.sleepREM,
  LIGHT: HeliosColors.sleepLight,
};

const LABEL_WIDTH = 44;
const TOP_PADDING = 8;
const BOTTOM_PADDING = 24;
const HR_OVERLAY_HEIGHT = 20;

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export default function SleepStageTimeline({
  stages,
  width,
  height = 120,
}: SleepStageTimelineProps) {
  const {
    blocks,
    hrPoints,
    minTime,
    maxTime,
    hrMin,
    hrMax,
    timeLabels,
  } = useMemo(() => {
    if (stages.length === 0) {
      return {
        blocks: [],
        hrPoints: '',
        minTime: 0,
        maxTime: 1,
        hrMin: 40,
        hrMax: 100,
        timeLabels: [],
      };
    }

    const sorted = [...stages].sort(
      (a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time)
    );

    const times = sorted.map((s) => parseTimeToMinutes(s.time));
    const tMin = times[0];
    const tMax = times[times.length - 1];
    const heartRates = sorted.map((s) => s.hr).filter((hr) => hr > 0);
    const hMin = heartRates.length > 0 ? Math.min(...heartRates) : 40;
    const hMax = heartRates.length > 0 ? Math.max(...heartRates) : 100;

    const chartWidth = width - LABEL_WIDTH;
    const rowHeight =
      (height - TOP_PADDING - BOTTOM_PADDING - HR_OVERLAY_HEIGHT) / 3;
    const duration = Math.max(tMax - tMin, 1);

    const blockData = sorted.map((s) => {
      const t = parseTimeToMinutes(s.time);
      const x = LABEL_WIDTH + ((t - tMin) / duration) * chartWidth;
      const rowIndex = STAGE_ORDER.indexOf(
        s.stage as (typeof STAGE_ORDER)[number]
      );
      const y = TOP_PADDING + rowIndex * rowHeight;
      const blockWidth = Math.max(chartWidth / sorted.length, 1);

      return {
        x,
        y,
        width: blockWidth,
        height: rowHeight,
        color: STAGE_COLORS[s.stage],
      };
    });

    // Build HR polyline
    const hrPts = sorted
      .filter((s) => s.hr > 0)
      .map((s) => {
        const t = parseTimeToMinutes(s.time);
        const x = LABEL_WIDTH + ((t - tMin) / duration) * chartWidth;
        const hrRange = Math.max(hMax - hMin, 1);
        const hrY =
          TOP_PADDING +
          3 * rowHeight +
          HR_OVERLAY_HEIGHT -
          ((s.hr - hMin) / hrRange) * HR_OVERLAY_HEIGHT;
        return `${x},${hrY}`;
      })
      .join(' ');

    // Time labels (every ~hour)
    const hourStep = 60;
    const firstHour = Math.ceil(tMin / hourStep) * hourStep;
    const labels: { x: number; text: string }[] = [];
    for (let t = firstHour; t <= tMax; t += hourStep) {
      const x = LABEL_WIDTH + ((t - tMin) / duration) * chartWidth;
      const h = Math.floor(t / 60) % 24;
      const mm = t % 60;
      labels.push({
        x,
        text: `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
      });
    }

    return {
      blocks: blockData,
      hrPoints: hrPts,
      minTime: tMin,
      maxTime: tMax,
      hrMin: hMin,
      hrMax: hMax,
      timeLabels: labels,
    };
  }, [stages, width, height]);

  if (stages.length === 0) {
    return null;
  }

  const rowHeight =
    (height - TOP_PADDING - BOTTOM_PADDING - HR_OVERLAY_HEIGHT) / 3;

  return (
    <View
      style={{
        backgroundColor: HeliosColors.background,
        paddingVertical: HeliosSpacing.sm,
      }}
    >
      <Svg width={width} height={height}>
        {/* Stage labels on left */}
        {STAGE_ORDER.map((stage, i) => (
          <SvgText
            key={stage}
            x={4}
            y={TOP_PADDING + i * rowHeight + rowHeight / 2 + 4}
            fill={HeliosColors.textSecondary}
            fontFamily={HeliosFonts.mono}
            fontSize={9}
          >
            {stage}
          </SvgText>
        ))}

        {/* Horizontal grid lines */}
        {STAGE_ORDER.map((_, i) => (
          <Line
            key={`grid-${i}`}
            x1={LABEL_WIDTH}
            y1={TOP_PADDING + i * rowHeight}
            x2={width}
            y2={TOP_PADDING + i * rowHeight}
            stroke={HeliosColors.lineSubtle}
            strokeWidth={0.5}
          />
        ))}
        <Line
          x1={LABEL_WIDTH}
          y1={TOP_PADDING + 3 * rowHeight}
          x2={width}
          y2={TOP_PADDING + 3 * rowHeight}
          stroke={HeliosColors.lineSubtle}
          strokeWidth={0.5}
        />

        {/* Stage blocks */}
        <G>
          {blocks.map((block, i) => (
            <Rect
              key={i}
              x={block.x}
              y={block.y}
              width={block.width}
              height={block.height}
              fill={block.color}
              opacity={0.85}
            />
          ))}
        </G>

        {/* Heart rate overlay line */}
        {hrPoints.length > 0 && (
          <Polyline
            points={hrPoints}
            fill="none"
            stroke={HeliosColors.heartRed}
            strokeWidth={1}
            opacity={0.7}
          />
        )}

        {/* Time labels at the bottom */}
        {timeLabels.map((lbl, i) => (
          <SvgText
            key={i}
            x={lbl.x}
            y={height - 4}
            fill={HeliosColors.textSecondary}
            fontFamily={HeliosFonts.mono}
            fontSize={9}
            textAnchor="middle"
          >
            {lbl.text}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}
