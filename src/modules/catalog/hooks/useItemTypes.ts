import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { listItemTypes } from '../catalog.service.js';

export function useItemTypes() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.catalog.itemTypes.all,
    queryFn: () => listItemTypes({ page: 1, limit: 100, sortOrder: 'asc' }),
    staleTime: 5 * 60_000,
  });
  return { itemTypes: data?.data ?? [], loading: isLoading, error };
}
