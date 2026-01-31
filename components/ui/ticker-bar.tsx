import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { HeliosColors, HeliosFonts } from '@/constants/theme';

type TickerBarProps = {
  items: string[];
};

const TICKER_HEIGHT = 32;

export function TickerBar({ items }: TickerBarProps) {
  const translateX = useSharedValue(0);

  const tickerText = items.join('  //  ');
  // Duplicate the text so the scroll appears seamless
  const displayText = `${tickerText}  //  ${tickerText}`;

  // Approximate width based on character count (monospace ~7.5px per char at 12px size)
  const singleRunWidth = tickerText.length * 7.5 + 40;

  useEffect(() => {
    translateX.value = 0;
    translateX.value = withRepeat(
      withTiming(-singleRunWidth, {
        duration: singleRunWidth * 30,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [singleRunWidth, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      style={{
        height: TICKER_HEIGHT,
        backgroundColor: HeliosColors.surface,
        overflow: 'hidden',
        justifyContent: 'center',
      }}
    >
      <Animated.View
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
          },
          animatedStyle,
        ]}
      >
        <Text
          numberOfLines={1}
          style={{
            fontFamily: HeliosFonts.mono,
            fontSize: 12,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: HeliosColors.accent,
            fontVariant: ['tabular-nums'],
          }}
        >
          {displayText}
        </Text>
      </Animated.View>
    </View>
  );
}
