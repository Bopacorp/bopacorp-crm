import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ButtonHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PHASE6_TEST_IDS } from '@/test/crm-phase6-fixtures.js';

const mocks = vi.hoisted(() => ({
  updateJobApplication: vi.fn(),
  onOpenChange: vi.fn(),
  onSuccess: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('sonner', () => ({ toast: { success: mocks.toastSuccess } }));
vi.mock('../employability.service.js', () => ({
  updateJobApplication: mocks.updateJobApplication,
}));
vi.mock('@/components/ui/button.js', () => ({
  Button: ({
    children,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) => (
    <button {...props}>{children}</button>
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
  FieldError: ({ children }: { children?: ReactNode }) => <div role="alert">{children}</div>,
  FieldGroup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  FieldLabel: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));
vi.mock('@/components/ui/textarea.js', () => ({
  Textarea: forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
    (props, ref) => <textarea ref={ref} {...props} />,
  ),
}));
vi.mock('@/shared/ui', () => ({
  FormAlert: ({ message }: { message: string }) => <div role="alert">{message}</div>,
}));
vi.mock('lucide-react', () => ({ Loader2: () => <span /> }));

import { RejectApplicationDialog } from './RejectApplicationDialog.js';

function renderDialog() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <RejectApplicationDialog
        open
        onOpenChange={mocks.onOpenChange}
        applicationId={PHASE6_TEST_IDS.application}
        onSuccess={mocks.onSuccess}
      />
    </QueryClientProvider>,
  );
}

describe('RejectApplicationDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateJobApplication.mockResolvedValue({ id: PHASE6_TEST_IDS.application });
  });

  it('requires review notes before rejecting an application', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: 'common.reject' }));

    await waitFor(() => expect(mocks.updateJobApplication).not.toHaveBeenCalled());
  });

  it('rejects with notes and closes the dialog after success', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(
      screen.getByPlaceholderText('employability.reviewNotesPlaceholder'),
      'The experience does not match this vacancy.',
    );
    await user.click(screen.getByRole('button', { name: 'common.reject' }));

    await waitFor(() =>
      expect(mocks.updateJobApplication).toHaveBeenCalledWith(PHASE6_TEST_IDS.application, {
        state: 'REJECTED',
        reviewNotes: 'The experience does not match this vacancy.',
      }),
    );
    expect(mocks.onOpenChange).toHaveBeenCalledWith(false);
    expect(mocks.onSuccess).toHaveBeenCalledOnce();
    expect(mocks.toastSuccess).toHaveBeenCalledWith('employability.applicationRejected');
  });

  it('supports cancelling without calling the service', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole('button', { name: 'common.cancel' }));

    expect(mocks.onOpenChange).toHaveBeenCalledWith(false);
    expect(mocks.updateJobApplication).not.toHaveBeenCalled();
  });
});
