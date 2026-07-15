import { Stack } from 'expo-router';

export default function InvoicesLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, headerTintColor: '#025F30' }}>
      <Stack.Screen name="index" options={{ title: 'My Invoices' }} />
    </Stack>
  );
}
