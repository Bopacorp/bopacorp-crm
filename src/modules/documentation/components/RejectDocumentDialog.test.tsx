import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pendingDocument, rejectedDocument } from '@/test/crm-phase4-fixtures.js';

const mocks = vi.hoisted(() => ({
  changeDocumentState: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));
vi.mock('../documentation.service.js', () => ({
  changeDocumentState: mocks.changeDocumentState,
}));

import { RejectDocumentDialog } from './RejectDocumentDialog.js';

function renderDialog(currentState: 'PENDING_APPROVAL' | 'REJECTED' = 'PENDING_APPROVAL') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onOpenChange = vi.fn();
  const onSuccess = vi.fn();

  render(
    <QueryClientProvider client={queryClient}>
      <RejectDocumentDialog
        open
        onOpenChange={onOpenChange}
        documentId={pendingDocument.id}
        currentState={currentState}
        onSuccess={onSuccess}
      />
    </QueryClientProvider>,
  );

  return { onOpenChange, onSuccess };
}

describe('RejectDocumentDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.changeDocumentState.mockResolvedValue(rejectedDocument);
  });

  it('requires a rejection reason before changing document state', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: 'common.reject' }));

    expect(mocks.changeDocumentState).not.toHaveBeenCalled();
    expect(await screen.findByText('This field is required')).toBeInTheDocument();
  });

  it('rejects a pending document with the coordinator message', async () => {
    const user = userEvent.setup();
    const { onSuccess } = renderDialog();

    await user.type(
      document.getElementById('coordinatorMessage') as HTMLTextAreaElement,
      'Missing signature.',
    );
    await user.click(screen.getByRole('button', { name: 'common.reject' }));

    await waitFor(() => expect(mocks.changeDocumentState).toHaveBeenCalledTimes(1));
    expect(mocks.changeDocumentState).toHaveBeenCalledWith(pendingDocument.id, {
      state: 'REJECTED',
      coordinatorMessage: 'Missing signature.',
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('keeps the dialog open and shows the API error when rejection fails', async () => {
    const user = userEvent.setup();
    const { onOpenChange, onSuccess } = renderDialog();
    mocks.changeDocumentState.mockRejectedValue(new Error('Document service unavailable'));

    await user.type(
      document.getElementById('coordinatorMessage') as HTMLTextAreaElement,
      'Missing signature.',
    );
    await user.click(screen.getByRole('button', { name: 'common.reject' }));

    expect(await screen.findByText('Document service unavailable')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('uses the state-change action when editing an already rejected document', () => {
    renderDialog('REJECTED');

    expect(screen.getByRole('button', { name: 'common.save' })).toBeInTheDocument();
    expect(screen.getByText('documentation.changeDocumentState')).toBeInTheDocument();
  });
});
