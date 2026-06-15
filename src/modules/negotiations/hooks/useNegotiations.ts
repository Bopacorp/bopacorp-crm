import type { ListNegotiationsQuery, NegotiationListItemResponse } from '@bopacorp/shared/crm';
import { queryKeys } from '@/lib/query-keys.js';
import { usePaginatedList } from '@/shared/hooks/usePaginatedList.js';
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
  const { data, ...rest } = usePaginatedList<NegotiationListItemResponse, NegotiationFilters>({
    page,
    filters,
    queryKey: queryKeys.negotiations.list,
    queryFn: (params) => listNegotiations(params as ListNegotiationsQuery),
    buildParams: (f, debouncedSearch) => ({
      search: debouncedSearch || undefined,
      stateId: f.stateId,
      advisorId: f.advisorId,
      sortBy: f.sortBy,
      sortOrder: f.sortOrder ?? 'asc',
      limit: f.limit ?? 10,
    }),
  });

  return { negotiations: data, ...rest };
}
