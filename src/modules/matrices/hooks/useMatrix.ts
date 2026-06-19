import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { getMatrix } from '../matrices.service.js';

export function useMatrix(id: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.matrices.detail(id),
    queryFn: () => getMatrix(id),
    enabled: !!id,
  });

  return { matrix: data ?? null, loading: isLoading, error, refetch };
}
