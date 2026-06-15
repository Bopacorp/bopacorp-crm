import type {
  BusinessClientListItemResponse,
  ListBusinessClientsQuery,
} from '@bopacorp/shared/crm';
import { queryKeys } from '@/lib/query-keys.js';
import { usePaginatedList } from '@/shared/hooks/usePaginatedList.js';
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
  const { data, ...rest } = usePaginatedList<BusinessClientListItemResponse, BusinessClientFilters>(
    {
      page,
      filters,
      queryKey: queryKeys.businessClients.list,
      queryFn: (params) => listBusinessClients(params as ListBusinessClientsQuery),
      buildParams: (f, debouncedSearch) => ({
        search: debouncedSearch || undefined,
        advisorId: f.advisorId,
        isActive: f.isActive,
        sortBy: f.sortBy,
        sortOrder: f.sortOrder ?? 'asc',
        limit: f.limit ?? 10,
      }),
    },
  );

  return { clients: data, ...rest };
}
