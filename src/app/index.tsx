import { Redirect } from 'expo-router';

import { useAuth } from '@/contexts/AuthContext';

// The root layout's Stack.Protected groups only cover (auth)/(tenant)/(technician) — none of
// them own the literal "/" path, so without this screen, hitting "/" hits Expo Router's built-in
// Unmatched Route page. This immediately redirects to wherever RootNavigator's guards actually
// let the user land.
export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Redirect href="/login" />;
  if (user.currentRole === 'Technician') return <Redirect href="/my-jobs" />;
  return <Redirect href="/dashboard" />;
}
