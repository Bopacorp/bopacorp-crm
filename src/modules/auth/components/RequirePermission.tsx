import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermission } from '@/modules/auth/hooks/usePermission.js';

export function RequirePermission({
  permission,
  children,
}: {
  permission: string;
  children: ReactNode;
}) {
  const { hasPermission } = usePermission();
  return hasPermission(permission) ? children : <Navigate to="/" replace />;
}
