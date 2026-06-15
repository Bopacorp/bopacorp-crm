import type { CatalogItemListItemResponse, ListCatalogItemsQuery } from '@bopacorp/shared/catalog';
import { queryKeys } from '@/lib/query-keys.js';
import { usePaginatedList } from '@/shared/hooks/usePaginatedList.js';
import { listCatalogItems } from '../catalog.service.js';

export interface CatalogItemFilters {
  search?: string;
  categoryId?: string;
  itemTypeId?: string;
  isActive?: boolean;
  isPublished?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

export function useCatalogItems(page: number, filters: CatalogItemFilters) {
  const { data, ...rest } = usePaginatedList<CatalogItemListItemResponse, CatalogItemFilters>({
    page,
    filters,
    queryKey: queryKeys.catalog.items.list,
    queryFn: (params) => listCatalogItems(params as ListCatalogItemsQuery),
    buildParams: (f, debouncedSearch) => ({
      search: debouncedSearch || undefined,
      categoryId: f.categoryId,
      itemTypeId: f.itemTypeId,
      isActive: f.isActive,
      isPublished: f.isPublished,
      sortBy: f.sortBy,
      sortOrder: f.sortOrder ?? 'asc',
      limit: f.limit ?? 10,
    }),
  });
  return { items: data, ...rest };
}
