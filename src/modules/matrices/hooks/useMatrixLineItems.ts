import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { listLineItems } from '../matrices.service.js';

export function useMatrixLineItems(matrixId: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.matrices.lineItems(matrixId),
    queryFn: () => listLineItems(matrixId, { limit: 100 }),
    enabled: !!matrixId,
  });

  return {
    lineItems: data?.data ?? [],
    meta: data?.meta ?? null,
    loading: isLoading,
    error,
    refetch,
  };
}
