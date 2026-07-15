import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { STORAGE_KEYS, secureStorage } from './storage';

// EXPO_PUBLIC_* vars are inlined at build time by Metro — see app.config.ts / .env.
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.nivah.org';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    accept: 'text/plain',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: 30000,
});

// Registered by AuthContext on mount; the interceptor can't use hooks, so it calls back into
// AuthContext when the refresh flow is unrecoverable and the user must be signed out.
let onForceLogout: (() => void) | null = null;
export function setForceLogoutHandler(handler: () => void) {
  onForceLogout = handler;
}

apiClient.interceptors.request.use(async (config) => {
  const token = await secureStorage.get(STORAGE_KEYS.authToken);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
let refreshFailureCount = 0;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await secureStorage.get(STORAGE_KEYS.refreshToken);
  const email = await secureStorage.get(STORAGE_KEYS.userEmail);
  if (!refreshToken || !email) return null;

  // Plain axios (not apiClient) to avoid recursing into these same interceptors.
  const res = await axios.post(`${API_BASE_URL}/api/v1/auths/refresh-token`, { refreshToken, email });

  // The backend's refresh-token response has been observed to sometimes skip the
  // {success,data} envelope and return the token fields directly — accept either shape.
  const body = res.data?.data ?? res.data;
  const accessToken: string | undefined = body?.accessToken;
  const newRefreshToken: string | undefined = body?.refreshToken;
  if (!accessToken) return null;

  await secureStorage.set(STORAGE_KEYS.authToken, accessToken);
  if (newRefreshToken) {
    await secureStorage.set(STORAGE_KEYS.refreshToken, newRefreshToken);
  }
  return accessToken;
}

apiClient.interceptors.response.use(
  (response) => {
    if (response.data && response.data.success === false) {
      return Promise.reject({ response, message: response.data.message, isApiError: true });
    }
    return response;
  },
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as RetryableConfig | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const authToken = await secureStorage.get(STORAGE_KEYS.authToken);
      if (!authToken) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAccessToken()
          .then((token) => {
            refreshFailureCount = token ? 0 : refreshFailureCount + 1;
            return token;
          })
          .catch(() => {
            refreshFailureCount += 1;
            return null;
          })
          .finally(() => {
            isRefreshing = false;
          });
      }

      const newToken = await refreshPromise;
      if (newToken) {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      }

      if (refreshFailureCount >= 2) {
        await Promise.all([
          secureStorage.remove(STORAGE_KEYS.authToken),
          secureStorage.remove(STORAGE_KEYS.refreshToken),
          secureStorage.remove(STORAGE_KEYS.userEmail),
        ]);
        onForceLogout?.();
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  },
);

export interface ApiResponse<T = unknown> {
  data: T;
  message: string;
  success: boolean;
}

export function apiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  const anyErr = err as any;
  return (
    anyErr?.response?.data?.message ||
    anyErr?.message ||
    fallback
  );
}
