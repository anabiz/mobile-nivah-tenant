import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SplashScreenController } from '@/components/SplashScreenController';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

import '@/global.css';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SplashScreenController />
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { user } = useAuth();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!user && user.currentRole === 'Tenant'}>
        <Stack.Screen name="(tenant)" />
      </Stack.Protected>
      <Stack.Protected guard={!!user && user.currentRole === 'Technician'}>
        <Stack.Screen name="(technician)" />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
