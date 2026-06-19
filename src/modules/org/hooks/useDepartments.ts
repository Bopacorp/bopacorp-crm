import type { DepartmentListItemResponse, ListDepartmentsQuery } from '@bopacorp/shared/core';
import { queryKeys } from '@/lib/query-keys.js';
import { usePaginatedList } from '@/shared/hooks/usePaginatedList.js';
import { listDepartments } from '../org.service.js';

export interface DepartmentFilters {
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

export function useDepartments(page: number, filters: DepartmentFilters) {
  const { data, ...rest } = usePaginatedList<DepartmentListItemResponse, DepartmentFilters>({
    page,
    filters,
    queryKey: queryKeys.departments.list,
    queryFn: (params) => listDepartments(params as ListDepartmentsQuery),
    buildParams: (f, debouncedSearch) => ({
      search: debouncedSearch || undefined,
      isActive: f.isActive,
      sortBy: f.sortBy,
      sortOrder: f.sortOrder ?? 'asc',
      limit: f.limit ?? 10,
    }),
  });

  return { departments: data, ...rest };
}
