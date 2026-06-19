import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { listHistory } from '../matrices.service.js';

export function useMatrixHistory(matrixId: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.matrices.history(matrixId),
    queryFn: () => listHistory(matrixId, { limit: 100 }),
    enabled: !!matrixId,
  });

  return { history: data?.data ?? [], loading: isLoading, error, refetch };
}
