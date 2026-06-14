import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { listNegotiationStates } from '../negotiations.service.js';

export function useNegotiationStates() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.negotiationStates.all,
    queryFn: () => listNegotiationStates({ page: 1, limit: 100, sortOrder: 'asc' }),
    staleTime: 5 * 60_000,
  });

  return { states: data?.data ?? [], loading: isLoading, error };
}
