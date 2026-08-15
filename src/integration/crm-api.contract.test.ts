import { describe, expect, it } from 'vitest';
import {
  listCatalogItems,
  listCategories,
  listContactRequests,
} from '@/modules/catalog/catalog.service.js';
import { listBusinessClients } from '@/modules/clients/clients.service.js';
import {
  getPendingSummary,
  listDocuments,
  listDocumentTypes,
} from '@/modules/documentation/documentation.service.js';
import {
  listJobApplications,
  listVacancies,
} from '@/modules/employability/employability.service.js';
import {
  listNegotiationStates,
  listNegotiations,
  listVisits,
  listVisitTypes,
} from '@/modules/negotiations/negotiations.service.js';
import { listAdvisors } from '@/modules/org/org.service.js';
import {
  getAdvisorPerformance,
  listAdvisorMetrics,
  listExports,
  listRecentActivity,
  listTargets,
} from '@/modules/reports/reports.service.js';
import {
  authenticate,
  authorizationHeaders,
  httpRequest,
  isErrorEnvelope,
  jsonHeaders,
} from './support/api-test-client.js';

const missingId = '00000000-0000-0000-0000-000000000000';
const pageQuery = { page: 1, limit: 10, sortOrder: 'asc' as const };

describe('CRM API contracts', () => {
  it('reads the manager CRM, documents, employability, and reports collections', async () => {
    await authenticate('manager');

    const [clients, negotiations, visits, negotiationStates, visitTypes] = await Promise.all([
      listBusinessClients(pageQuery),
      listNegotiations(pageQuery),
      listVisits(pageQuery),
      listNegotiationStates(pageQuery),
      listVisitTypes(pageQuery),
    ]);
    const [documentTypes, documents, pendingSummary] = await Promise.all([
      listDocumentTypes(pageQuery),
      listDocuments(pageQuery),
      getPendingSummary(),
    ]);
    const [vacancies, applications] = await Promise.all([
      listVacancies(pageQuery),
      listJobApplications(pageQuery),
    ]);
    const [metrics, performance, activity, targets, exports] = await Promise.all([
      listAdvisorMetrics(),
      getAdvisorPerformance(),
      listRecentActivity(pageQuery),
      listTargets(),
      listExports(pageQuery),
    ]);

    for (const response of [
      clients,
      negotiations,
      visits,
      negotiationStates,
      visitTypes,
      documentTypes,
      documents,
      vacancies,
      applications,
      activity,
      exports,
    ]) {
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.meta).toEqual(
        expect.objectContaining({ page: 1, limit: 10, totalItems: expect.any(Number) }),
      );
    }

    expect(Array.isArray(pendingSummary)).toBe(true);
    expect(Array.isArray(metrics)).toBe(true);
    expect(Array.isArray(performance)).toBe(true);
    expect(Array.isArray(targets)).toBe(true);
  });

  it('reads catalog and contact administration as admin', async () => {
    await authenticate('admin');

    const [items, categories, contacts] = await Promise.all([
      listCatalogItems(pageQuery),
      listCategories(pageQuery),
      listContactRequests(pageQuery),
    ]);

    expect(Array.isArray(items.data)).toBe(true);
    expect(items.meta).toEqual(
      expect.objectContaining({ page: 1, limit: 10, totalItems: expect.any(Number) }),
    );

    expect(Array.isArray(categories.data)).toBe(true);
    // The API currently returns categories as a plain data array without pagination metadata.
    expect(categories.meta).toBeUndefined();

    expect(Array.isArray(contacts.data)).toBe(true);
    expect(contacts.meta).toEqual(
      expect.objectContaining({ page: 1, limit: 10, totalItems: expect.any(Number) }),
    );
  });

  it('enforces advisor ownership and supervisor scope on CRM lists', async () => {
    const advisor = await authenticate('advisor');
    const [advisorClients, advisorNegotiations, advisorVisits] = await Promise.all([
      listBusinessClients({ ...pageQuery, limit: 100 }),
      listNegotiations({ ...pageQuery, limit: 100 }),
      listVisits({ ...pageQuery, limit: 100 }),
    ]);

    expect(advisorClients.data.length).toBeGreaterThan(0);
    expect(advisorNegotiations.data.length).toBeGreaterThan(0);
    expect(advisorVisits.data.length).toBeGreaterThan(0);
    expect(advisorClients.data.every((item) => item.advisor?.id === advisor.id)).toBe(true);
    expect(advisorNegotiations.data.every((item) => item.advisor.id === advisor.id)).toBe(true);
    expect(advisorVisits.data.every((item) => item.advisor.id === advisor.id)).toBe(true);

    const supervisor = await authenticate('supervisor');
    const [supervisedAdvisors, supervisedClients] = await Promise.all([
      listAdvisors(supervisor.id, { page: 1, limit: 100, sortOrder: 'asc' }),
      listBusinessClients({ ...pageQuery, limit: 100 }),
    ]);
    const supervisedAdvisorIds = new Set(
      supervisedAdvisors.data.map((assignment) => assignment.advisorId),
    );

    expect(supervisedAdvisors.data.length).toBeGreaterThan(0);
    expect(supervisedClients.data.length).toBeGreaterThan(0);
    expect(
      supervisedClients.data.every(
        (item) => item.advisor !== null && supervisedAdvisorIds.has(item.advisor.id),
      ),
    ).toBe(true);
  });

  it('returns documented validation and not-found envelopes', async () => {
    await authenticate('manager');

    const invalidQuery = await httpRequest('/crm/business-clients?page=0&limit=101', {
      headers: authorizationHeaders(),
    });
    expect(invalidQuery.status).toBe(422);
    expect(isErrorEnvelope(invalidQuery.body)).toBe(true);
    if (!isErrorEnvelope(invalidQuery.body)) throw new Error('Expected an API error envelope');
    expect(invalidQuery.body.error.code).toBe('VALIDATION_ERROR');
    expect(invalidQuery.body.error.details).toEqual(expect.any(Array));

    const invalidBody = await httpRequest('/crm/business-clients', {
      method: 'POST',
      headers: { ...authorizationHeaders(), ...jsonHeaders() },
      body: JSON.stringify({}),
    });
    expect(invalidBody.status).toBe(422);
    expect(isErrorEnvelope(invalidBody.body)).toBe(true);
    if (!isErrorEnvelope(invalidBody.body)) throw new Error('Expected an API error envelope');
    expect(invalidBody.body.error.code).toBe('VALIDATION_ERROR');

    const missing = await httpRequest(`/crm/business-clients/${missingId}`, {
      headers: authorizationHeaders(),
    });
    expect(missing.status).toBe(404);
    expect(isErrorEnvelope(missing.body)).toBe(true);
    if (!isErrorEnvelope(missing.body)) throw new Error('Expected an API error envelope');
    expect(missing.body.error.code).toBe('RESOURCE_NOT_FOUND');

    await authenticate('admin');
    const categories = await listCategories(pageQuery);
    const category = categories.data[0];
    if (!category) throw new Error('The integration database must contain a category fixture');

    const conflict = await httpRequest(`/catalog/categories/${category.id}`, {
      method: 'PATCH',
      headers: { ...authorizationHeaders(), ...jsonHeaders() },
      body: JSON.stringify({ parentId: category.id }),
    });
    expect(conflict.status).toBe(409);
    expect(isErrorEnvelope(conflict.body)).toBe(true);
    if (!isErrorEnvelope(conflict.body)) throw new Error('Expected an API error envelope');
    expect(conflict.body.error.code).toBe('CONFLICT');
  });
});
