import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pendingDocument, rejectedDocument } from '@/test/crm-phase4-fixtures.js';

const mocks = vi.hoisted(() => ({
  hasPermission: vi.fn(),
  mutate: vi.fn(),
  downloadDocument: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));
vi.mock('@/modules/auth/hooks/usePermission.js', () => ({
  usePermission: () => ({ hasPermission: mocks.hasPermission }),
}));
vi.mock('../hooks/useChangeDocumentState.js', () => ({
  useChangeDocumentState: () => ({ mutate: mocks.mutate, isPending: false }),
}));
vi.mock('../documentation.service.js', () => ({
  downloadDocument: mocks.downloadDocument,
}));
vi.mock('./RejectDocumentDialog.js', () => ({
  RejectDocumentDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="reject-dialog">reject-dialog</div> : null,
}));
vi.mock('@/components/ui/dropdown-menu.js', () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import { DocumentActions } from './DocumentActions.js';

describe('DocumentActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hasPermission.mockReturnValue(true);
  });

  it('allows an authorized reviewer to approve a pending document', async () => {
    const user = userEvent.setup();
    render(<DocumentActions document={pendingDocument} />);

    await user.click(screen.getByRole('button', { name: 'common.approve' }));

    expect(mocks.mutate).toHaveBeenCalledWith(
      { id: pendingDocument.id, data: { state: 'ACCEPTED' } },
      expect.any(Object),
    );
  });

  it('hides state actions for users without document-state permission', () => {
    mocks.hasPermission.mockReturnValue(false);
    render(<DocumentActions document={pendingDocument} />);

    expect(screen.queryByRole('button', { name: 'common.approve' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'common.reject' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'documentation.download' })).toBeInTheDocument();
  });

  it('opens the state-change dialog for a rejected document and downloads files', async () => {
    const user = userEvent.setup();
    render(<DocumentActions document={rejectedDocument} />);

    await user.click(screen.getByRole('button', { name: 'documentation.changeDocumentState' }));
    expect(screen.getByTestId('reject-dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'documentation.download' }));
    expect(mocks.downloadDocument).toHaveBeenCalledWith(
      rejectedDocument.id,
      rejectedDocument.filename,
    );
  });
});
