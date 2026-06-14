import type { LoginRequest } from '@bopacorp/shared/auth';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import * as authService from '@/services/auth.service.js';
import { type AuthUser, buildAuthUser, fetchMe } from '@/services/auth.service.js';
import {
  clearAll,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  saveTokens,
  saveUser,
} from '@/services/auth-storage.js';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser<AuthUser>());
  const [isLoading, setIsLoading] = useState(() => !!getAccessToken());

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;

    fetchMe()
      .then((meData) => {
        const fullUser = buildAuthUser(meData);
        saveUser(fullUser);
        setUser(fullUser);
      })
      .catch(() => {
        clearAll();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const handleTokenRefresh = async () => {
      try {
        const meData = await fetchMe();
        const fullUser = buildAuthUser(meData);
        saveUser(fullUser);
        setUser(fullUser);
      } catch {
        clearAll();
        setUser(null);
      }
    };

    window.addEventListener('bopacorp:token-refreshed', handleTokenRefresh);
    return () => window.removeEventListener('bopacorp:token-refreshed', handleTokenRefresh);
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const response = await authService.login(data);
    saveTokens(response.tokens);
    saveUser(response.user);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await authService.logout(refreshToken);
      } catch {
        // ignore — clear locally regardless
      }
    }
    clearAll();
    setUser(null);
  }, []);

  const hasPermission = useCallback(
    (permission: string) => user?.permissions.includes(permission) ?? false,
    [user],
  );

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
