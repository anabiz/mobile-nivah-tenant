import { ActivityIndicator, Pressable, Text } from 'react-native';

type Variant = 'primary' | 'secondary' | 'danger' | 'outline';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

const VARIANT_CLASSES: Record<Variant, { container: string; text: string }> = {
  primary: { container: 'bg-brand', text: 'text-white' },
  secondary: { container: 'bg-gray-100', text: 'text-gray-700' },
  danger: { container: 'bg-red-600', text: 'text-white' },
  outline: { container: 'border border-red-300 bg-transparent', text: 'text-red-600' },
};

export function Button({ label, onPress, variant = 'primary', disabled, loading, className = '' }: ButtonProps) {
  const styles = VARIANT_CLASSES[variant];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`items-center justify-center rounded-lg px-4 py-3 ${styles.container} ${isDisabled ? 'opacity-50' : ''} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'outline' ? '#025F30' : '#ffffff'} />
      ) : (
        <Text className={`text-sm font-medium ${styles.text}`}>{label}</Text>
      )}
    </Pressable>
  );
}
