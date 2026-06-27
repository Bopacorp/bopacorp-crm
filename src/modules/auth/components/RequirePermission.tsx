import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/context/AuthContext.js';
import { usePermission } from '@/modules/auth/hooks/usePermission.js';

export function RequirePermission({
  permission,
  roles,
  children,
}: {
  permission: string;
  roles?: string[];
  children: ReactNode;
}) {
  const { hasPermission } = usePermission();
  const { hasRole } = useAuth();

  if (!hasPermission(permission)) return <Navigate to="/" replace />;
  if (roles && !roles.some((r) => hasRole(r))) return <Navigate to="/" replace />;

  return children;
}
