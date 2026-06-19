import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { listAttachments } from '../matrices.service.js';

export function useMatrixAttachments(matrixId: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.matrices.attachments(matrixId),
    queryFn: () => listAttachments(matrixId, { limit: 100 }),
    enabled: !!matrixId,
  });

  return {
    attachments: data?.data ?? [],
    meta: data?.meta ?? null,
    loading: isLoading,
    error,
    refetch,
  };
}
