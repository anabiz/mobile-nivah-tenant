import { Text, View } from 'react-native';

export function EmptyState({ message }: { message: string }) {
  return (
    <View className="items-center justify-center py-12">
      <Text className="text-sm text-gray-500">{message}</Text>
    </View>
  );
}
