import { createContext, use, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { setForceLogoutHandler } from '@/lib/api';
import { STORAGE_KEYS, plainStorage, secureStorage } from '@/lib/storage';
import type { VerifyOtpResponse } from '@/services/authService';

export type UserRole = 'Tenant' | 'Technician';

export interface User {
  id: string;
  name: string;
  email: string;
  clusterAccountId?: string;
  profilePictureUrl?: string | null;
  roles: UserRole[];
  currentRole: UserRole;
}

// Ported verbatim from fe-nivah-tenant-web/components/pages/LoginPage.tsx's buildUserFromResponse,
// so role detection stays byte-for-byte consistent with the web app's contract with the backend.
export function buildUserFromLoginResponse(data: VerifyOtpResponse): User {
  const apiRole = String(data.user.role || data.user.roleStr || '');
  let roles: UserRole[] = [];
  let currentRole: UserRole = 'Tenant';
  if (apiRole === '6' || apiRole.toLowerCase().includes('technician')) {
    roles = ['Technician'];
    currentRole = 'Technician';
  } else if (apiRole === '7' || apiRole.toLowerCase().includes('tenant')) {
    roles = ['Tenant'];
    currentRole = 'Tenant';
  }

  return {
    id: data.user.id,
    name: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim(),
    email: data.user.email,
    clusterAccountId: data.user.clusterAccountId || undefined,
    profilePictureUrl: data.user.profilePictureUrl || null,
    roles,
    currentRole,
  };
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  completeLogin: (data: VerifyOtpResponse) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const value = use(AuthContext);
  if (!value) throw new Error('useAuth must be used within an <AuthProvider />');
  return value;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const cached = await plainStorage.getJSON<User>(STORAGE_KEYS.user);
      const token = await secureStorage.get(STORAGE_KEYS.authToken);
      if (cached && token) setUser(cached);
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    setForceLogoutHandler(() => {
      setUser(null);
      plainStorage.remove(STORAGE_KEYS.user);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      completeLogin: async (data) => {
        const nextUser = buildUserFromLoginResponse(data);
        await Promise.all([
          secureStorage.set(STORAGE_KEYS.authToken, data.token.accessToken),
          secureStorage.set(STORAGE_KEYS.refreshToken, data.token.refreshToken),
          secureStorage.set(STORAGE_KEYS.userEmail, data.user.email),
          plainStorage.setJSON(STORAGE_KEYS.user, nextUser),
        ]);
        setUser(nextUser);
        return nextUser;
      },
      logout: async () => {
        await Promise.all([
          secureStorage.remove(STORAGE_KEYS.authToken),
          secureStorage.remove(STORAGE_KEYS.refreshToken),
          secureStorage.remove(STORAGE_KEYS.userEmail),
          plainStorage.remove(STORAGE_KEYS.user),
        ]);
        setUser(null);
      },
    }),
    [user, isLoading],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
