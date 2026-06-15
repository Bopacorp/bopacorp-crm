import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { getContentBlock } from '../catalog.service.js';

export function useContentBlock(id: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.catalog.contentBlocks.detail(id),
    queryFn: () => getContentBlock(id),
    enabled: !!id,
  });
  return { contentBlock: data ?? null, loading: isLoading, error, refetch };
}
