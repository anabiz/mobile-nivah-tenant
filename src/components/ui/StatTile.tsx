import { Pressable, Text, useWindowDimensions, View } from 'react-native';

interface StatTileProps {
  label: string;
  value: number | string;
  onPress?: () => void;
}

export function StatTile({ label, value, onPress }: StatTileProps) {
  const { width } = useWindowDimensions();
  // 2 columns with 16px padding on each side and 12px gap
  const tileWidth = (width - 32 - 12) / 2;

  const content = (
    <View style={{ width: tileWidth }} className="rounded-xl border border-gray-100 bg-white p-4">
      <Text className="text-2xl font-semibold text-gray-900">{value}</Text>
      <Text className="mt-1 text-xs text-gray-500">{label}</Text>
    </View>
  );
  if (onPress) {
    return <Pressable onPress={onPress} style={{ width: tileWidth }}>{content}</Pressable>;
  }
  return content;
}
