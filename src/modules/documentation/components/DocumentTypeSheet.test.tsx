import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { optionalDocumentType } from '@/test/crm-phase4-fixtures.js';

const mocks = vi.hoisted(() => ({
  createDocumentType: vi.fn(),
  getDocumentType: vi.fn(),
  updateDocumentType: vi.fn(),
  disableDocumentType: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));
vi.mock('../documentation.service.js', () => ({
  createDocumentType: mocks.createDocumentType,
  getDocumentType: mocks.getDocumentType,
  updateDocumentType: mocks.updateDocumentType,
  disableDocumentType: mocks.disableDocumentType,
}));
vi.mock('@/modules/auth/components/Can.js', () => ({
  Can: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess, error: mocks.toastError },
}));

import { DocumentTypeSheet } from './DocumentTypeSheet.js';

function renderCreateSheet() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onOpenChange = vi.fn();

  render(
    <QueryClientProvider client={queryClient}>
      <DocumentTypeSheet open onOpenChange={onOpenChange} entityId={null} mode="create" />
    </QueryClientProvider>,
  );

  return { onOpenChange };
}

describe('DocumentTypeSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'ResizeObserver',
      class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    mocks.createDocumentType.mockResolvedValue(optionalDocumentType);
    mocks.getDocumentType.mockResolvedValue(optionalDocumentType);
    mocks.updateDocumentType.mockResolvedValue(optionalDocumentType);
    mocks.disableDocumentType.mockResolvedValue({ ...optionalDocumentType, isActive: false });
  });

  it('creates a document type with normalized code and default flags', async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderCreateSheet();

    await user.type(screen.getByRole('textbox', { name: /common.code/i }), 'proposal');
    await user.type(screen.getByRole('textbox', { name: /common.name/i }), 'Commercial proposal');
    await user.click(screen.getByRole('button', { name: 'common.create' }));

    await waitFor(() => expect(mocks.createDocumentType).toHaveBeenCalledTimes(1));
    expect(mocks.createDocumentType).toHaveBeenCalledWith({
      code: 'PROPOSAL',
      name: 'Commercial proposal',
      description: undefined,
      isMandatory: false,
      isActive: true,
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not create a type when required fields are empty', async () => {
    const user = userEvent.setup();
    renderCreateSheet();

    await user.click(screen.getByRole('button', { name: 'common.create' }));

    expect(mocks.createDocumentType).not.toHaveBeenCalled();
    expect(await screen.findAllByText('This field is required')).toHaveLength(2);
  });
});
