import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';

export function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-[#e8f5f0]" edges={['top']}>
      <View className="gap-4 p-4">
        <Text className="text-xl font-semibold text-[#025F30]">Profile</Text>
        <Card className="gap-1">
          <Text className="text-base font-medium text-gray-900">{user?.name}</Text>
          <Text className="text-sm text-gray-500">{user?.email}</Text>
          <Text className="mt-1 text-xs uppercase tracking-wide text-gray-400">{user?.currentRole}</Text>
        </Card>
        <Button label="Log Out" variant="outline" onPress={logout} />
      </View>
    </SafeAreaView>
  );
}
