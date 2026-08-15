import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  closingState,
  createNegotiationRequest,
  createVisitRequest,
  negotiationA,
  pageMeta,
  prospectState,
  visitType,
} from '@/test/crm-fixtures.js';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  requestPaginated: vi.fn(),
  post: vi.fn(),
}));

vi.mock('@/services/api.js', () => ({
  default: { post: mocks.post },
  request: mocks.request,
  requestPaginated: mocks.requestPaginated,
}));

import {
  changeNegotiationState,
  closeWithDocuments,
  createNegotiation,
  createVisit,
  deleteVisit,
  getNegotiation,
  getNegotiationHistory,
  getVisit,
  listNegotiationStates,
  listNegotiations,
  listVisits,
  listVisitTypes,
  updateNegotiation,
  updateVisit,
  verifyVisit,
} from './negotiations.service.js';

describe('negotiations service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.request.mockResolvedValue({});
    mocks.requestPaginated.mockResolvedValue({ data: [], meta: pageMeta });
  });

  it('lists negotiations with state, advisor, tier, and pagination filters', async () => {
    const query = {
      page: 2,
      limit: 10,
      stateId: prospectState.id,
      advisorId: createNegotiationRequest.advisorId,
      tierCode: 'SMALL' as const,
      sortOrder: 'asc' as const,
    };

    await listNegotiations(query);

    expect(mocks.requestPaginated).toHaveBeenCalledWith({
      method: 'GET',
      url: '/crm/negotiations',
      params: query,
    });
  });

  it('maps negotiation detail and state operations to their endpoints', async () => {
    await getNegotiation(negotiationA.id);
    await createNegotiation(createNegotiationRequest);
    await updateNegotiation(negotiationA.id, { observations: 'Updated notes.' });
    await changeNegotiationState(negotiationA.id, { stateId: closingState.id });
    await getNegotiationHistory(negotiationA.id);
    await listNegotiationStates({ page: 1, limit: 100, sortOrder: 'asc' });

    expect(mocks.request).toHaveBeenNthCalledWith(1, {
      method: 'GET',
      url: `/crm/negotiations/${negotiationA.id}`,
    });
    expect(mocks.request).toHaveBeenNthCalledWith(2, {
      method: 'POST',
      url: '/crm/negotiations',
      data: createNegotiationRequest,
    });
    expect(mocks.request).toHaveBeenNthCalledWith(3, {
      method: 'PATCH',
      url: `/crm/negotiations/${negotiationA.id}`,
      data: { observations: 'Updated notes.' },
    });
    expect(mocks.request).toHaveBeenNthCalledWith(4, {
      method: 'PATCH',
      url: `/crm/negotiations/${negotiationA.id}/state`,
      data: { stateId: closingState.id },
    });
    expect(mocks.request).toHaveBeenNthCalledWith(5, {
      method: 'GET',
      url: `/crm/negotiations/${negotiationA.id}/history`,
    });
    expect(mocks.requestPaginated).toHaveBeenNthCalledWith(1, {
      method: 'GET',
      url: '/crm/negotiation-states',
      params: { page: 1, limit: 100, sortOrder: 'asc' },
    });
  });

  it('maps visit list and mutation operations to their endpoints', async () => {
    const visitId = '00000000-0000-4000-8000-000000000501';
    const visitFilters = {
      page: 1,
      limit: 10,
      advisorId: createVisitRequest.advisorId,
      visitTypeId: visitType.id,
      isVerified: false,
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
      sortOrder: 'asc' as const,
    };

    await listVisits(visitFilters);
    await getVisit(visitId);
    await createVisit(createVisitRequest);
    await updateVisit(visitId, { observations: 'Updated visit notes.' });
    await verifyVisit(visitId, { isVerified: true, supervisorComment: 'Reviewed.' });
    await deleteVisit(visitId);
    await listVisitTypes({ page: 1, limit: 100, sortOrder: 'asc' });

    expect(mocks.requestPaginated).toHaveBeenNthCalledWith(1, {
      method: 'GET',
      url: '/crm/visits',
      params: visitFilters,
    });
    expect(mocks.request).toHaveBeenNthCalledWith(4, {
      method: 'PATCH',
      url: `/crm/visits/${visitId}/verify`,
      data: { isVerified: true, supervisorComment: 'Reviewed.' },
    });
    expect(mocks.request).toHaveBeenNthCalledWith(5, {
      method: 'DELETE',
      url: `/crm/visits/${visitId}`,
    });
    expect(mocks.requestPaginated).toHaveBeenNthCalledWith(2, {
      method: 'GET',
      url: '/crm/visit-types',
      params: { page: 1, limit: 100, sortOrder: 'asc' },
    });
  });

  it('builds the multipart close-with-documents request once per document', async () => {
    const firstFile = new File(['first'], 'proposal.pdf', { type: 'application/pdf' });
    const secondFile = new File(['second'], 'contract.pdf', { type: 'application/pdf' });
    mocks.post.mockResolvedValue({ data: { success: true, data: negotiationA } });

    await expect(
      closeWithDocuments(
        negotiationA.id,
        new Map([
          ['document-type-1', firstFile],
          ['document-type-2', secondFile],
        ]),
        'Closing package submitted.',
      ),
    ).resolves.toEqual(negotiationA);

    const [, formData, config] = mocks.post.mock.calls[0];
    expect(formData).toBeInstanceOf(FormData);
    expect(Array.from(formData.entries())).toEqual([
      ['files', firstFile],
      ['documentTypeIds', 'document-type-1'],
      ['files', secondFile],
      ['documentTypeIds', 'document-type-2'],
      ['notes', 'Closing package submitted.'],
    ]);
    expect(config).toEqual({ headers: { 'Content-Type': 'multipart/form-data' } });
  });

  it('rejects a close operation when the API reports an unsuccessful response', async () => {
    mocks.post.mockResolvedValue({ data: { success: false, data: null } });

    await expect(closeWithDocuments(negotiationA.id, new Map())).rejects.toThrow(
      'Close with documents failed',
    );
  });
});
