import { Text, TextInput, View, type TextInputProps } from 'react-native';

interface FormInputProps extends TextInputProps {
  label?: string;
}

export function FormInput({ label, className = '', ...rest }: FormInputProps) {
  return (
    <View>
      {label && <Text className="mb-1 text-xs text-gray-500">{label}</Text>}
      <TextInput
        placeholderTextColor="#9CA3AF"
        className={`rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 ${className}`}
        {...rest}
      />
    </View>
  );
}
