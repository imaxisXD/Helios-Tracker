import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';
import { HeliosColors, HeliosFonts } from '@/constants/theme';
import { DataProvider } from '@/context/data-context';
import { Ionicons } from '@expo/vector-icons';

SplashScreen.preventAutoHideAsync();

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
        <StatusBar style="light" />
      </View>
    </DataProvider>
  );
}
