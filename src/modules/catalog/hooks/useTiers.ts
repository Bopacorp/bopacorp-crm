import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { listTiers } from '../catalog.service.js';

export function useTiers() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.catalog.tiers.all,
    queryFn: () => listTiers({ page: 1, limit: 100, sortOrder: 'asc' }),
    staleTime: 5 * 60_000,
  });
  return { tiers: data?.data ?? [], loading: isLoading, error };
}
