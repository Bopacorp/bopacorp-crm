import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { employee } from '@/test/crm-phase6-fixtures.js';

const mocks = vi.hoisted(() => ({
  unlockUser: vi.fn(),
  toastSuccess: vi.fn(),
  onOpenChange: vi.fn(),
  onSuccess: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('sonner', () => ({ toast: { success: mocks.toastSuccess } }));
vi.mock('../users.service.js', () => ({ unlockUser: mocks.unlockUser }));
vi.mock('@/components/ui/button.js', () => ({
  Button: ({
    children,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}));
vi.mock('@/components/ui/dialog.js', () => ({
  Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h1>{children}</h1>,
}));
vi.mock('@/components/ui/field.js', () => ({
  Field: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  FieldError: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  FieldGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  FieldLabel: ({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) => (
    <label htmlFor={htmlFor}>{children}</label>
  ),
}));
vi.mock('@/components/ui/textarea.js', () => ({
  Textarea: (props: InputHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} />,
}));
vi.mock('@/shared/ui', () => ({
  FormAlert: ({ message }: { message: string }) => <div role="alert">{message}</div>,
}));

import { UnlockAccountDialog } from './UnlockAccountDialog.js';

function renderDialog() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <UnlockAccountDialog
        open
        onOpenChange={mocks.onOpenChange}
        onSuccess={mocks.onSuccess}
        userId={employee.userId}
      />
    </QueryClientProvider>,
  );
}

describe('UnlockAccountDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.unlockUser.mockResolvedValue({ unlocked: true });
  });

  it('rejects a reason shorter than ten characters', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText('org.unlockReason'), 'Too short');
    await user.click(screen.getByRole('button', { name: 'org.unlockAccount' }));

    await waitFor(() => expect(mocks.unlockUser).not.toHaveBeenCalled());
  });

  it('unlocks the account with a valid reason and closes the dialog', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(
      screen.getByLabelText('org.unlockReason'),
      'Confirmed identity with the manager.',
    );
    await user.click(screen.getByRole('button', { name: 'org.unlockAccount' }));

    await waitFor(() =>
      expect(mocks.unlockUser).toHaveBeenCalledWith(employee.userId, {
        reason: 'Confirmed identity with the manager.',
      }),
    );
    expect(mocks.onOpenChange).toHaveBeenCalledWith(false);
    expect(mocks.onSuccess).toHaveBeenCalledOnce();
    expect(mocks.toastSuccess).toHaveBeenCalledWith('org.accountUnlocked');
  });
});
