import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pageMeta } from '@/test/crm-fixtures.js';
import { mandatoryDocumentType, pendingDocument } from '@/test/crm-phase4-fixtures.js';

const mocks = vi.hoisted(() => ({
  listDocuments: vi.fn(),
  listDocumentTypes: vi.fn(),
  listMatrices: vi.fn(),
  listAttachments: vi.fn(),
  getMatrix: vi.fn(),
}));

vi.mock('../documentation.service.js', () => ({
  listDocuments: mocks.listDocuments,
  listDocumentTypes: mocks.listDocumentTypes,
}));
vi.mock('@/modules/matrices/matrices.service.js', () => ({
  listMatrices: mocks.listMatrices,
  listAttachments: mocks.listAttachments,
  getMatrix: mocks.getMatrix,
}));

import { useMatrices } from '@/modules/matrices/hooks/useMatrices.js';
import { useMatrix } from '@/modules/matrices/hooks/useMatrix.js';
import { useMatrixAttachments } from '@/modules/matrices/hooks/useMatrixAttachments.js';
import { useDocuments } from './useDocuments.js';
import { useDocumentTypes } from './useDocumentTypes.js';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('documentation and matrix hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listDocuments.mockResolvedValue({ data: [pendingDocument], meta: pageMeta });
    mocks.listDocumentTypes.mockResolvedValue({ data: [mandatoryDocumentType], meta: pageMeta });
    mocks.listMatrices.mockResolvedValue({ data: [], meta: pageMeta });
    mocks.listAttachments.mockResolvedValue({ data: [], meta: pageMeta });
    mocks.getMatrix.mockResolvedValue(null);
  });

  it('builds document filters with state, negotiation, advisor, search, and pagination', async () => {
    const { result } = renderHook(
      () =>
        useDocuments(2, {
          search: 'contract',
          state: 'PENDING_APPROVAL',
          negotiationId: pendingDocument.negotiation.id,
          advisorId: pendingDocument.uploadedBy.id,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(mocks.listDocuments).toHaveBeenCalled());
    await waitFor(() => expect(result.current.documents).toEqual([pendingDocument]));

    expect(mocks.listDocuments).toHaveBeenCalledWith({
      page: 2,
      search: 'contract',
      state: 'PENDING_APPROVAL',
      negotiationId: pendingDocument.negotiation.id,
      advisorId: pendingDocument.uploadedBy.id,
      limit: 10,
    });
  });

  it('removes the all-state sentinel and loads active document types', async () => {
    const { result } = renderHook(() => useDocuments(1, { state: 'all' }), {
      wrapper: createWrapper(),
    });
    renderHook(() => useDocumentTypes(), { wrapper: createWrapper() });

    await waitFor(() => expect(mocks.listDocuments).toHaveBeenCalled());
    await waitFor(() => expect(mocks.listDocumentTypes).toHaveBeenCalled());

    expect(mocks.listDocuments).toHaveBeenCalledWith({
      page: 1,
      state: undefined,
      negotiationId: undefined,
      advisorId: undefined,
      limit: 10,
    });
    expect(result.current.documents).toEqual([pendingDocument]);
    expect(mocks.listDocumentTypes).toHaveBeenCalledWith({ limit: 100, isActive: true });
  });

  it('passes matrix and attachment identifiers with their fixed page sizes', async () => {
    const matrixId = '00000000-0000-4000-8000-000000000731';
    const { result: matrices } = renderHook(() => useMatrices(pendingDocument.negotiation.id, 3), {
      wrapper: createWrapper(),
    });
    const { result: matrix } = renderHook(() => useMatrix(matrixId), {
      wrapper: createWrapper(),
    });
    const { result: attachments } = renderHook(() => useMatrixAttachments(matrixId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(mocks.listMatrices).toHaveBeenCalled());
    await waitFor(() => expect(mocks.getMatrix).toHaveBeenCalled());
    await waitFor(() => expect(mocks.listAttachments).toHaveBeenCalled());

    expect(mocks.listMatrices).toHaveBeenCalledWith({
      negotiationId: pendingDocument.negotiation.id,
      page: 3,
      limit: 20,
      sortOrder: 'desc',
    });
    expect(mocks.getMatrix).toHaveBeenCalledWith(matrixId);
    expect(mocks.listAttachments).toHaveBeenCalledWith(matrixId, { limit: 100 });
    expect(matrices.current.matrices).toEqual([]);
    expect(matrix.current.matrix).toBeNull();
    expect(attachments.current.attachments).toEqual([]);
  });
});
