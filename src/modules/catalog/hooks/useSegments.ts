import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { listSegments } from '../catalog.service.js';

export function useSegments() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.catalog.segments.all,
    queryFn: () => listSegments({ page: 1, limit: 100, sortOrder: 'asc' }),
    staleTime: 5 * 60_000,
  });
  return { segments: data?.data ?? [], loading: isLoading, error };
}
