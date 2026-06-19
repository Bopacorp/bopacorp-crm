import type { PaginationMeta } from '@bopacorp/shared/common';
import type {
  AdvisorSupervisorResponse,
  AssignAdvisorSupervisorsRequest,
  CreateDepartmentRequest,
  CreateEmployeeRequest,
  CreateOrgRoleRequest,
  DepartmentListItemResponse,
  DepartmentResponse,
  EmployeeListItemResponse,
  EmployeeResponse,
  ListAdvisorSupervisorsQuery,
  ListDepartmentsQuery,
  ListEmployeesQuery,
  ListOrgRolesQuery,
  OrgRoleListItemResponse,
  OrgRoleResponse,
  UpdateDepartmentRequest,
  UpdateEmployeeRequest,
  UpdateOrgRoleRequest,
} from '@bopacorp/shared/core';
import { request, requestPaginated } from '@/services/api.js';

// ── Employees ──

export function listEmployees(query: ListEmployeesQuery) {
  return requestPaginated<EmployeeListItemResponse, PaginationMeta>({
    method: 'GET',
    url: '/org/employees',
    params: query,
  });
}

export function getEmployee(userId: string) {
  return request<EmployeeResponse>({ method: 'GET', url: `/org/employees/${userId}` });
}

export function createEmployee(data: CreateEmployeeRequest) {
  return request<EmployeeResponse>({ method: 'POST', url: '/org/employees', data });
}

export function updateEmployee(userId: string, data: UpdateEmployeeRequest) {
  return request<EmployeeResponse>({ method: 'PATCH', url: `/org/employees/${userId}`, data });
}

export function removeEmployee(userId: string) {
  return request<void>({ method: 'DELETE', url: `/org/employees/${userId}` });
}

export function listSupervisors(userId: string, query?: ListAdvisorSupervisorsQuery) {
  return requestPaginated<AdvisorSupervisorResponse, PaginationMeta>({
    method: 'GET',
    url: `/org/employees/${userId}/supervisors`,
    params: query,
  });
}

export function listAdvisors(userId: string, query?: ListAdvisorSupervisorsQuery) {
  return requestPaginated<AdvisorSupervisorResponse, PaginationMeta>({
    method: 'GET',
    url: `/org/employees/${userId}/advisors`,
    params: query,
  });
}

export function assignSupervisors(userId: string, data: AssignAdvisorSupervisorsRequest) {
  return request<void>({ method: 'PUT', url: `/org/employees/${userId}/supervisors`, data });
}

// ── Departments ──

export function listDepartments(query: ListDepartmentsQuery) {
  return requestPaginated<DepartmentListItemResponse, PaginationMeta>({
    method: 'GET',
    url: '/org/departments',
    params: query,
  });
}

export function getDepartment(id: string) {
  return request<DepartmentResponse>({ method: 'GET', url: `/org/departments/${id}` });
}

export function createDepartment(data: CreateDepartmentRequest) {
  return request<DepartmentResponse>({ method: 'POST', url: '/org/departments', data });
}

export function updateDepartment(id: string, data: UpdateDepartmentRequest) {
  return request<DepartmentResponse>({ method: 'PATCH', url: `/org/departments/${id}`, data });
}

export function disableDepartment(id: string) {
  return request<DepartmentResponse>({ method: 'PATCH', url: `/org/departments/${id}/disable` });
}

// ── Org Roles ──

export function listOrgRoles(query: ListOrgRolesQuery) {
  return requestPaginated<OrgRoleListItemResponse, PaginationMeta>({
    method: 'GET',
    url: '/org/org-roles',
    params: query,
  });
}

export function getOrgRole(id: string) {
  return request<OrgRoleResponse>({ method: 'GET', url: `/org/org-roles/${id}` });
}

export function createOrgRole(data: CreateOrgRoleRequest) {
  return request<OrgRoleResponse>({ method: 'POST', url: '/org/org-roles', data });
}

export function updateOrgRole(id: string, data: UpdateOrgRoleRequest) {
  return request<OrgRoleResponse>({ method: 'PATCH', url: `/org/org-roles/${id}`, data });
}

export function disableOrgRole(id: string) {
  return request<OrgRoleResponse>({ method: 'PATCH', url: `/org/org-roles/${id}/disable` });
}
