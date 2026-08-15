import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applicationListItem,
  categoryTree,
  contactRequest,
  department,
  employeeListItem,
  orgRole,
  vacancyListItem,
} from './crm-phase6-fixtures.js';

const mocks = vi.hoisted(() => ({
  listCatalogItems: vi.fn(),
  listCategories: vi.fn(),
  listContactRequests: vi.fn(),
  getCategoryTree: vi.fn(),
  listEmployees: vi.fn(),
  listDepartments: vi.fn(),
  listOrgRoles: vi.fn(),
  listVacancies: vi.fn(),
  listJobApplications: vi.fn(),
  requestPaginated: vi.fn(),
}));

vi.mock('@/modules/catalog/catalog.service.js', () => ({
  listCatalogItems: mocks.listCatalogItems,
  listCategories: mocks.listCategories,
  listContactRequests: mocks.listContactRequests,
  getCategoryTree: mocks.getCategoryTree,
}));
vi.mock('@/modules/org/org.service.js', () => ({
  listEmployees: mocks.listEmployees,
  listDepartments: mocks.listDepartments,
  listOrgRoles: mocks.listOrgRoles,
}));
vi.mock('@/modules/employability/employability.service.js', () => ({
  listVacancies: mocks.listVacancies,
  listJobApplications: mocks.listJobApplications,
}));
vi.mock('@/services/api.js', () => ({ requestPaginated: mocks.requestPaginated }));

import { useCatalogItems } from '@/modules/catalog/hooks/useCatalogItems.js';
import { useCategories } from '@/modules/catalog/hooks/useCategories.js';
import { useContactRequests } from '@/modules/catalog/hooks/useContactRequests.js';
import { useJobApplications } from '@/modules/employability/hooks/useJobApplications.js';
import { useVacancies } from '@/modules/employability/hooks/useVacancies.js';
import { useAdvisors } from '@/modules/org/hooks/useAdvisors.js';
import { useDepartments } from '@/modules/org/hooks/useDepartments.js';
import { useOrgRoles } from '@/modules/org/hooks/useOrgRoles.js';
import { useRoles } from '@/modules/org/hooks/useRoles.js';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('catalog, organization, and employability hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listCatalogItems.mockResolvedValue({ data: [], meta: undefined });
    mocks.listCategories.mockResolvedValue({ data: [], meta: undefined });
    mocks.listContactRequests.mockResolvedValue({ data: [contactRequest], meta: undefined });
    mocks.getCategoryTree.mockResolvedValue([categoryTree]);
    mocks.listEmployees.mockResolvedValue({ data: [employeeListItem], meta: undefined });
    mocks.listDepartments.mockResolvedValue({ data: [department], meta: undefined });
    mocks.listOrgRoles.mockResolvedValue({ data: [orgRole], meta: undefined });
    mocks.listVacancies.mockResolvedValue({ data: [vacancyListItem], meta: undefined });
    mocks.listJobApplications.mockResolvedValue({ data: [applicationListItem], meta: undefined });
    mocks.requestPaginated.mockResolvedValue({ data: [], meta: undefined });
  });

  it('passes catalog and employability filters through paginated hooks', async () => {
    const { result } = renderHook(
      () => ({
        items: useCatalogItems(2, {
          search: 'business',
          categoryId: categoryTree.id,
          isActive: true,
        }),
        categories: useCategories(1, { search: 'business', parentId: categoryTree.id }),
        requests: useContactRequests(1, { itemId: categoryTree.id, isAttended: false }),
        vacancies: useVacancies(1, { search: 'sales', isPublished: false }),
        applications: useJobApplications(1, { vacancyId: categoryTree.id, state: 'PENDING' }),
      }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.requests.contactRequests).toEqual([contactRequest]));

    expect(mocks.listCatalogItems).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, categoryId: categoryTree.id, isActive: true, limit: 10 }),
    );
    expect(mocks.listCategories).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, parentId: categoryTree.id }),
    );
    expect(mocks.listContactRequests).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, itemId: categoryTree.id, isAttended: false }),
    );
    expect(mocks.listVacancies).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, search: 'sales', isPublished: false, limit: 10 }),
    );
    expect(mocks.listJobApplications).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, vacancyId: categoryTree.id, state: 'PENDING', limit: 10 }),
    );
  });

  it('loads advisor, department, organizational role, and access role options', async () => {
    mocks.requestPaginated.mockResolvedValue({
      data: [{ id: 'role-1', name: 'Manager' }],
      meta: undefined,
    });

    const { result } = renderHook(
      () => ({
        advisors: useAdvisors(),
        departments: useDepartments(1, { search: 'sales', isActive: true }),
        orgRoles: useOrgRoles(1, { departmentId: department.id, isActive: true }),
        roles: useRoles(),
      }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.advisors.advisors).toEqual([employeeListItem]));

    expect(mocks.listEmployees).toHaveBeenCalledWith({
      page: 1,
      limit: 100,
      sortBy: 'username',
      sortOrder: 'asc',
      orgRoleCode: 'advisor',
      isActive: true,
    });
    expect(mocks.listDepartments).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'sales', isActive: true, limit: 10 }),
    );
    expect(mocks.listOrgRoles).toHaveBeenCalledWith(
      expect.objectContaining({ departmentId: department.id, isActive: true, limit: 10 }),
    );
    expect(mocks.requestPaginated).toHaveBeenCalledWith({
      method: 'GET',
      url: '/roles',
      params: { page: 1, limit: 100, sortOrder: 'asc', isActive: true },
    });
    expect(result.current.roles.roles).toEqual([{ id: 'role-1', name: 'Manager' }]);
  });
});
