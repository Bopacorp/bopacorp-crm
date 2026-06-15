import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { getCatalogItem } from '../catalog.service.js';

export function useCatalogItem(id: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.catalog.items.detail(id),
    queryFn: () => getCatalogItem(id),
    enabled: !!id,
  });
  return { item: data ?? null, loading: isLoading, error, refetch };
}
