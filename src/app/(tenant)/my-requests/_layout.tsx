import { Stack } from 'expo-router';

export default function MyRequestsLayout() {
  return (
    <Stack screenOptions={{ headerTintColor: '#025F30' }}>
      <Stack.Screen name="index" options={{ title: 'My Requests' }} />
      <Stack.Screen name="[id]" options={{ title: 'Request Details' }} />
      <Stack.Screen name="create" options={{ title: 'New Complaint', presentation: 'modal' }} />
    </Stack>
  );
}
