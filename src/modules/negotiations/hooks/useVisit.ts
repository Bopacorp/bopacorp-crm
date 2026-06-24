import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { getVisit } from '../negotiations.service.js';

export function useVisit(id: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.visits.detail(id),
    queryFn: () => getVisit(id),
    enabled: !!id,
  });

  return { visit: data ?? null, loading: isLoading, error, refetch };
}
