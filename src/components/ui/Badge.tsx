import { Text, View } from 'react-native';

interface BadgeProps {
  label: string;
  // A Tailwind class string like "bg-green-100 text-green-700" — the exact convention used
  // across fe-nivah-tenant-web's service files (LEASE_STATUS, STATUS_COLORS, SLA_COLORS, etc.).
  color: string;
}

export function Badge({ label, color }: BadgeProps) {
  const [bgClass, textClass] = color.split(' ');
  return (
    <View className={`self-start rounded-full px-2 py-0.5 ${bgClass}`}>
      <Text className={`text-xs font-medium ${textClass}`}>{label}</Text>
    </View>
  );
}
