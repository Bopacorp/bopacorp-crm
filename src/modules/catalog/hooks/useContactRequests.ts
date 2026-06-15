import type { ContactRequestResponse, ListContactRequestsQuery } from '@bopacorp/shared/catalog';
import { queryKeys } from '@/lib/query-keys.js';
import { usePaginatedList } from '@/shared/hooks/usePaginatedList.js';
import { listContactRequests } from '../catalog.service.js';

export interface ContactRequestFilters {
  search?: string;
  itemId?: string;
  isAttended?: boolean;
}

export function useContactRequests(page: number, filters: ContactRequestFilters) {
  const { data, ...rest } = usePaginatedList<ContactRequestResponse, ContactRequestFilters>({
    page,
    filters,
    queryKey: queryKeys.catalog.contactRequests.list,
    queryFn: (params) => listContactRequests(params as ListContactRequestsQuery),
    buildParams: (f, debouncedSearch) => ({
      search: debouncedSearch || undefined,
      itemId: f.itemId,
      isAttended: f.isAttended,
    }),
  });
  return { contactRequests: data, ...rest };
}
