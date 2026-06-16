import type { PaginationMeta } from '@bopacorp/shared/common';
import type { UploadDocumentResponse } from '@bopacorp/shared/document-uploads';
import type {
  ChangeDocumentStateRequest,
  CreateNegotiationDocumentRequest,
  DocumentStateHistoryResponse,
  DocumentTypeResponse,
  ListDocumentTypesQuery,
  ListNegotiationDocumentsQuery,
  NegotiationDocumentListItemResponse,
  NegotiationDocumentResponse,
} from '@bopacorp/shared/documents';
import api, { request, requestPaginated } from '@/services/api.js';

export function listDocumentTypes(
  query: ListDocumentTypesQuery = { page: 1, limit: 100, sortOrder: 'asc' },
) {
  return requestPaginated<DocumentTypeResponse, PaginationMeta>({
    method: 'GET',
    url: '/documents/types',
    params: query,
  });
}

export function listDocuments(query: ListNegotiationDocumentsQuery) {
  return requestPaginated<NegotiationDocumentListItemResponse, PaginationMeta>({
    method: 'GET',
    url: '/documents',
    params: query,
  });
}

export function getDocument(id: string) {
  return request<NegotiationDocumentResponse>({ method: 'GET', url: `/documents/${id}` });
}

export function createDocument(data: CreateNegotiationDocumentRequest) {
  return request<NegotiationDocumentResponse>({ method: 'POST', url: '/documents', data });
}

export function changeDocumentState(id: string, data: ChangeDocumentStateRequest) {
  return request<NegotiationDocumentResponse>({
    method: 'PATCH',
    url: `/documents/${id}/state`,
    data,
  });
}

export function listDocumentHistory(id: string) {
  return requestPaginated<DocumentStateHistoryResponse, PaginationMeta>({
    method: 'GET',
    url: `/documents/${id}/history`,
  });
}

export async function uploadDocument(file: File): Promise<UploadDocumentResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<{
    success: boolean;
    data: UploadDocumentResponse;
    error?: { code: string; message: string };
  }>('/document-uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  if (!response.data.success) {
    throw new Error(response.data.error?.message ?? 'Upload failed');
  }

  return response.data.data;
}

export async function downloadDocument(id: string, filename: string) {
  const response = await api.get(`/documents/${id}/download`, {
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
