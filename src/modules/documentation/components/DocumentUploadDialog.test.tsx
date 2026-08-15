import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { negotiationA, pageMeta } from '@/test/crm-fixtures.js';
import { mandatoryDocumentType, uploadDocumentResponse } from '@/test/crm-phase4-fixtures.js';

const mocks = vi.hoisted(() => ({
  useActiveDocumentTypes: vi.fn(),
  useNegotiations: vi.fn(),
  uploadDocument: vi.fn(),
  createDocument: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));
vi.mock('../hooks/useDocumentTypes.js', () => ({
  useActiveDocumentTypes: mocks.useActiveDocumentTypes,
}));
vi.mock('@/modules/negotiations/hooks/useNegotiations.js', () => ({
  useNegotiations: mocks.useNegotiations,
}));
vi.mock('../documentation.service.js', () => ({
  uploadDocument: mocks.uploadDocument,
  createDocument: mocks.createDocument,
}));
vi.mock('@/components/ui/select.js', () => {
  function Select({
    children,
    value,
    onValueChange,
  }: {
    children: ReactNode;
    value: string;
    onValueChange: (value: string) => void;
  }) {
    return (
      <select value={value} onChange={(event) => onValueChange(event.target.value)}>
        {children}
      </select>
    );
  }

  function SelectContent({ children }: { children: ReactNode }) {
    return <>{children}</>;
  }

  function SelectItem({ value, children }: { value: string; children: ReactNode }) {
    return <option value={value}>{children}</option>;
  }

  return {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger: () => null,
    SelectValue: () => null,
  };
});

import { DocumentUploadDialog } from './DocumentUploadDialog.js';

function renderDialog() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onOpenChange = vi.fn();
  const onSuccess = vi.fn();

  render(
    <QueryClientProvider client={queryClient}>
      <DocumentUploadDialog
        open
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
        negotiationId={negotiationA.id}
      />
    </QueryClientProvider>,
  );

  return { onOpenChange, onSuccess };
}

function selectDocumentType() {
  fireEvent.change(screen.getByRole('combobox'), {
    target: { value: mandatoryDocumentType.id },
  });
}

function selectFile(file: File) {
  fireEvent.change(document.getElementById('document-file') as HTMLInputElement, {
    target: { files: [file] },
  });
}

describe('DocumentUploadDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useActiveDocumentTypes.mockReturnValue([mandatoryDocumentType]);
    mocks.useNegotiations.mockReturnValue({ negotiations: [], meta: pageMeta, fetching: false });
    mocks.uploadDocument.mockResolvedValue(uploadDocumentResponse);
    mocks.createDocument.mockResolvedValue({ id: 'document-created' });
  });

  it.each([
    ['pdf', 'application/pdf'],
    ['jpg', 'image/jpeg'],
    ['png', 'image/png'],
  ])('accepts a valid %s document and creates its pending record', async (extension, mimeType) => {
    const user = userEvent.setup();
    const { onSuccess } = renderDialog();
    const file = new File(['valid document'], `proposal.${extension}`, { type: mimeType });

    selectDocumentType();
    selectFile(file);
    await user.click(screen.getByRole('button', { name: 'documentation.uploadDocument' }));

    await waitFor(() => expect(mocks.uploadDocument).toHaveBeenCalledWith(file));
    expect(mocks.createDocument).toHaveBeenCalledWith({
      negotiationId: negotiationA.id,
      documentTypeId: mandatoryDocumentType.id,
      filename: uploadDocumentResponse.filename,
      fileExtension: uploadDocumentResponse.fileExtension,
      fileSizeMb: uploadDocumentResponse.fileSizeMb,
      storagePath: uploadDocumentResponse.storagePath,
      mimeType: uploadDocumentResponse.mimeType,
      encryptionMetadata: uploadDocumentResponse.encryptionMetadata,
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('requires a document type and file before uploading', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: 'documentation.uploadDocument' }));

    expect(mocks.uploadDocument).not.toHaveBeenCalled();
    expect(await screen.findAllByText('This field is required')).toHaveLength(2);
  });

  it('rejects an unsupported extension before calling the upload service', async () => {
    renderDialog();

    selectDocumentType();
    selectFile(new File(['malware'], 'proposal.exe', { type: 'application/octet-stream' }));

    expect(await screen.findByText('documentation.invalidFileType')).toBeInTheDocument();
    expect(mocks.uploadDocument).not.toHaveBeenCalled();
  });

  it('rejects a file larger than 50 MB before uploading', async () => {
    const user = userEvent.setup();
    renderDialog();
    const oversizedFile = new File(['small'], 'proposal.pdf', { type: 'application/pdf' });
    Object.defineProperty(oversizedFile, 'size', {
      configurable: true,
      value: 50 * 1024 * 1024 + 1,
    });

    selectDocumentType();
    selectFile(oversizedFile);
    await user.click(screen.getByRole('button', { name: 'documentation.uploadDocument' }));

    expect(await screen.findByText('documentation.fileTooLarge')).toBeInTheDocument();
    expect(mocks.uploadDocument).not.toHaveBeenCalled();
  });
});
