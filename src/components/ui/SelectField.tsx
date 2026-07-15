import { useState } from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label?: string;
  placeholder?: string;
  value?: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}

export function SelectField({ label, placeholder = 'Select...', value, options, onChange }: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View>
      {label && <Text className="mb-1 text-xs text-gray-500">{label}</Text>}
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between rounded-lg border border-gray-300 px-3 py-2.5"
      >
        <Text className={`text-sm ${selected ? 'text-gray-900' : 'text-gray-400'}`}>
          {selected?.label ?? placeholder}
        </Text>
        <Text className="text-gray-400">▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => setOpen(false)}>
          <View className="max-h-[70%] rounded-t-2xl bg-white p-4">
            {label && <Text className="mb-2 text-sm font-medium text-gray-900">{label}</Text>}
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  className={`rounded-lg px-3 py-3 ${item.value === value ? 'bg-brand/10' : ''}`}
                >
                  <Text className={`text-sm ${item.value === value ? 'font-medium text-brand' : 'text-gray-700'}`}>
                    {item.label}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
