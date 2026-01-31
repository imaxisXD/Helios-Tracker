import { Platform } from 'react-native';

/**
 * Trigger a haptic impact on iOS and Android.
 * Dynamically imports expo-haptics to avoid bundling on web.
 */
export async function triggerHaptic(
  style: 'Light' | 'Medium' | 'Heavy' = 'Light',
): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const Haptics = await import('expo-haptics');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle[style]);
  } catch {}
}

/**
 * Trigger a selection-change haptic. Useful for toggles, pickers.
 */
export async function triggerSelectionHaptic(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const Haptics = await import('expo-haptics');
    Haptics.selectionAsync();
  } catch {}
}
