import { Stack } from 'expo-router';

export default function MyJobsLayout() {
  return (
    <Stack screenOptions={{ headerTintColor: '#025F30' }}>
      <Stack.Screen name="index" options={{ title: 'My Jobs' }} />
      <Stack.Screen name="[id]" options={{ title: 'Job Details' }} />
    </Stack>
  );
}
