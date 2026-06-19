import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { getEmployee } from '../org.service.js';

export function useEmployee(userId: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.employees.detail(userId),
    queryFn: () => getEmployee(userId),
    enabled: !!userId,
  });

  return { employee: data ?? null, loading: isLoading, error, refetch };
}
