import type { CategoryListItemResponse, ListCategoriesQuery } from '@bopacorp/shared/catalog';
import { queryKeys } from '@/lib/query-keys.js';
import { usePaginatedList } from '@/shared/hooks/usePaginatedList.js';
import { listCategories } from '../catalog.service.js';

export interface CategoryFilters {
  search?: string;
  parentId?: string;
  isActive?: boolean;
}

export function useCategories(page: number, filters: CategoryFilters) {
  const { data, ...rest } = usePaginatedList<CategoryListItemResponse, CategoryFilters>({
    page,
    filters,
    queryKey: queryKeys.catalog.categories.list,
    queryFn: (params) => listCategories(params as ListCategoriesQuery),
    buildParams: (f, debouncedSearch) => ({
      search: debouncedSearch || undefined,
      parentId: f.parentId,
      isActive: f.isActive,
    }),
  });
  return { categories: data, ...rest };
}
