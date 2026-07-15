import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

// Bearer tokens + the email tied to the refresh flow are sensitive -> SecureStore (Keychain/Keystore).
// The cached user profile is not sensitive and can exceed SecureStore's ~2KB item limit -> AsyncStorage.

export const secureStorage = {
  get: (key: string) => SecureStore.getItemAsync(key),
  set: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  remove: (key: string) => SecureStore.deleteItemAsync(key),
};

export const plainStorage = {
  async getJSON<T>(key: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  setJSON(key: string, value: unknown) {
    return AsyncStorage.setItem(key, JSON.stringify(value));
  },
  remove: (key: string) => AsyncStorage.removeItem(key),
};

export const STORAGE_KEYS = {
  authToken: 'authToken',
  refreshToken: 'refreshToken',
  userEmail: 'userEmail',
  user: 'user',
} as const;
