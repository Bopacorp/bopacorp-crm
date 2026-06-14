import { useCallback } from 'react';
import { useAuth } from '@/modules/auth/context/AuthContext.js';

export function usePermission() {
  const { user } = useAuth();

  const hasPermission = useCallback(
    (code: string) => user?.permissions.includes(code) ?? false,
    [user],
  );

  const hasAnyPermission = useCallback(
    (codes: string[]) => codes.some((c) => user?.permissions.includes(c)),
    [user],
  );

  return { hasPermission, hasAnyPermission };
}
