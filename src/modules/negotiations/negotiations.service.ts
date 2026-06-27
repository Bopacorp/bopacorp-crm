import type { PaginationMeta } from '@bopacorp/shared/common';
import type {
  ChangeNegotiationStateRequest,
  CreateNegotiationRequest,
  CreateVisitRequest,
  ListNegotiationStatesQuery,
  ListNegotiationsQuery,
  ListVisitsQuery,
  ListVisitTypesQuery,
  NegotiationListItemResponse,
  NegotiationResponse,
  NegotiationStateHistoryResponse,
  NegotiationStateResponse,
  UpdateNegotiationRequest,
  UpdateVisitRequest,
  VerifyVisitRequest,
  VisitListItemResponse,
  VisitResponse,
  VisitTypeResponse,
} from '@bopacorp/shared/crm';
import api, { request, requestPaginated } from '@/services/api.js';

// Negotiations

export function listNegotiations(query: ListNegotiationsQuery) {
  return requestPaginated<NegotiationListItemResponse, PaginationMeta>({
    method: 'GET',
    url: '/crm/negotiations',
    params: query,
  });
}

export function getNegotiation(id: string) {
  return request<NegotiationResponse>({ method: 'GET', url: `/crm/negotiations/${id}` });
}

export function createNegotiation(data: CreateNegotiationRequest) {
  return request<NegotiationResponse>({ method: 'POST', url: '/crm/negotiations', data });
}

export function updateNegotiation(id: string, data: UpdateNegotiationRequest) {
  return request<NegotiationResponse>({
    method: 'PATCH',
    url: `/crm/negotiations/${id}`,
    data,
  });
}

export function changeNegotiationState(id: string, data: ChangeNegotiationStateRequest) {
  return request<NegotiationResponse>({
    method: 'PATCH',
    url: `/crm/negotiations/${id}/state`,
    data,
  });
}

export async function closeWithDocuments(
  negotiationId: string,
  files: Map<string, File>,
  notes?: string,
): Promise<NegotiationResponse> {
  const formData = new FormData();

  for (const [docTypeId, file] of files) {
    formData.append('files', file);
    formData.append('documentTypeIds', docTypeId);
  }

  if (notes) {
    formData.append('notes', notes);
  }

  const response = await api.post<{ success: boolean; data: NegotiationResponse }>(
    `/crm/negotiations/${negotiationId}/close-with-documents`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

  if (!response.data.success) {
    throw new Error('Close with documents failed');
  }

  return response.data.data;
}

export function getNegotiationHistory(id: string) {
  return request<NegotiationStateHistoryResponse[]>({
    method: 'GET',
    url: `/crm/negotiations/${id}/history`,
  });
}

// Negotiation States

export function listNegotiationStates(query?: ListNegotiationStatesQuery) {
  return requestPaginated<NegotiationStateResponse, PaginationMeta>({
    method: 'GET',
    url: '/crm/negotiation-states',
    params: query,
  });
}

// Visits

export function listVisits(query: ListVisitsQuery) {
  return requestPaginated<VisitListItemResponse, PaginationMeta>({
    method: 'GET',
    url: '/crm/visits',
    params: query,
  });
}

export function getVisit(id: string) {
  return request<VisitResponse>({ method: 'GET', url: `/crm/visits/${id}` });
}

export function createVisit(data: CreateVisitRequest) {
  return request<VisitResponse>({ method: 'POST', url: '/crm/visits', data });
}

export function updateVisit(id: string, data: UpdateVisitRequest) {
  return request<VisitResponse>({ method: 'PATCH', url: `/crm/visits/${id}`, data });
}

export function verifyVisit(id: string, data: VerifyVisitRequest) {
  return request<VisitResponse>({ method: 'PATCH', url: `/crm/visits/${id}/verify`, data });
}

export function deleteVisit(id: string) {
  return request<void>({ method: 'DELETE', url: `/crm/visits/${id}` });
}

// Visit Types

export function listVisitTypes(query?: ListVisitTypesQuery) {
  return requestPaginated<VisitTypeResponse, PaginationMeta>({
    method: 'GET',
    url: '/crm/visit-types',
    params: query,
  });
}
