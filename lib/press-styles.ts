import type { PressableAndroidRippleConfig } from 'react-native';

/** Standard android_ripple config using accent color at 15% opacity. */
export const ACCENT_RIPPLE: PressableAndroidRippleConfig = {
  color: 'rgba(168, 255, 0, 0.15)',
  borderless: false,
};

/** Ripple for elements on light card backgrounds. */
export const CARD_RIPPLE: PressableAndroidRippleConfig = {
  color: 'rgba(26, 26, 26, 0.08)',
  borderless: false,
};

/** Scale transform value for pressed cards. */
export const PRESS_SCALE = 0.97;
