import { Pressable, View, type ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  onPress?: () => void;
}

export function Card({ onPress, className = '', children, ...rest }: CardProps) {
  const base = `rounded-xl border border-gray-100 bg-white p-4 ${className}`;
  if (onPress) {
    return (
      <Pressable onPress={onPress} className={base} {...(rest as any)}>
        {children}
      </Pressable>
    );
  }
  return (
    <View className={base} {...rest}>
      {children}
    </View>
  );
}
