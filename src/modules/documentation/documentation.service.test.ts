import { beforeEach, describe, expect, it, vi } from 'vitest';
import { negotiationA } from '@/test/crm-fixtures.js';
import {
  documentHistoryEntry,
  mandatoryDocumentType,
  optionalDocumentType,
  pendingDocument,
  uploadDocumentResponse,
} from '@/test/crm-phase4-fixtures.js';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  requestPaginated: vi.fn(),
  post: vi.fn(),
  get: vi.fn(),
  createObjectURL: vi.fn(),
  revokeObjectURL: vi.fn(),
}));

vi.mock('@/services/api.js', () => ({
  default: { post: mocks.post, get: mocks.get },
  request: mocks.request,
  requestPaginated: mocks.requestPaginated,
}));

import {
  changeDocumentState,
  createDocument,
  createDocumentType,
  disableDocumentType,
  downloadDocument,
  downloadNegotiationDocuments,
  getDocument,
  getDocumentType,
  getPendingSummary,
  listDocumentHistory,
  listDocuments,
  listDocumentTypes,
  updateDocumentType,
  uploadDocument,
} from './documentation.service.js';

describe('documentation service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.request.mockResolvedValue({});
    mocks.requestPaginated.mockResolvedValue({ data: [], meta: undefined });
    mocks.post.mockResolvedValue({ data: { success: true, data: uploadDocumentResponse } });
  });

  it('maps document type listing and administration operations to the API contract', async () => {
    const query = {
      page: 2,
      limit: 10,
      search: 'contract',
      isActive: true,
      isMandatory: true,
      sortOrder: 'asc' as const,
    };

    await listDocumentTypes(query);
    await getDocumentType(mandatoryDocumentType.id);
    await createDocumentType({
      code: 'PROPOSAL',
      name: optionalDocumentType.name,
      isMandatory: false,
      isActive: true,
    });
    await updateDocumentType(optionalDocumentType.id, { name: 'Updated proposal' });
    await disableDocumentType(optionalDocumentType.id);

    expect(mocks.requestPaginated).toHaveBeenCalledWith({
      method: 'GET',
      url: '/documents/types',
      params: query,
    });
    expect(mocks.request).toHaveBeenNthCalledWith(1, {
      method: 'GET',
      url: `/documents/types/${mandatoryDocumentType.id}`,
    });
    expect(mocks.request).toHaveBeenNthCalledWith(2, {
      method: 'POST',
      url: '/documents/types',
      data: {
        code: 'PROPOSAL',
        name: optionalDocumentType.name,
        isMandatory: false,
        isActive: true,
      },
    });
    expect(mocks.request).toHaveBeenNthCalledWith(3, {
      method: 'PATCH',
      url: `/documents/types/${optionalDocumentType.id}`,
      data: { name: 'Updated proposal' },
    });
    expect(mocks.request).toHaveBeenNthCalledWith(4, {
      method: 'PATCH',
      url: `/documents/types/${optionalDocumentType.id}`,
      data: { isActive: false },
    });
  });

  it('maps document listing, creation, state changes, history, and pending summary', async () => {
    const query = {
      page: 1,
      limit: 10,
      negotiationId: negotiationA.id,
      state: 'PENDING_APPROVAL' as const,
      advisorId: '00000000-0000-4000-8000-000000000101',
      sortOrder: 'desc' as const,
    };
    const documentRequest = {
      negotiationId: negotiationA.id,
      documentTypeId: mandatoryDocumentType.id,
      filename: 'contract.pdf',
      fileExtension: 'pdf',
      fileSizeMb: 1,
      storagePath: 'documents/contract.pdf',
      mimeType: 'application/pdf',
      encryptionMetadata: { iv: 'iv', authTag: 'tag' },
    };

    await listDocuments(query);
    await getDocument(pendingDocument.id);
    await createDocument(documentRequest);
    await changeDocumentState(pendingDocument.id, {
      state: 'REJECTED',
      coordinatorMessage: 'Missing signature.',
    });
    await listDocumentHistory(pendingDocument.id);
    await getPendingSummary();

    expect(mocks.requestPaginated).toHaveBeenNthCalledWith(2, {
      method: 'GET',
      url: `/documents/${pendingDocument.id}/history`,
    });
    expect(mocks.requestPaginated).toHaveBeenNthCalledWith(1, {
      method: 'GET',
      url: '/documents',
      params: query,
    });
    expect(mocks.request).toHaveBeenNthCalledWith(1, {
      method: 'GET',
      url: `/documents/${pendingDocument.id}`,
    });
    expect(mocks.request).toHaveBeenNthCalledWith(2, {
      method: 'POST',
      url: '/documents',
      data: documentRequest,
    });
    expect(mocks.request).toHaveBeenNthCalledWith(3, {
      method: 'PATCH',
      url: `/documents/${pendingDocument.id}/state`,
      data: { state: 'REJECTED', coordinatorMessage: 'Missing signature.' },
    });
    expect(mocks.request).toHaveBeenNthCalledWith(4, {
      method: 'GET',
      url: '/documents/pending-summary',
    });
    expect(documentHistoryEntry.newState).toBe('REJECTED');
  });

  it('uploads a file as multipart data and reports unsuccessful upload responses', async () => {
    const file = new File(['contract'], 'contract.pdf', { type: 'application/pdf' });

    await expect(uploadDocument(file)).resolves.toEqual(uploadDocumentResponse);

    const [, formData, config] = mocks.post.mock.calls[0];
    expect(formData).toBeInstanceOf(FormData);
    expect(formData.get('file')).toBe(file);
    expect(config).toEqual({ headers: { 'Content-Type': 'multipart/form-data' } });

    mocks.post.mockResolvedValue({
      data: { success: false, error: { code: 'UPLOAD_FAILED', message: 'Storage unavailable' } },
    });
    await expect(uploadDocument(file)).rejects.toThrow('Storage unavailable');
  });

  it('downloads an individual document and a negotiation ZIP with the correct filenames', async () => {
    const originalUrl = window.URL;
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    Object.defineProperty(window, 'URL', {
      configurable: true,
      value: {
        createObjectURL: mocks.createObjectURL.mockReturnValue('blob:test'),
        revokeObjectURL: mocks.revokeObjectURL,
      },
    });
    mocks.get.mockResolvedValue({ data: new Blob(['content']) });

    try {
      await downloadDocument(pendingDocument.id, pendingDocument.filename);
      await downloadNegotiationDocuments(negotiationA.id);

      expect(mocks.get).toHaveBeenNthCalledWith(1, `/documents/${pendingDocument.id}/download`, {
        responseType: 'blob',
      });
      expect(mocks.get).toHaveBeenNthCalledWith(
        2,
        `/crm/negotiations/${negotiationA.id}/documents/download`,
        { responseType: 'blob' },
      );
      expect(mocks.createObjectURL).toHaveBeenCalledTimes(2);
      expect(click).toHaveBeenCalledTimes(2);
      expect(mocks.revokeObjectURL).toHaveBeenCalledTimes(2);
    } finally {
      Object.defineProperty(window, 'URL', { configurable: true, value: originalUrl });
      click.mockRestore();
    }
  });
});
