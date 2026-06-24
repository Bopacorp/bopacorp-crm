import type { PaginationMeta } from '@bopacorp/shared/common';
import type {
  CreateMatrixAttachmentRequest,
  CreateOfferMatrixRequest,
  ListMatrixAttachmentsQuery,
  ListOfferMatricesQuery,
  MatrixAttachmentResponse,
  OfferMatrixListItemResponse,
  OfferMatrixResponse,
  UpdateOfferMatrixRequest,
} from '@bopacorp/shared/matrices';
import api, { request, requestPaginated } from '@/services/api.js';

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

export async function downloadAttachment(matrixId: string, attachmentId: string, filename: string) {
  const response = await api.get(`/matrices/${matrixId}/attachments/${attachmentId}/download`, {
    responseType: 'blob',
  });

  const blob = new Blob([response.data as BlobPart]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
