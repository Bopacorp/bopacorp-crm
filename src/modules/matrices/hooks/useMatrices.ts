import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { listMatrices } from '../matrices.service.js';

export function useMatrices(negotiationId: string, page = 1) {
  const filters = { negotiationId };

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.matrices.list(page, filters),
    queryFn: () => listMatrices({ negotiationId, page, limit: 20, sortOrder: 'desc' }),
    enabled: !!negotiationId,
  });

  return {
    matrices: data?.data ?? [],
    meta: data?.meta ?? null,
    loading: isLoading,
    fetching: isFetching,
    error,
    refetch,
  };
}
