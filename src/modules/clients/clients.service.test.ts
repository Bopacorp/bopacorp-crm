import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createClientRequest } from '@/test/crm-fixtures.js';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  requestPaginated: vi.fn(),
}));

vi.mock('@/services/api.js', () => ({
  request: mocks.request,
  requestPaginated: mocks.requestPaginated,
}));

import {
  createBusinessClient,
  deleteBusinessClient,
  getBusinessClient,
  listBusinessClients,
  updateBusinessClient,
} from './clients.service.js';

describe('clients service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lists clients with the current pagination and ownership filters', async () => {
    const query = {
      page: 2,
      limit: 10,
      search: 'Acme',
      advisorId: createClientRequest.advisorId,
      isActive: true,
      sortOrder: 'asc' as const,
    };
    mocks.requestPaginated.mockResolvedValue({ data: [], meta: undefined });

    await listBusinessClients(query);

    expect(mocks.requestPaginated).toHaveBeenCalledWith({
      method: 'GET',
      url: '/crm/business-clients',
      params: query,
    });
  });

  it('maps detail, create, update, and delete operations to the API contract', async () => {
    mocks.request.mockResolvedValue({ id: 'client-1' });

    await getBusinessClient('client-1');
    await createBusinessClient(createClientRequest);
    await updateBusinessClient('client-1', { isActive: false });
    await deleteBusinessClient('client-1');

    expect(mocks.request).toHaveBeenNthCalledWith(1, {
      method: 'GET',
      url: '/crm/business-clients/client-1',
    });
    expect(mocks.request).toHaveBeenNthCalledWith(2, {
      method: 'POST',
      url: '/crm/business-clients',
      data: createClientRequest,
    });
    expect(mocks.request).toHaveBeenNthCalledWith(3, {
      method: 'PATCH',
      url: '/crm/business-clients/client-1',
      data: { isActive: false },
    });
    expect(mocks.request).toHaveBeenNthCalledWith(4, {
      method: 'DELETE',
      url: '/crm/business-clients/client-1',
    });
  });
});
