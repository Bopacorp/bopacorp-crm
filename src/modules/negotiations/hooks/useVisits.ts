import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { listVisits } from '../negotiations.service.js';

export interface VisitFilters {
  clientId?: string;
  advisorId?: string;
  visitTypeId?: string;
  isVerified?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export function useVisits(page: number, filters: VisitFilters) {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.visits.list(page, filters as Record<string, unknown>),
    queryFn: () =>
      listVisits({
        page,
        limit: 10,
        sortOrder: 'asc',
        clientId: filters.clientId,
        advisorId: filters.advisorId,
        visitTypeId: filters.visitTypeId,
        isVerified: filters.isVerified,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      }),
  });

  return {
    visits: data?.data ?? [],
    meta: data?.meta ?? null,
    loading: isLoading,
    fetching: isFetching,
    error,
    refetch,
  };
}
