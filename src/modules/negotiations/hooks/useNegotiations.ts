import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { queryKeys } from '@/lib/query-keys.js';
import { listNegotiations } from '../negotiations.service.js';

export interface NegotiationFilters {
  search?: string;
  stateId?: string;
  advisorId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

export function useNegotiations(page: number, filters: NegotiationFilters) {
  const [debouncedSearch] = useDebounce(filters.search ?? '', 400);
  const params = {
    search: debouncedSearch || undefined,
    stateId: filters.stateId,
    advisorId: filters.advisorId,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder ?? 'asc',
    limit: filters.limit ?? 10,
  };

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.negotiations.list(page, params),
    queryFn: () => listNegotiations({ page, ...params }),
    placeholderData: keepPreviousData,
  });

  return {
    negotiations: data?.data ?? [],
    meta: data?.meta ?? null,
    loading: isLoading,
    fetching: isFetching,
    error,
    refetch,
  };
}
