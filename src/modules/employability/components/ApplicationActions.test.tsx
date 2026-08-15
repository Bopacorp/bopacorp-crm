import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { application, applicationListItem } from '@/test/crm-phase6-fixtures.js';

const mocks = vi.hoisted(() => ({
  hasPermission: vi.fn(),
  updateJobApplication: vi.fn(),
  getJobApplication: vi.fn(),
  downloadCandidateResume: vi.fn(),
  toastError: vi.fn(),
  onSuccess: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('sonner', () => ({ toast: { error: mocks.toastError } }));
vi.mock('@/modules/auth/hooks/usePermission.js', () => ({
  usePermission: () => ({ hasPermission: mocks.hasPermission }),
}));
vi.mock('../employability.service.js', () => ({
  updateJobApplication: mocks.updateJobApplication,
  getJobApplication: mocks.getJobApplication,
  downloadCandidateResume: mocks.downloadCandidateResume,
}));
vi.mock('./RejectApplicationDialog.js', () => ({
  RejectApplicationDialog: ({ open }: { open: boolean }) =>
    open ? <div>reject-dialog</div> : null,
}));
vi.mock('@/components/ui/button.js', () => ({
  Button: ({
    children,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) => (
    <button {...props}>{children}</button>
  ),
}));
vi.mock('@/components/ui/dropdown-menu.js', () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('lucide-react', () => ({
  CheckCircle: () => <span />,
  Download: () => <span />,
  Loader2: () => <span />,
  MoreHorizontal: () => <span />,
  XCircle: () => <span />,
}));

import { ApplicationActions } from './ApplicationActions.js';

function renderActions(item = applicationListItem, canManage = true) {
  mocks.hasPermission.mockReturnValue(canManage);
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ApplicationActions application={item} onSuccess={mocks.onSuccess} />
    </QueryClientProvider>,
  );
}

describe('ApplicationActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateJobApplication.mockResolvedValue(application);
    mocks.getJobApplication.mockResolvedValue(application);
    mocks.downloadCandidateResume.mockResolvedValue(undefined);
  });

  it('hides actions when the user lacks permission and the application has no resume', () => {
    renderActions({ ...applicationListItem, hasResume: false }, false);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('marks a pending application as reviewed', async () => {
    const user = userEvent.setup();
    renderActions();

    await user.click(screen.getByRole('button', { name: 'common.actions' }));
    await user.click(screen.getByRole('button', { name: 'employability.markReviewed' }));

    await waitFor(() =>
      expect(mocks.updateJobApplication).toHaveBeenCalledWith(applicationListItem.id, {
        state: 'ACCEPTED',
      }),
    );
    expect(mocks.onSuccess).toHaveBeenCalledOnce();
  });

  it('retrieves the application and downloads its resume', async () => {
    const user = userEvent.setup();
    renderActions({ ...applicationListItem, state: 'ACCEPTED' }, false);

    await user.click(screen.getByRole('button', { name: 'common.actions' }));
    await user.click(screen.getByRole('button', { name: 'employability.downloadCV' }));

    await waitFor(() =>
      expect(mocks.downloadCandidateResume).toHaveBeenCalledWith(
        application.resume?.id,
        application.resume?.filename,
      ),
    );
    expect(mocks.getJobApplication).toHaveBeenCalledWith(applicationListItem.id);
  });

  it('opens rejection flow for a pending application', async () => {
    const user = userEvent.setup();
    renderActions();

    await user.click(screen.getByRole('button', { name: 'common.actions' }));
    await user.click(screen.getByRole('button', { name: 'common.reject' }));

    expect(screen.getByText('reject-dialog')).toBeInTheDocument();
  });
});
