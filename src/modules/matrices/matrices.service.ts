import type { PaginationMeta } from '@bopacorp/shared/common';
import type {
  ChangeMatrixStateRequest,
  CreateMatrixAttachmentRequest,
  CreateMatrixLineItemRequest,
  CreateOfferMatrixRequest,
  ListMatrixAttachmentsQuery,
  ListMatrixLineItemsQuery,
  ListMatrixStateHistoryQuery,
  ListOfferMatricesQuery,
  MatrixAttachmentResponse,
  MatrixLineItemListItemResponse,
  MatrixStateHistoryResponse,
  OfferMatrixListItemResponse,
  OfferMatrixResponse,
  UpdateMatrixLineItemRequest,
  UpdateOfferMatrixRequest,
} from '@bopacorp/shared/matrices';
import { request, requestPaginated } from '@/services/api.js';

// ── Offer Matrices ──

export function listMatrices(query: ListOfferMatricesQuery) {
  return requestPaginated<OfferMatrixListItemResponse, PaginationMeta>({
    method: 'GET',
    url: '/matrices',
    params: query,
  });
}

export function getMatrix(id: string) {
  return request<OfferMatrixResponse>({ method: 'GET', url: `/matrices/${id}` });
}

export function createMatrix(data: CreateOfferMatrixRequest) {
  return request<OfferMatrixResponse>({ method: 'POST', url: '/matrices', data });
}

export function updateMatrix(id: string, data: UpdateOfferMatrixRequest) {
  return request<OfferMatrixResponse>({ method: 'PATCH', url: `/matrices/${id}`, data });
}

export function deleteMatrix(id: string) {
  return request<void>({ method: 'DELETE', url: `/matrices/${id}` });
}

export function changeMatrixState(id: string, data: ChangeMatrixStateRequest) {
  return request<OfferMatrixResponse>({
    method: 'PATCH',
    url: `/matrices/${id}/state`,
    data,
  });
}

// ── Line Items ──

export function listLineItems(matrixId: string, query?: Partial<ListMatrixLineItemsQuery>) {
  return requestPaginated<MatrixLineItemListItemResponse, PaginationMeta>({
    method: 'GET',
    url: `/matrices/${matrixId}/line-items`,
    params: { ...query, matrixId },
  });
}

export function createLineItem(matrixId: string, data: CreateMatrixLineItemRequest) {
  return request<MatrixLineItemListItemResponse>({
    method: 'POST',
    url: `/matrices/${matrixId}/line-items`,
    data,
  });
}

export function updateLineItem(
  matrixId: string,
  lineItemId: string,
  data: UpdateMatrixLineItemRequest,
) {
  return request<MatrixLineItemListItemResponse>({
    method: 'PATCH',
    url: `/matrices/${matrixId}/line-items/${lineItemId}`,
    data,
  });
}

export function deleteLineItem(matrixId: string, lineItemId: string) {
  return request<void>({ method: 'DELETE', url: `/matrices/${matrixId}/line-items/${lineItemId}` });
}

// ── Attachments ──

export function listAttachments(matrixId: string, query?: Partial<ListMatrixAttachmentsQuery>) {
  return requestPaginated<MatrixAttachmentResponse, PaginationMeta>({
    method: 'GET',
    url: `/matrices/${matrixId}/attachments`,
    params: { ...query, matrixId },
  });
}

export function createAttachment(matrixId: string, data: CreateMatrixAttachmentRequest) {
  return request<MatrixAttachmentResponse>({
    method: 'POST',
    url: `/matrices/${matrixId}/attachments`,
    data,
  });
}

export function deleteAttachment(matrixId: string, attachmentId: string) {
  return request<void>({
    method: 'DELETE',
    url: `/matrices/${matrixId}/attachments/${attachmentId}`,
  });
}

// ── State History ──

export function listHistory(matrixId: string, query?: Partial<ListMatrixStateHistoryQuery>) {
  return requestPaginated<MatrixStateHistoryResponse, PaginationMeta>({
    method: 'GET',
    url: `/matrices/${matrixId}/history`,
    params: { ...query, matrixId },
  });
}
