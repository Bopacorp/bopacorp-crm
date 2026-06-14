import type { ReactNode } from 'react';
import { usePermission } from '@/modules/auth/hooks/usePermission.js';

interface CanProps {
  permission?: string;
  any?: string[];
  children: ReactNode;
}

export function Can({ permission, any, children }: CanProps) {
  const { hasPermission, hasAnyPermission } = usePermission();

  if (permission && !hasPermission(permission)) {
    return null;
  }

  if (any && !hasAnyPermission(any)) {
    return null;
  }

  return <>{children}</>;
}
