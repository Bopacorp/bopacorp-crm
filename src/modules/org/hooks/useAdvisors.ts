import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { listEmployees } from '../org.service.js';

export function useAdvisors() {
  const filters = { orgRoleCode: 'advisor', isActive: true };

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.employees.list(filters),
    queryFn: () =>
      listEmployees({ page: 1, limit: 100, sortBy: 'username', sortOrder: 'asc', ...filters }),
    staleTime: 5 * 60_000,
  });

  return {
    advisors: data?.data ?? [],
    loading: isLoading,
    error,
  };
}
