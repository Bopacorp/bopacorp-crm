import type { ContentBlockResponse, ListContentBlocksQuery } from '@bopacorp/shared/catalog';
import { queryKeys } from '@/lib/query-keys.js';
import { usePaginatedList } from '@/shared/hooks/usePaginatedList.js';
import { listContentBlocks } from '../catalog.service.js';

export interface ContentBlockFilters {
  search?: string;
  contentTypeId?: string;
}

export function useContentBlocks(page: number, filters: ContentBlockFilters) {
  const { data, ...rest } = usePaginatedList<ContentBlockResponse, ContentBlockFilters>({
    page,
    filters,
    queryKey: queryKeys.catalog.contentBlocks.list,
    queryFn: (params) => listContentBlocks(params as ListContentBlocksQuery),
    buildParams: (f, debouncedSearch) => ({
      search: debouncedSearch || undefined,
      contentTypeId: f.contentTypeId,
    }),
  });
  return { contentBlocks: data, ...rest };
}
