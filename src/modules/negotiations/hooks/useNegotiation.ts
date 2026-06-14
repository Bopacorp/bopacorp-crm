import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { getNegotiation } from '../negotiations.service.js';

export function useNegotiation(id: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.negotiations.detail(id),
    queryFn: () => getNegotiation(id),
    enabled: !!id,
  });

  return { negotiation: data ?? null, loading: isLoading, error, refetch };
}
