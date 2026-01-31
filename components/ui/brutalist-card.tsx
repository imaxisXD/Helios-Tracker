import React from 'react';
import { View, Text, Pressable, type ViewStyle } from 'react-native';
import { HeliosColors, HeliosFonts, HeliosSpacing } from '@/constants/theme';
import { CARD_RIPPLE, PRESS_SCALE } from '@/lib/press-styles';

type BrutalistCardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  accentDot?: boolean;
  verticalText?: string;
  onPress?: () => void;
};

export function BrutalistCard({
  children,
  style,
  accentDot = false,
  verticalText,
  onPress,
}: BrutalistCardProps) {
  const cardStyle: ViewStyle = {
    backgroundColor: HeliosColors.cardLight,
    borderRadius: HeliosSpacing.cardRadius,
    borderCurve: 'continuous',
    padding: HeliosSpacing.cardPadding,
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    position: 'relative',
    overflow: 'hidden',
    ...style,
  };

  const content = (
    <>
      {children}

      {accentDot ? (
        <View
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 24,
            height: 24,
            borderRadius: 12,
            borderCurve: 'continuous',
            backgroundColor: HeliosColors.accent,
          }}
        />
      ) : null}

      {verticalText ? (
        <View
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 28,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              position: 'absolute',
              right: 14,
              top: 8,
              bottom: 8,
              width: 1,
              borderStyle: 'dashed',
              borderWidth: 0,
              borderRightWidth: 1,
              borderColor: HeliosColors.lineOnCard,
            }}
          />
          <Text
            style={{
              fontFamily: HeliosFonts.mono,
              fontSize: 9,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: HeliosColors.textOnCardMuted,
              transform: [{ rotate: '90deg' }],
              width: 120,
              textAlign: 'center',
            }}
          >
            {verticalText}
          </Text>
        </View>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        android_ripple={CARD_RIPPLE}
        style={({ pressed }) => [
          cardStyle,
          {
            opacity: pressed ? 0.92 : 1,
            transform: [{ scale: pressed ? PRESS_SCALE : 1 }],
          },
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{content}</View>;
}
