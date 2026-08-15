import { beforeEach, describe, expect, it, vi } from 'vitest';
import { negotiationA } from '@/test/crm-fixtures.js';
import { matrix, offerAttachment, PHASE4_TEST_IDS } from '@/test/crm-phase4-fixtures.js';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  requestPaginated: vi.fn(),
  get: vi.fn(),
  createObjectURL: vi.fn(),
  revokeObjectURL: vi.fn(),
}));

vi.mock('@/services/api.js', () => ({
  default: { get: mocks.get },
  request: mocks.request,
  requestPaginated: mocks.requestPaginated,
}));

import {
  createAttachment,
  createMatrix,
  deleteAttachment,
  downloadAttachment,
  getMatrix,
  listAttachments,
  listMatrices,
  updateMatrix,
} from './matrices.service.js';

describe('matrices service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.request.mockResolvedValue({});
    mocks.requestPaginated.mockResolvedValue({ data: [], meta: undefined });
  });

  it('maps matrix and attachment operations to their API endpoints', async () => {
    const matrixQuery = {
      page: 1,
      limit: 20,
      negotiationId: negotiationA.id,
      sortOrder: 'desc' as const,
    };
    const attachmentQuery = { limit: 100, matrixId: matrix.id };
    const attachmentRequest = {
      matrixId: matrix.id,
      attachmentType: 'OFFER_MATRIX' as const,
      filename: offerAttachment.filename,
      fileExtension: offerAttachment.fileExtension,
      fileSizeMb: offerAttachment.fileSizeMb,
      storagePath: offerAttachment.storagePath,
      mimeType: offerAttachment.mimeType,
      encryptionMetadata: { iv: 'iv', authTag: 'tag' },
    };

    await listMatrices(matrixQuery);
    await getMatrix(matrix.id);
    await createMatrix({ negotiationId: negotiationA.id });
    await updateMatrix(matrix.id, { observations: 'Updated observations.' });
    await listAttachments(matrix.id, { limit: 100 });
    await createAttachment(matrix.id, attachmentRequest);
    await deleteAttachment(matrix.id, PHASE4_TEST_IDS.offerAttachment);

    expect(mocks.requestPaginated).toHaveBeenNthCalledWith(1, {
      method: 'GET',
      url: '/matrices',
      params: matrixQuery,
    });
    expect(mocks.requestPaginated).toHaveBeenNthCalledWith(2, {
      method: 'GET',
      url: `/matrices/${matrix.id}/attachments`,
      params: attachmentQuery,
    });
    expect(mocks.request).toHaveBeenNthCalledWith(1, {
      method: 'GET',
      url: `/matrices/${matrix.id}`,
    });
    expect(mocks.request).toHaveBeenNthCalledWith(2, {
      method: 'POST',
      url: '/matrices',
      data: { negotiationId: negotiationA.id },
    });
    expect(mocks.request).toHaveBeenNthCalledWith(3, {
      method: 'PATCH',
      url: `/matrices/${matrix.id}`,
      data: { observations: 'Updated observations.' },
    });
    expect(mocks.request).toHaveBeenNthCalledWith(4, {
      method: 'POST',
      url: `/matrices/${matrix.id}/attachments`,
      data: attachmentRequest,
    });
    expect(mocks.request).toHaveBeenNthCalledWith(5, {
      method: 'DELETE',
      url: `/matrices/${matrix.id}/attachments/${PHASE4_TEST_IDS.offerAttachment}`,
    });
  });

  it('downloads an attachment with a blob response and the provided filename', async () => {
    const originalUrl = window.URL;
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    Object.defineProperty(window, 'URL', {
      configurable: true,
      value: {
        createObjectURL: mocks.createObjectURL.mockReturnValue('blob:matrix'),
        revokeObjectURL: mocks.revokeObjectURL,
      },
    });
    mocks.get.mockResolvedValue({ data: new Blob(['matrix']) });

    try {
      await downloadAttachment(matrix.id, offerAttachment.id, 'offer-matrix.xlsx');

      expect(mocks.get).toHaveBeenCalledWith(
        `/matrices/${matrix.id}/attachments/${offerAttachment.id}/download`,
        { responseType: 'blob' },
      );
      expect(mocks.createObjectURL).toHaveBeenCalledTimes(1);
      expect(click).toHaveBeenCalledTimes(1);
      expect(mocks.revokeObjectURL).toHaveBeenCalledTimes(1);
    } finally {
      Object.defineProperty(window, 'URL', { configurable: true, value: originalUrl });
      click.mockRestore();
    }
  });
});
