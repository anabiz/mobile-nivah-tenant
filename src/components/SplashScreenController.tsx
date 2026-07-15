import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useAuth } from '@/contexts/AuthContext';

SplashScreen.preventAutoHideAsync();

// Keeps the native splash screen up until the persisted session has been read from storage,
// so the app never flashes a login screen before redirecting an already-authenticated user.
export function SplashScreenController() {
  const { isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return null;
}
