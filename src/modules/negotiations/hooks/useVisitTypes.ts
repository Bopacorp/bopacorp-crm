import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { listVisitTypes } from '../negotiations.service.js';

export function useVisitTypes() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.visitTypes.all,
    queryFn: () => listVisitTypes({ page: 1, limit: 100, sortOrder: 'asc' }),
    staleTime: 5 * 60_000,
  });

  return { visitTypes: data?.data ?? [], loading: isLoading, error };
}
