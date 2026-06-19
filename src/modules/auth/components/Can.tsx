import type { ReactNode } from 'react';
import { useAuth } from '@/modules/auth/context/AuthContext.js';
import { usePermission } from '@/modules/auth/hooks/usePermission.js';

interface CanProps {
  permission?: string;
  any?: string[];
  roles?: string[];
  anyRole?: string[];
  children: ReactNode;
}

export function Can({ permission, any, roles, anyRole, children }: CanProps) {
  const { hasPermission, hasAnyPermission } = usePermission();
  const { hasRole } = useAuth();

  if (permission && !hasPermission(permission)) {
    return null;
  }

  if (any && !hasAnyPermission(any)) {
    return null;
  }

  if (roles && !roles.some((role) => hasRole(role))) {
    return null;
  }

  if (anyRole && !anyRole.some((role) => hasRole(role))) {
    return null;
  }

  return <>{children}</>;
}
