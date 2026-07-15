import { ActivityIndicator, Text, View } from 'react-native';

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-2 py-12">
      <ActivityIndicator color="#025F30" />
      <Text className="text-sm text-gray-500">{label}</Text>
    </View>
  );
}
