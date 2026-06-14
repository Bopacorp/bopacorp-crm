import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { queryKeys } from '@/lib/query-keys.js';
import { listNegotiations } from '../negotiations.service.js';

export interface NegotiationFilters {
  search?: string;
  stateId?: string;
  advisorId?: string;
}

export function useNegotiations(page: number, filters: NegotiationFilters) {
  const [debouncedSearch] = useDebounce(filters.search ?? '', 300);
  const params = {
    search: debouncedSearch || undefined,
    stateId: filters.stateId,
    advisorId: filters.advisorId,
  };

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.negotiations.list(page, params),
    queryFn: () => listNegotiations({ page, limit: 10, sortOrder: 'asc', ...params }),
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
