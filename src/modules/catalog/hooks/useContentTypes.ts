import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { listContentTypes } from '../catalog.service.js';

export function useContentTypes() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.catalog.contentTypes.all,
    queryFn: () => listContentTypes({ page: 1, limit: 100, sortOrder: 'asc' }),
    staleTime: 5 * 60_000,
  });
  return { contentTypes: data?.data ?? [], loading: isLoading, error };
}
