import type { PaginationMeta } from '@bopacorp/shared/common';
import type {
  BusinessClientListItemResponse,
  BusinessClientResponse,
  CreateBusinessClientRequest,
  ListBusinessClientsQuery,
  UpdateBusinessClientRequest,
} from '@bopacorp/shared/crm';
import { request, requestPaginated } from '@/services/api.js';

export function listBusinessClients(query: ListBusinessClientsQuery) {
  return requestPaginated<BusinessClientListItemResponse, PaginationMeta>({
    method: 'GET',
    url: '/crm/business-clients',
    params: query,
  });
}

export function getBusinessClient(id: string) {
  return request<BusinessClientResponse>({ method: 'GET', url: `/crm/business-clients/${id}` });
}

export function createBusinessClient(data: CreateBusinessClientRequest) {
  return request<BusinessClientResponse>({ method: 'POST', url: '/crm/business-clients', data });
}

export function updateBusinessClient(id: string, data: UpdateBusinessClientRequest) {
  return request<BusinessClientResponse>({
    method: 'PATCH',
    url: `/crm/business-clients/${id}`,
    data,
  });
}

export function deleteBusinessClient(id: string) {
  return request<void>({ method: 'DELETE', url: `/crm/business-clients/${id}` });
}
