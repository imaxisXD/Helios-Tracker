import { Stack } from 'expo-router';
import { HeliosColors } from '@/constants/theme';

export default function ActivityLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: HeliosColors.background },
      }}
    />
  );
}
