import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { HeliosColors, HeliosFonts } from '@/constants/theme';
import { DataProvider, DataContext } from '@/context/data-context';
import { Ionicons } from '@expo/vector-icons';
import { HealthConnectPermissionScreen } from '@/components/ui/health-connect-permission-screen';

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const ctx = React.use(DataContext);
  const [permLoading, setPermLoading] = useState(false);

  // Show permission screen if Health Connect needs permissions
  if (ctx?.healthConnectStatus === 'permissions_needed' && !ctx.activity) {
    return (
      <HealthConnectPermissionScreen
        loading={permLoading}
        onConnect={async () => {
          setPermLoading(true);
          await ctx.requestPermissions();
          // Settings app opens; permissions are re-checked automatically
          // via AppState listener when the user returns to the app
          setPermLoading(false);
        }}
        onSkip={() => {
          // Force CSV fallback -- reload the page
          // For now, this is a no-op since we'd need to trigger CSV loading
          // The user can restart the app
        }}
      />
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: HeliosColors.surface,
          borderTopColor: HeliosColors.lineSubtle,
          borderTopWidth: 0.5,
          height: 88,
          paddingBottom: 30,
          paddingTop: 8,
        },
        tabBarActiveTintColor: HeliosColors.accent,
        tabBarInactiveTintColor: HeliosColors.textSecondary,
        tabBarLabelStyle: {
          fontFamily: HeliosFonts.mono,
          fontSize: 9,
          letterSpacing: 1,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="(dashboard)"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flash-sharp" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(activity)"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="footsteps-sharp" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(sleep)"
        options={{
          title: 'Sleep',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="moon-sharp" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(heart)"
        options={{
          title: 'Heart',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-sharp" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(profile)"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-sharp" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'BebasNeue-Regular': require('../assets/fonts/BebasNeue-Regular.ttf'),
    'IBMPlexMono-Medium': require('../assets/fonts/IBMPlexMono-Medium.ttf'),
    'IBMPlexMono-Regular': require('../assets/fonts/IBMPlexMono-Regular.ttf'),
    'DMSans-Variable': require('../assets/fonts/DMSans-Variable.ttf'),
    'Caveat-Variable': require('../assets/fonts/Caveat-Variable.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <DataProvider>
      <View style={{ flex: 1, backgroundColor: HeliosColors.background }}>
        <AppContent />
        <StatusBar style="light" />
      </View>
    </DataProvider>
  );
}
