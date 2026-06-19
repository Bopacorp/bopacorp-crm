import type { ListOrgRolesQuery, OrgRoleListItemResponse } from '@bopacorp/shared/core';
import { queryKeys } from '@/lib/query-keys.js';
import { usePaginatedList } from '@/shared/hooks/usePaginatedList.js';
import { listOrgRoles } from '../org.service.js';

export interface OrgRoleFilters {
  search?: string;
  departmentId?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

export function useOrgRoles(page: number, filters: OrgRoleFilters) {
  const { data, ...rest } = usePaginatedList<OrgRoleListItemResponse, OrgRoleFilters>({
    page,
    filters,
    queryKey: queryKeys.orgRoles.list,
    queryFn: (params) => listOrgRoles(params as ListOrgRolesQuery),
    buildParams: (f, debouncedSearch) => ({
      search: debouncedSearch || undefined,
      departmentId: f.departmentId,
      isActive: f.isActive,
      sortBy: f.sortBy,
      sortOrder: f.sortOrder ?? 'asc',
      limit: f.limit ?? 10,
    }),
  });

  return { orgRoles: data, ...rest };
}
