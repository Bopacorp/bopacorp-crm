import type {
  AssignUserRolesRequest,
  CreateUserRequest,
  ListUsersQuery,
  UpdateUserRequest,
  UserListItemResponse,
  UserResponse,
} from '@bopacorp/shared/auth';
import type { PaginationMeta } from '@bopacorp/shared/common';
import { request, requestPaginated } from '@/services/api.js';

export function listUsers(query: ListUsersQuery) {
  return requestPaginated<UserListItemResponse, PaginationMeta>({
    method: 'GET',
    url: '/users',
    params: query,
  });
}

export function getUser(id: string) {
  return request<UserResponse>({ method: 'GET', url: `/users/${id}` });
}

export function createUser(data: CreateUserRequest) {
  return request<UserResponse>({ method: 'POST', url: '/users', data });
}

export function updateUser(id: string, data: UpdateUserRequest) {
  return request<UserResponse>({ method: 'PATCH', url: `/users/${id}`, data });
}

export function removeUser(id: string) {
  return request<void>({ method: 'DELETE', url: `/users/${id}` });
}

export function assignUserRoles(id: string, data: AssignUserRolesRequest) {
  return request<void>({ method: 'PUT', url: `/users/${id}/roles`, data });
}
