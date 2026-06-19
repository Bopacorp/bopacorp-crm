import type { EmployeeListItemResponse, ListEmployeesQuery } from '@bopacorp/shared/core';
import { queryKeys } from '@/lib/query-keys.js';
import { usePaginatedList } from '@/shared/hooks/usePaginatedList.js';
import { listEmployees } from '../org.service.js';

export interface EmployeeFilters {
  search?: string;
  orgRoleId?: string;
  orgRoleCode?: string;
  departmentId?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

export function useEmployees(page: number, filters: EmployeeFilters) {
  const { data, ...rest } = usePaginatedList<EmployeeListItemResponse, EmployeeFilters>({
    page,
    filters,
    queryKey: queryKeys.employees.paginated,
    queryFn: (params) => listEmployees(params as ListEmployeesQuery),
    buildParams: (f, debouncedSearch) => ({
      search: debouncedSearch || undefined,
      orgRoleId: f.orgRoleId,
      orgRoleCode: f.orgRoleCode,
      departmentId: f.departmentId,
      isActive: f.isActive,
      sortBy: f.sortBy,
      sortOrder: f.sortOrder ?? 'asc',
      limit: f.limit ?? 10,
    }),
  });

  return { employees: data, ...rest };
}
