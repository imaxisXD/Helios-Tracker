import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { HeliosColors, HeliosTypography } from '@/constants/theme';

type DecorativeBarcodeProps = {
  width?: number;
  height?: number;
  label?: string;
};

/**
 * Seeded pseudo-random number generator (mulberry32).
 * Produces deterministic output so the barcode is consistent across renders.
 */
function seededRandom(seed: number) {
  let t = seed + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function DecorativeBarcode({
  width = 200,
  height = 40,
  label = 'STRENGTH PROFILE',
}: DecorativeBarcodeProps) {
  const bars = useMemo(() => {
    const result: { x: number; w: number }[] = [];
    let x = 0;
    let seed = 42;

    while (x < width) {
      const rand = seededRandom(seed++);
      const barWidth = Math.floor(rand * 4) + 1;
      const gapWidth = Math.floor(seededRandom(seed++) * 3) + 1;

      if (x + barWidth > width) break;

      result.push({ x, w: barWidth });
      x += barWidth + gapWidth;
    }

    return result;
  }, [width]);

  return (
    <View>
      <Svg width={width} height={height}>
        {bars.map((bar, i) => (
          <Rect
            key={i}
            x={bar.x}
            y={0}
            width={bar.w}
            height={height}
            fill={HeliosColors.textOnCard}
          />
        ))}
      </Svg>
      {label ? (
        <Text
          style={{
            ...HeliosTypography.label,
            color: HeliosColors.textOnCardMuted,
            marginTop: 4,
          }}
        >
          {label}
        </Text>
      ) : null}
    </View>
  );
}
