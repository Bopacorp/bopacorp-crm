import type { PaginationMeta } from '@bopacorp/shared/common';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';

interface PaginatedListOptions<TData, TFilters extends { search?: string }> {
  page: number;
  filters: TFilters;
  queryKey: (page: number, params: Record<string, unknown>) => readonly unknown[];
  queryFn: (params: Record<string, unknown>) => Promise<{
    data: TData[];
    meta: PaginationMeta;
  }>;
  buildParams: (filters: TFilters, debouncedSearch: string) => Record<string, unknown>;
  debounceMs?: number;
}

export function usePaginatedList<TData, TFilters extends { search?: string }>({
  page,
  filters,
  queryKey,
  queryFn,
  buildParams,
  debounceMs = 400,
}: PaginatedListOptions<TData, TFilters>) {
  const [debouncedSearch] = useDebounce(filters.search ?? '', debounceMs);
  const params = buildParams(filters, debouncedSearch);

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: queryKey(page, params),
    queryFn: () => queryFn({ page, ...params }),
    placeholderData: keepPreviousData,
  });

  return {
    data: (data?.data ?? []) as TData[],
    meta: data?.meta ?? null,
    loading: isLoading,
    fetching: isFetching,
    error,
    refetch,
  };
}
