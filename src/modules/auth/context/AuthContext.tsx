import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { clearAll, getAccessToken } from '@/services/auth-storage.js';

interface AuthContextValue {
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(!!getAccessToken());

    const handleStorage = () => {
      setIsAuthenticated(!!getAccessToken());
    };

    window.addEventListener('bopacorp:token-refreshed', handleStorage);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('bopacorp:token-refreshed', handleStorage);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const logout = useCallback(() => {
    clearAll();
    setIsAuthenticated(false);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
