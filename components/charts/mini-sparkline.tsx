import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { HeliosColors } from '@/constants/theme';

interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export default function MiniSparkline({
  data,
  width = 80,
  height = 30,
  color = HeliosColors.accent,
}: MiniSparklineProps) {
  const pathD = useMemo(() => {
    if (data.length < 2) return '';

    const minVal = Math.min(...data);
    const maxVal = Math.max(...data);
    const range = maxVal - minVal || 1;

    const padding = 2;
    const drawWidth = width - padding * 2;
    const drawHeight = height - padding * 2;
    const stepX = drawWidth / (data.length - 1);

    const points = data.map((val, i) => {
      const x = padding + i * stepX;
      const y = padding + drawHeight - ((val - minVal) / range) * drawHeight;
      return { x, y };
    });

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }

    return d;
  }, [data, width, height]);

  if (data.length < 2) {
    return <View style={{ width, height }} />;
  }

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
