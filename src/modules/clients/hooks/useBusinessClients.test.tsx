import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clientListItemA, pageMeta } from '@/test/crm-fixtures.js';

const listBusinessClients = vi.hoisted(() => vi.fn());

vi.mock('../clients.service.js', () => ({ listBusinessClients }));

import { useBusinessClients } from './useBusinessClients.js';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useBusinessClients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listBusinessClients.mockResolvedValue({ data: [clientListItemA], meta: pageMeta });
  });

  it('builds the list request with search, ownership, status, and pagination filters', async () => {
    const { result } = renderHook(
      () =>
        useBusinessClients(2, {
          search: 'Acme',
          advisorId: '00000000-0000-4000-8000-000000000101',
          isActive: true,
          sortBy: 'businessName',
          sortOrder: 'desc',
          limit: 25,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(listBusinessClients).toHaveBeenCalled());
    await waitFor(() => expect(result.current.clients).toEqual([clientListItemA]));

    expect(listBusinessClients).toHaveBeenCalledWith({
      page: 2,
      search: 'Acme',
      advisorId: '00000000-0000-4000-8000-000000000101',
      isActive: true,
      sortBy: 'businessName',
      sortOrder: 'desc',
      limit: 25,
    });
    expect(result.current.clients).toEqual([clientListItemA]);
    expect(result.current.meta).toEqual(pageMeta);
  });
});
