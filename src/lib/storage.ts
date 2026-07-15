import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Bearer tokens + the email tied to the refresh flow are sensitive -> SecureStore (Keychain/Keystore)
// on native. SecureStore has no web implementation (there's no Keychain/Keystore in a browser), so
// web falls back to AsyncStorage there — web is a convenience dev target for this app, not a
// shipped platform, so the weaker-at-rest storage on web only is an acceptable tradeoff.
// The cached user profile is not sensitive and can exceed SecureStore's ~2KB item limit -> AsyncStorage.

export const secureStorage = {
  get: (key: string) => (Platform.OS === 'web' ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key)),
  set: (key: string, value: string) =>
    Platform.OS === 'web' ? AsyncStorage.setItem(key, value) : SecureStore.setItemAsync(key, value),
  remove: (key: string) => (Platform.OS === 'web' ? AsyncStorage.removeItem(key) : SecureStore.deleteItemAsync(key)),
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
