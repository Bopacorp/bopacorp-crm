import type { PaginationMeta } from '@bopacorp/shared/common';
import type { EmployeeListItemResponse, ListEmployeesQuery } from '@bopacorp/shared/core';
import { requestPaginated } from '@/services/api.js';

export function listEmployees(query: ListEmployeesQuery) {
  return requestPaginated<EmployeeListItemResponse, PaginationMeta>({
    method: 'GET',
    url: '/org/employees',
    params: query,
  });
}
