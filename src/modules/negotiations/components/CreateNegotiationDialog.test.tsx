import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  advisorA,
  advisorB,
  clientListItemA,
  negotiationA,
  pageMeta,
} from '@/test/crm-fixtures.js';
import type { NegotiationFormValues } from './NegotiationForm.js';

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useAdvisors: vi.fn(),
  useBusinessClients: vi.fn(),
  createNegotiation: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  initReactI18next: { type: '3rdParty', init: () => {} },
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));
vi.mock('@/modules/auth/context/AuthContext.js', () => ({ useAuth: mocks.useAuth }));
vi.mock('@/modules/org/hooks/useAdvisors.js', () => ({ useAdvisors: mocks.useAdvisors }));
vi.mock('@/modules/clients/hooks/useBusinessClients.js', () => ({
  useBusinessClients: mocks.useBusinessClients,
}));
vi.mock('@/modules/clients/components/CreateBusinessClientDialog.js', () => ({
  CreateBusinessClientDialog: () => null,
}));
vi.mock('./NegotiationForm.js', () => ({
  NegotiationForm: ({ onSubmit }: { onSubmit: (values: NegotiationFormValues) => void }) => (
    <button
      type="button"
      onClick={() =>
        onSubmit({
          clientId: clientListItemA.id,
          advisorId: advisorB.userId,
          startDate: '2026-01-03',
          estimatedCloseDate: '2026-01-31',
          observations: 'Initial discovery completed.',
          isActive: true,
        })
      }
    >
      submit-negotiation
    </button>
  ),
}));
vi.mock('../negotiations.service.js', () => ({ createNegotiation: mocks.createNegotiation }));

import { CreateNegotiationDialog } from './CreateNegotiationDialog.js';

function renderDialog(role: 'advisor' | 'manager') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const onOpenChange = vi.fn();
  const onSuccess = vi.fn();
  mocks.useAuth.mockReturnValue({
    user: { id: advisorA.userId },
    hasRole: (requestedRole: string) => requestedRole === role,
  });
  mocks.useAdvisors.mockReturnValue({ advisors: [advisorA, advisorB] });
  mocks.useBusinessClients.mockReturnValue({
    clients: [clientListItemA],
    meta: pageMeta,
    fetching: false,
  });

  render(
    <QueryClientProvider client={queryClient}>
      <CreateNegotiationDialog open onOpenChange={onOpenChange} onSuccess={onSuccess} />
    </QueryClientProvider>,
  );

  return { onSuccess };
}

describe('CreateNegotiationDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createNegotiation.mockResolvedValue(negotiationA);
  });

  it('forces advisor ownership for advisor users', async () => {
    const { onSuccess } = renderDialog('advisor');

    await screen.getByRole('button', { name: 'submit-negotiation' }).click();

    await waitFor(() => expect(mocks.createNegotiation).toHaveBeenCalledTimes(1));
    expect(mocks.createNegotiation).toHaveBeenCalledWith({
      clientId: clientListItemA.id,
      advisorId: advisorA.userId,
      startDate: '2026-01-03',
      estimatedCloseDate: '2026-01-31',
      observations: 'Initial discovery completed.',
      isActive: true,
    });
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('preserves the selected advisor for management users', async () => {
    renderDialog('manager');

    await screen.getByRole('button', { name: 'submit-negotiation' }).click();

    await waitFor(() => expect(mocks.createNegotiation).toHaveBeenCalledTimes(1));
    expect(mocks.createNegotiation).toHaveBeenCalledWith({
      clientId: clientListItemA.id,
      advisorId: advisorB.userId,
      startDate: '2026-01-03',
      estimatedCloseDate: '2026-01-31',
      observations: 'Initial discovery completed.',
      isActive: true,
    });
  });
});
