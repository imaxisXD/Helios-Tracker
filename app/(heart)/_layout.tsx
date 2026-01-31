import { Stack } from 'expo-router';
import { HeliosColors } from '@/constants/theme';

export default function HeartLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: HeliosColors.background },
        animation: 'slide_from_right',
      }}
    />
  );
}
