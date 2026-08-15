import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  department,
  employee,
  employeeListItem,
  orgRole,
  PHASE6_TEST_IDS,
} from '@/test/crm-phase6-fixtures.js';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  requestPaginated: vi.fn(),
}));

vi.mock('@/services/api.js', () => ({
  request: mocks.request,
  requestPaginated: mocks.requestPaginated,
}));

import {
  assignSupervisors,
  createDepartment,
  createEmployee,
  createOrgRole,
  disableDepartment,
  disableOrgRole,
  getDepartment,
  getEmployee,
  getOrgRole,
  listAdvisors,
  listDepartments,
  listEmployees,
  listOrgRoles,
  listSupervisors,
  updateDepartment,
  updateEmployee,
  updateOrgRole,
} from './org.service.js';

const id = PHASE6_TEST_IDS;
const employeeId = employee.userId;
const query = { page: 1, limit: 10, sortOrder: 'asc' as const, search: 'advisor' };

describe('organization service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.request.mockResolvedValue(employee);
    mocks.requestPaginated.mockResolvedValue({ data: [employeeListItem], meta: undefined });
  });

  it('maps employee and supervisor relationship operations', async () => {
    await listEmployees(query);
    await getEmployee(employeeId);
    await createEmployee({
      userId: employeeId,
      orgRoleId: id.orgRole,
      territory: 'North',
      hiredAt: '2026-03-01',
      isActive: true,
    });
    await updateEmployee(employeeId, { territory: null, isActive: false });
    await listSupervisors(employeeId, { page: 1, limit: 10, sortOrder: 'asc' });
    await listAdvisors(employeeId, { page: 1, limit: 10, sortOrder: 'asc', isActive: true });
    await assignSupervisors(employeeId, { supervisorIds: [id.department] });

    expect(mocks.requestPaginated).toHaveBeenNthCalledWith(1, {
      method: 'GET',
      url: '/org/employees',
      params: query,
    });
    expect(mocks.request).toHaveBeenNthCalledWith(1, {
      method: 'GET',
      url: `/org/employees/${employeeId}`,
    });
    expect(mocks.request).toHaveBeenCalledWith({
      method: 'PUT',
      url: `/org/employees/${employeeId}/supervisors`,
      data: { supervisorIds: [id.department] },
    });
  });

  it('maps department and organizational role CRUD operations', async () => {
    const departmentData = { code: 'SUPPORT', name: 'Support', isActive: true };
    const roleData = {
      code: 'supervisor',
      name: 'Supervisor',
      departmentId: department.id,
      isActive: true,
    };

    await listDepartments(query);
    await getDepartment(department.id);
    await createDepartment(departmentData);
    await updateDepartment(department.id, { name: 'Updated support' });
    await disableDepartment(department.id);

    await listOrgRoles({ ...query, departmentId: department.id });
    await getOrgRole(orgRole.id);
    await createOrgRole(roleData);
    await updateOrgRole(orgRole.id, { departmentId: null, isActive: false });
    await disableOrgRole(orgRole.id);

    expect(mocks.requestPaginated).toHaveBeenCalledWith({
      method: 'GET',
      url: '/org/org-roles',
      params: { ...query, departmentId: department.id },
    });
    expect(mocks.request).toHaveBeenCalledWith({
      method: 'PATCH',
      url: `/org/org-roles/${orgRole.id}/disable`,
    });
  });
});
