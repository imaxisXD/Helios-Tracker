import { Stack } from 'expo-router';
import { HeliosColors } from '@/constants/theme';

export default function DashboardLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: HeliosColors.background },
      }}
    />
  );
}
