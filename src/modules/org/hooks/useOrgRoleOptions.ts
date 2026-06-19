import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { queryKeys } from '@/lib/query-keys.js';
import { listOrgRoles } from '../org.service.js';

export function useOrgRoleOptions() {
  const { data } = useQuery({
    queryKey: [...queryKeys.orgRoles.all, 'options'],
    queryFn: () => listOrgRoles({ page: 1, limit: 100, sortOrder: 'asc', isActive: true }),
    staleTime: 5 * 60_000,
  });

  const orgRoleOptions = useMemo(
    () => (data?.data ?? []).map((r) => ({ value: r.id, label: r.name })),
    [data],
  );

  return { orgRoleOptions };
}
