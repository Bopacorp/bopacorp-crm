import type {
  ListNegotiationDocumentsQuery,
  NegotiationDocumentListItemResponse,
} from '@bopacorp/shared/documents';
import { queryKeys } from '@/lib/query-keys.js';
import { usePaginatedList } from '@/shared/hooks/usePaginatedList.js';
import { listDocuments } from '../documentation.service.js';

export interface DocumentFilters {
  search?: string;
  state?: string;
  negotiationId?: string;
}

export function useDocuments(page: number, filters: DocumentFilters) {
  const { data, ...rest } = usePaginatedList<NegotiationDocumentListItemResponse, DocumentFilters>({
    page,
    filters,
    queryKey: queryKeys.documents.list,
    queryFn: (params) => listDocuments(params as ListNegotiationDocumentsQuery),
    buildParams: (f, debouncedSearch) => ({
      search: debouncedSearch || undefined,
      state: f.state === 'all' ? undefined : f.state,
      negotiationId: f.negotiationId,
      limit: 10,
    }),
  });

  return { documents: data, ...rest };
}
