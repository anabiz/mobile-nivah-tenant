import { Tabs } from 'expo-router';
import { Text, type ColorValue } from 'react-native';

function TabIcon({ emoji, color }: { emoji: string; color: ColorValue }) {
  return <Text style={{ fontSize: 18, color }}>{emoji}</Text>;
}

export default function TenantTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#025F30',
        tabBarInactiveTintColor: '#9CA3AF',
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} /> }}
      />
      <Tabs.Screen
        name="my-leases"
        options={{ title: 'My Leases', tabBarIcon: ({ color }) => <TabIcon emoji="📄" color={color} /> }}
      />
      <Tabs.Screen
        name="my-invoices"
        options={{ title: 'Invoices', tabBarIcon: ({ color }) => <TabIcon emoji="💰" color={color} /> }}
      />
      <Tabs.Screen
        name="my-requests"
        options={{ title: 'Requests', tabBarIcon: ({ color }) => <TabIcon emoji="🔧" color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color }) => <TabIcon emoji="👤" color={color} /> }}
      />
    </Tabs>
  );
}
