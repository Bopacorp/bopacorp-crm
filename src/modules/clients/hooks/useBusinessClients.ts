import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { queryKeys } from '@/lib/query-keys.js';
import { listBusinessClients } from '../clients.service.js';

export interface BusinessClientFilters {
  search?: string;
  advisorId?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

export function useBusinessClients(page: number, filters: BusinessClientFilters) {
  const [debouncedSearch] = useDebounce(filters.search ?? '', 400);
  const params = {
    search: debouncedSearch || undefined,
    advisorId: filters.advisorId,
    isActive: filters.isActive,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder ?? 'asc',
    limit: filters.limit ?? 10,
  };

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.businessClients.list(page, params),
    queryFn: () => listBusinessClients({ page, ...params }),
    placeholderData: keepPreviousData,
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
