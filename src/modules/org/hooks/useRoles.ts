import type { ListRolesQuery, RoleResponse } from '@bopacorp/shared/auth';
import type { PaginationMeta } from '@bopacorp/shared/common';
import { useQuery } from '@tanstack/react-query';
import { requestPaginated } from '@/services/api.js';

function listRoles(query: ListRolesQuery) {
  return requestPaginated<RoleResponse, PaginationMeta>({
    method: 'GET',
    url: '/roles',
    params: query,
  });
}

export function useRoles() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['roles'],
    queryFn: () => listRoles({ page: 1, limit: 100, sortOrder: 'asc', isActive: true }),
    staleTime: 5 * 60_000,
  });

  return {
    roles: data?.data ?? [],
    loading: isLoading,
    error,
  };
}
