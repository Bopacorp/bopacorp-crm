import type { MatrixAttachmentResponse } from '@bopacorp/shared/matrices';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  emailAttachment,
  matrix,
  matrixListItem,
  offerAttachment,
  uploadDocumentResponse,
} from '@/test/crm-phase4-fixtures.js';

const mocks = vi.hoisted(() => ({
  useMatrices: vi.fn(),
  useMatrix: vi.fn(),
  useMatrixAttachments: vi.fn(),
  createMatrix: vi.fn(),
  updateMatrix: vi.fn(),
  createAttachment: vi.fn(),
  deleteAttachment: vi.fn(),
  downloadAttachment: vi.fn(),
  uploadDocument: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  allowedPermissions: new Set<string>(),
}));

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));
vi.mock('@/modules/matrices/hooks/useMatrices.js', () => ({
  useMatrices: mocks.useMatrices,
}));
vi.mock('@/modules/matrices/hooks/useMatrix.js', () => ({
  useMatrix: mocks.useMatrix,
}));
vi.mock('@/modules/matrices/hooks/useMatrixAttachments.js', () => ({
  useMatrixAttachments: mocks.useMatrixAttachments,
}));
vi.mock('@/modules/matrices/matrices.service.js', () => ({
  createMatrix: mocks.createMatrix,
  updateMatrix: mocks.updateMatrix,
  createAttachment: mocks.createAttachment,
  deleteAttachment: mocks.deleteAttachment,
  downloadAttachment: mocks.downloadAttachment,
}));
vi.mock('@/modules/documentation/documentation.service.js', () => ({
  uploadDocument: mocks.uploadDocument,
}));
vi.mock('@/modules/auth/components/Can.js', () => ({
  Can: ({ permission, children }: { permission: string; children: ReactNode }) =>
    mocks.allowedPermissions.has(permission) ? children : null,
}));
vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

import { MatricesTab } from './MatricesTab.js';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function renderTab(withMatrix = true, attachments: MatrixAttachmentResponse[] = []) {
  mocks.useMatrices.mockReturnValue({
    matrices: withMatrix ? [matrixListItem] : [],
    loading: false,
    error: null,
    refetch: vi.fn(),
  });
  mocks.useMatrix.mockReturnValue({ matrix, loading: false, error: null, refetch: vi.fn() });
  mocks.useMatrixAttachments.mockReturnValue({
    attachments,
    loading: false,
    error: null,
    refetch: vi.fn(),
  });

  return render(<MatricesTab negotiationId={matrix.negotiation.id} />, {
    wrapper: createWrapper(),
  });
}

describe('MatricesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.allowedPermissions.clear();
    mocks.allowedPermissions.add('offer_matrices.create');
    mocks.allowedPermissions.add('offer_matrices.update');
    mocks.allowedPermissions.add('matrix_attachments.create');
    mocks.allowedPermissions.add('matrix_attachments.delete');
    mocks.createMatrix.mockResolvedValue(matrix);
    mocks.updateMatrix.mockResolvedValue(matrix);
    mocks.createAttachment.mockResolvedValue(offerAttachment);
    mocks.deleteAttachment.mockResolvedValue(undefined);
    mocks.downloadAttachment.mockResolvedValue(undefined);
    mocks.uploadDocument.mockResolvedValue(uploadDocumentResponse);
  });

  it('creates a matrix associated with the current negotiation', async () => {
    const user = userEvent.setup();
    renderTab(false);

    await user.click(screen.getByRole('button', { name: 'matrices.createMatrix' }));

    await waitFor(() =>
      expect(mocks.createMatrix).toHaveBeenCalledWith({
        negotiationId: matrix.negotiation.id,
      }),
    );
  });

  it('saves edited observations with the matrix identifier', async () => {
    const user = userEvent.setup();
    renderTab();

    await user.click(screen.getByRole('button', { name: 'matrices.editObservations' }));
    const observations = document.getElementById('matrix-observations') as HTMLTextAreaElement;
    await user.clear(observations);
    await user.type(observations, 'Updated offer notes.');
    await user.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() =>
      expect(mocks.updateMatrix).toHaveBeenCalledWith(matrix.id, {
        observations: 'Updated offer notes.',
      }),
    );
  });

  it('uploads a valid offer attachment with the correct slot type', async () => {
    renderTab();
    const file = new File(['spreadsheet'], 'offer.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const input = document.querySelector('input[accept=".xlsx,.xls,.csv"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(mocks.uploadDocument).toHaveBeenCalledWith(file));
    expect(mocks.createAttachment).toHaveBeenCalledWith(matrix.id, {
      matrixId: matrix.id,
      attachmentType: 'OFFER_MATRIX',
      filename: uploadDocumentResponse.filename,
      fileExtension: uploadDocumentResponse.fileExtension,
      fileSizeMb: uploadDocumentResponse.fileSizeMb,
      storagePath: uploadDocumentResponse.storagePath,
      mimeType: uploadDocumentResponse.mimeType,
      encryptionMetadata: uploadDocumentResponse.encryptionMetadata,
    });
  });

  it('accepts an email-template attachment through the template slot', async () => {
    renderTab();
    const file = new File(['email template'], 'reply.eml', { type: 'message/rfc822' });
    const input = document.querySelector(
      'input[accept=".msg,.eml,.pdf,.html"]',
    ) as HTMLInputElement;

    expect(input).toHaveAttribute('accept', '.msg,.eml,.pdf,.html');
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(mocks.uploadDocument).toHaveBeenCalledWith(file));
    expect(mocks.createAttachment).toHaveBeenCalledWith(
      matrix.id,
      expect.objectContaining({ attachmentType: 'EMAIL_TEMPLATE' }),
    );
  });

  it('rejects an invalid offer extension and an attachment larger than 50 MB', async () => {
    renderTab();
    const input = document.querySelector('input[accept=".xlsx,.xls,.csv"]') as HTMLInputElement;
    const invalidFile = new File(['invalid'], 'offer.pdf', { type: 'application/pdf' });

    fireEvent.change(input, { target: { files: [invalidFile] } });
    expect(mocks.toastError).toHaveBeenCalledWith('matrices.invalidFormat');
    expect(mocks.uploadDocument).not.toHaveBeenCalled();

    const oversizedFile = new File(['small'], 'offer.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    Object.defineProperty(oversizedFile, 'size', {
      configurable: true,
      value: 50 * 1024 * 1024 + 1,
    });
    fireEvent.change(input, { target: { files: [oversizedFile] } });

    expect(mocks.toastError).toHaveBeenCalledWith('documentation.fileTooLarge');
    expect(mocks.uploadDocument).not.toHaveBeenCalled();
  });

  it('downloads and deletes an existing attachment only when delete permission exists', async () => {
    const user = userEvent.setup();
    const { unmount } = renderTab(true, [offerAttachment, emailAttachment]);

    const downloadButtons = screen.getAllByRole('button', { name: 'common.download' });
    await user.click(downloadButtons[0]);
    await user.click(screen.getAllByRole('button', { name: 'common.delete' })[0]);

    expect(mocks.downloadAttachment).toHaveBeenCalledWith(
      matrix.id,
      offerAttachment.id,
      'offer-matrix.xlsx',
    );
    expect(mocks.deleteAttachment).toHaveBeenCalledWith(matrix.id, offerAttachment.id);

    unmount();
    mocks.allowedPermissions.delete('matrix_attachments.delete');
    renderTab();
    expect(screen.queryByRole('button', { name: 'common.delete' })).not.toBeInTheDocument();
  });
});
