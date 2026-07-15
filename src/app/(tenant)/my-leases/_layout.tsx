import { Stack } from 'expo-router';

export default function MyLeasesLayout() {
  return (
    <Stack screenOptions={{ headerTintColor: '#025F30' }}>
      <Stack.Screen name="index" options={{ title: 'My Leases' }} />
      <Stack.Screen name="[leaseId]" options={{ title: 'Lease Details' }} />
    </Stack>
  );
}
