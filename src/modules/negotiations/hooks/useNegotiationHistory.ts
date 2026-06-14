import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { getNegotiationHistory } from '../negotiations.service.js';

export function useNegotiationHistory(id: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.negotiations.history(id),
    queryFn: () => getNegotiationHistory(id),
    enabled: !!id,
  });

  return { history: data ?? [], loading: isLoading, error, refetch };
}
