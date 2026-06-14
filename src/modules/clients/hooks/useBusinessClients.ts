import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { queryKeys } from '@/lib/query-keys.js';
import { listBusinessClients } from '../clients.service.js';

export interface BusinessClientFilters {
  search?: string;
  advisorId?: string;
  isActive?: boolean;
}

export function useBusinessClients(page: number, filters: BusinessClientFilters) {
  const [debouncedSearch] = useDebounce(filters.search ?? '', 300);
  const params = {
    search: debouncedSearch || undefined,
    advisorId: filters.advisorId,
    isActive: filters.isActive,
  };

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.businessClients.list(page, params),
    queryFn: () => listBusinessClients({ page, limit: 10, sortOrder: 'asc', ...params }),
  });

  return {
    clients: data?.data ?? [],
    meta: data?.meta ?? null,
    loading: isLoading,
    fetching: isFetching,
    error,
    refetch,
  };
}
