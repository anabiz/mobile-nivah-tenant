import { Pressable, Text, View } from 'react-native';

interface StatTileProps {
  label: string;
  value: number | string;
  onPress?: () => void;
}

export function StatTile({ label, value, onPress }: StatTileProps) {
  const content = (
    <View className="flex-1 rounded-xl border border-gray-100 bg-white p-4">
      <Text className="text-2xl font-semibold text-gray-900">{value}</Text>
      <Text className="mt-1 text-xs text-gray-500">{label}</Text>
    </View>
  );
  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}
