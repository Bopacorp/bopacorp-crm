import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  reportExport,
  reportMetricA,
  reportPageResult,
  reportPerformanceA,
  reportTarget,
} from '@/test/crm-phase5-fixtures.js';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  requestPaginated: vi.fn(),
}));

vi.mock('@/services/api.js', () => ({
  request: mocks.request,
  requestPaginated: mocks.requestPaginated,
}));

import {
  createExport,
  getAdvisorPerformance,
  listAdvisorMetrics,
  listExports,
  listRecentActivity,
  listTargets,
  updateTarget,
} from './reports.service.js';

describe('reports service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.request.mockResolvedValue({});
    mocks.requestPaginated.mockResolvedValue(reportPageResult);
  });

  it('maps metric and performance queries to the report endpoints', async () => {
    const metricsQuery = {
      advisorId: reportMetricA.advisor.id,
      dateFrom: '2026-02-01',
      dateTo: '2026-02-28',
    };
    const performanceQuery = { supervisorId: reportPerformanceA.advisor.id };

    mocks.request
      .mockResolvedValueOnce([reportMetricA])
      .mockResolvedValueOnce([reportPerformanceA]);

    await expect(listAdvisorMetrics(metricsQuery)).resolves.toEqual([reportMetricA]);
    await expect(getAdvisorPerformance(performanceQuery)).resolves.toEqual([reportPerformanceA]);

    expect(mocks.request).toHaveBeenNthCalledWith(1, {
      method: 'GET',
      url: '/reports/advisor-metrics',
      params: metricsQuery,
    });
    expect(mocks.request).toHaveBeenNthCalledWith(2, {
      method: 'GET',
      url: '/reports/advisor-performance',
      params: performanceQuery,
    });
  });

  it('maps activity and export listing queries to paginated requests', async () => {
    const activityQuery = {
      page: 2,
      limit: 5,
      sortOrder: 'desc' as const,
      dateFrom: '2026-02-01',
    };
    const exportsQuery = {
      page: 1,
      limit: 10,
      reportType: 'COMMERCIAL_PERFORMANCE' as const,
      sortOrder: 'desc' as const,
    };

    await listRecentActivity(activityQuery);
    await listExports(exportsQuery);

    expect(mocks.requestPaginated).toHaveBeenNthCalledWith(1, {
      method: 'GET',
      url: '/reports/recent-activity',
      params: activityQuery,
    });
    expect(mocks.requestPaginated).toHaveBeenNthCalledWith(2, {
      method: 'GET',
      url: '/reports/exports',
      params: exportsQuery,
    });
  });

  it('maps sales target reads, updates, and export creation', async () => {
    const update = { minBilling: 1500, maxBilling: null, minCloses: 3 };
    const exportRequest = {
      generatedBy: reportMetricA.advisor.id,
      reportType: 'COMMERCIAL_PERFORMANCE' as const,
      title: 'Commercial performance',
      filename: 'metrics.csv',
      fileExtension: 'csv',
      fileSizeMb: 0.01,
      storagePath: 'exports/metrics.csv',
      mimeType: 'text/csv',
    };

    mocks.request
      .mockResolvedValueOnce([reportTarget])
      .mockResolvedValueOnce(reportTarget)
      .mockResolvedValueOnce(reportExport);

    await expect(listTargets()).resolves.toEqual([reportTarget]);
    await expect(updateTarget(reportTarget.id, update)).resolves.toEqual(reportTarget);
    await expect(createExport(exportRequest)).resolves.toEqual(reportExport);

    expect(mocks.request).toHaveBeenNthCalledWith(1, {
      method: 'GET',
      url: '/reports/targets',
    });
    expect(mocks.request).toHaveBeenNthCalledWith(2, {
      method: 'PUT',
      url: `/reports/targets/${reportTarget.id}`,
      data: update,
    });
    expect(mocks.request).toHaveBeenNthCalledWith(3, {
      method: 'POST',
      url: '/reports/exports',
      data: exportRequest,
    });
  });
});
