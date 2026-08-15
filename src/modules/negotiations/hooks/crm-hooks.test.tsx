import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { negotiationListItemA, pageMeta, visitListItemA } from '@/test/crm-fixtures.js';

const mocks = vi.hoisted(() => ({
  listNegotiations: vi.fn(),
  listVisits: vi.fn(),
}));

vi.mock('../negotiations.service.js', () => ({
  listNegotiations: mocks.listNegotiations,
  listVisits: mocks.listVisits,
}));

import { useNegotiations } from './useNegotiations.js';
import { useVisits } from './useVisits.js';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('CRM negotiation and visit hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listNegotiations.mockResolvedValue({ data: [negotiationListItemA], meta: pageMeta });
    mocks.listVisits.mockResolvedValue({ data: [visitListItemA], meta: pageMeta });
  });

  it('passes negotiation filters to the paginated service', async () => {
    const { result } = renderHook(
      () =>
        useNegotiations(3, {
          search: 'Acme',
          stateId: '00000000-0000-4000-8000-000000000401',
          advisorId: '00000000-0000-4000-8000-000000000101',
          tierCode: 'A',
          sortBy: 'startDate',
          sortOrder: 'desc',
          limit: 20,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(mocks.listNegotiations).toHaveBeenCalled());
    await waitFor(() => expect(result.current.negotiations).toEqual([negotiationListItemA]));

    expect(mocks.listNegotiations).toHaveBeenCalledWith({
      page: 3,
      search: 'Acme',
      stateId: '00000000-0000-4000-8000-000000000401',
      advisorId: '00000000-0000-4000-8000-000000000101',
      tierCode: 'A',
      sortBy: 'startDate',
      sortOrder: 'desc',
      limit: 20,
    });
    expect(result.current.negotiations).toEqual([negotiationListItemA]);
  });

  it('passes visit ownership, verification, type, and date filters', async () => {
    const { result } = renderHook(
      () =>
        useVisits(1, {
          clientId: '00000000-0000-4000-8000-000000000201',
          advisorId: '00000000-0000-4000-8000-000000000101',
          visitTypeId: '00000000-0000-4000-8000-000000000601',
          isVerified: false,
          dateFrom: '2026-01-01',
          dateTo: '2026-01-31',
          limit: 15,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(mocks.listVisits).toHaveBeenCalled());
    await waitFor(() => expect(result.current.visits).toEqual([visitListItemA]));

    expect(mocks.listVisits).toHaveBeenCalledWith({
      page: 1,
      limit: 15,
      sortOrder: 'asc',
      clientId: '00000000-0000-4000-8000-000000000201',
      advisorId: '00000000-0000-4000-8000-000000000101',
      visitTypeId: '00000000-0000-4000-8000-000000000601',
      isVerified: false,
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });
    expect(result.current.visits).toEqual([visitListItemA]);
  });
});
