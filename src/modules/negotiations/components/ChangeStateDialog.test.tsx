import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  closingState,
  deniedState,
  negotiationA,
  pageMeta,
  prospectState,
} from '@/test/crm-fixtures.js';
import { mandatoryDocumentType } from '@/test/crm-phase4-fixtures.js';

const mocks = vi.hoisted(() => ({
  useNegotiationStates: vi.fn(),
  useActiveDocumentTypes: vi.fn(),
  listDocuments: vi.fn(),
  changeNegotiationState: vi.fn(),
  closeWithDocuments: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));
vi.mock('../hooks/useNegotiationStates.js', () => ({
  useNegotiationStates: mocks.useNegotiationStates,
}));
vi.mock('@/modules/documentation/hooks/useDocumentTypes.js', () => ({
  useActiveDocumentTypes: mocks.useActiveDocumentTypes,
}));
vi.mock('@/modules/documentation/documentation.service.js', () => ({
  listDocuments: mocks.listDocuments,
}));
vi.mock('../negotiations.service.js', () => ({
  changeNegotiationState: mocks.changeNegotiationState,
  closeWithDocuments: mocks.closeWithDocuments,
}));

import { ChangeStateDialog } from './ChangeStateDialog.js';

function renderDialog(targetStateId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onOpenChange = vi.fn();
  const onSuccess = vi.fn();

  render(
    <QueryClientProvider client={queryClient}>
      <ChangeStateDialog
        open
        onOpenChange={onOpenChange}
        negotiationId={negotiationA.id}
        currentStateId={prospectState.id}
        targetStateId={targetStateId}
        onSuccess={onSuccess}
      />
    </QueryClientProvider>,
  );

  return { onOpenChange, onSuccess };
}

describe('ChangeStateDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useNegotiationStates.mockReturnValue({
      states: [prospectState, closingState, deniedState],
    });
    mocks.useActiveDocumentTypes.mockReturnValue([]);
    mocks.listDocuments.mockResolvedValue({ data: [], meta: pageMeta });
    mocks.changeNegotiationState.mockResolvedValue(negotiationA);
    mocks.closeWithDocuments.mockResolvedValue(negotiationA);
  });

  it('requires notes when moving a negotiation to denied', async () => {
    const user = userEvent.setup();
    const { onSuccess } = renderDialog(deniedState.id);

    await user.click(screen.getByRole('button', { name: 'common.confirm' }));

    expect(mocks.changeNegotiationState).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(await screen.findByText('negotiations.notesRequiredForDenied')).toBeInTheDocument();
  });

  it('submits a valid state transition with trimmed optional notes', async () => {
    const user = userEvent.setup();
    const { onSuccess } = renderDialog(deniedState.id);

    await user.type(
      document.getElementById('change-state-notes') as HTMLTextAreaElement,
      'Lost to competitor',
    );
    await user.click(screen.getByRole('button', { name: 'common.confirm' }));

    await waitFor(() => expect(mocks.changeNegotiationState).toHaveBeenCalledTimes(1));
    expect(mocks.changeNegotiationState).toHaveBeenCalledWith(negotiationA.id, {
      stateId: deniedState.id,
      notes: 'Lost to competitor',
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('keeps the dialog open and reports a failed state transition', async () => {
    const user = userEvent.setup();
    const { onOpenChange, onSuccess } = renderDialog(deniedState.id);
    mocks.changeNegotiationState.mockRejectedValue(new Error('Server unavailable'));

    await user.type(
      document.getElementById('change-state-notes') as HTMLTextAreaElement,
      'Lost to competitor',
    );
    await user.click(screen.getByRole('button', { name: 'common.confirm' }));

    expect(await screen.findByText('Server unavailable')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('disables closing until every mandatory document is supplied', async () => {
    mocks.useActiveDocumentTypes.mockReturnValue([
      {
        id: '00000000-0000-4000-8000-000000000701',
        code: 'contract',
        name: 'Signed contract',
        description: null,
        isMandatory: true,
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
    ]);
    const user = userEvent.setup();
    renderDialog(closingState.id);

    expect(await screen.findByText('negotiations.mandatoryDocsRequired')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'common.confirm' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'common.confirm' }));
    expect(mocks.closeWithDocuments).not.toHaveBeenCalled();
  });

  it('uploads missing mandatory documents and closes the negotiation once', async () => {
    mocks.useActiveDocumentTypes.mockReturnValue([mandatoryDocumentType]);
    const user = userEvent.setup();
    const { onSuccess } = renderDialog(closingState.id);
    const file = new File(['signed contract'], 'signed-contract.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(document.getElementById('doc-file-signed-contract') as HTMLInputElement, {
      target: { files: [file] },
    });
    await user.type(
      document.getElementById('change-state-notes') as HTMLTextAreaElement,
      'Closing package submitted.',
    );
    await user.click(screen.getByRole('button', { name: 'common.confirm' }));

    await waitFor(() => expect(mocks.closeWithDocuments).toHaveBeenCalledTimes(1));
    const [negotiationId, files, notes] = mocks.closeWithDocuments.mock.calls[0];
    expect(negotiationId).toBe(negotiationA.id);
    expect(files).toBeInstanceOf(Map);
    expect(files.get(mandatoryDocumentType.id)).toBe(file);
    expect(notes).toBe('Closing package submitted.');
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(mocks.changeNegotiationState).not.toHaveBeenCalled();
  });

  it('keeps the closing dialog open when the backend rejects the document package', async () => {
    mocks.useActiveDocumentTypes.mockReturnValue([mandatoryDocumentType]);
    mocks.closeWithDocuments.mockRejectedValue(new Error('Missing document type'));
    const user = userEvent.setup();
    const { onOpenChange, onSuccess } = renderDialog(closingState.id);
    const file = new File(['signed contract'], 'signed-contract.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(document.getElementById('doc-file-signed-contract') as HTMLInputElement, {
      target: { files: [file] },
    });
    await user.click(screen.getByRole('button', { name: 'common.confirm' }));

    expect(await screen.findByText('Missing document type')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
