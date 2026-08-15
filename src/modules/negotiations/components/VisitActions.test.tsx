import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { visitListItemA } from '@/test/crm-fixtures.js';

const mocks = vi.hoisted(() => ({
  usePermission: vi.fn(),
  verifyVisit: vi.fn(),
  deleteVisit: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));
vi.mock('@/modules/auth/hooks/usePermission.js', () => ({ usePermission: mocks.usePermission }));
vi.mock('../negotiations.service.js', () => ({
  verifyVisit: mocks.verifyVisit,
  deleteVisit: mocks.deleteVisit,
}));

import { VisitActions } from './VisitActions.js';

function renderActions(permissions: string[]) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onSuccess = vi.fn();
  mocks.usePermission.mockReturnValue({
    hasPermission: (permission: string) => permissions.includes(permission),
  });

  render(
    <QueryClientProvider client={queryClient}>
      <VisitActions visit={visitListItemA} onSuccess={onSuccess} />
    </QueryClientProvider>,
  );

  return { onSuccess };
}

describe('VisitActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyVisit.mockResolvedValue({ ...visitListItemA, isVerified: true });
    mocks.deleteVisit.mockResolvedValue(undefined);
  });

  it('hides actions when the current user cannot verify or delete visits', () => {
    renderActions([]);

    expect(screen.queryByRole('button', { name: 'visits.actions' })).not.toBeInTheDocument();
  });

  it('allows a permitted supervisor to verify an unverified visit', async () => {
    const user = userEvent.setup();
    const { onSuccess } = renderActions(['visits.verify']);

    await user.click(screen.getByRole('button', { name: 'visits.actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'visits.verify' }));
    await user.type(screen.getByPlaceholderText('visits.supervisorComment'), 'Reviewed onsite.');
    await user.click(screen.getByRole('button', { name: 'visits.verify' }));

    await waitFor(() => expect(mocks.verifyVisit).toHaveBeenCalledTimes(1));
    expect(mocks.verifyVisit).toHaveBeenCalledWith(visitListItemA.id, {
      isVerified: true,
      supervisorComment: 'Reviewed onsite.',
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('allows deletion only when the delete permission is present', async () => {
    const user = userEvent.setup();
    const { onSuccess } = renderActions(['visits.delete']);

    await user.click(screen.getByRole('button', { name: 'visits.actions' }));
    await user.click(screen.getByRole('menuitem', { name: 'common.delete' }));
    await user.click(screen.getByRole('button', { name: 'common.delete' }));

    await waitFor(() => expect(mocks.deleteVisit).toHaveBeenCalledWith(visitListItemA.id));
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });
});
