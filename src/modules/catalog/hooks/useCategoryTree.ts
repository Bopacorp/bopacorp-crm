import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { getCategoryTree } from '../catalog.service.js';

export function useCategoryTree() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.catalog.categories.tree,
    queryFn: () => getCategoryTree(),
    staleTime: 5 * 60_000,
  });
  return { tree: data ?? [], loading: isLoading, error, refetch };
}
