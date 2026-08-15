import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  reportMetricA,
  reportPageResult,
  reportPerformanceA,
  reportTarget,
} from '@/test/crm-phase5-fixtures.js';

const mocks = vi.hoisted(() => ({
  listAdvisorMetrics: vi.fn(),
  getAdvisorPerformance: vi.fn(),
  listRecentActivity: vi.fn(),
  listExports: vi.fn(),
  listTargets: vi.fn(),
  listAdvisors: vi.fn(),
  useAuth: vi.fn(),
  useAdvisors: vi.fn(),
}));

vi.mock('../reports.service.js', () => ({
  listAdvisorMetrics: mocks.listAdvisorMetrics,
  getAdvisorPerformance: mocks.getAdvisorPerformance,
  listRecentActivity: mocks.listRecentActivity,
  listExports: mocks.listExports,
  listTargets: mocks.listTargets,
}));
vi.mock('@/modules/auth/context/AuthContext.js', () => ({ useAuth: mocks.useAuth }));
vi.mock('@/modules/org/hooks/useAdvisors.js', () => ({ useAdvisors: mocks.useAdvisors }));
vi.mock('@/modules/org/org.service.js', () => ({ listAdvisors: mocks.listAdvisors }));

import { useAdvisorMetrics } from './useAdvisorMetrics.js';
import { useAdvisorPerformance } from './useAdvisorPerformance.js';
import { useRecentActivity } from './useRecentActivity.js';
import { useReportExports } from './useReportExports.js';
import { useSalesTargets } from './useSalesTargets.js';
import { useTeamAdvisors } from './useTeamAdvisors.js';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('report hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listAdvisorMetrics.mockResolvedValue([reportMetricA]);
    mocks.getAdvisorPerformance.mockResolvedValue([reportPerformanceA]);
    mocks.listRecentActivity.mockResolvedValue({ data: [], meta: undefined });
    mocks.listExports.mockResolvedValue(reportPageResult);
    mocks.listTargets.mockResolvedValue([reportTarget]);
    mocks.listAdvisors.mockResolvedValue({ data: [], meta: undefined });
    mocks.useAuth.mockReturnValue({ user: null, hasRole: () => false });
    mocks.useAdvisors.mockReturnValue({ advisors: [], loading: false });
  });

  it('passes report filters to metric, performance, activity, and export queries', async () => {
    const metricsQuery = { dateFrom: '2026-02-01', dateTo: '2026-02-28' };
    const performanceQuery = { supervisorId: '00000000-0000-4000-8000-000000000103' };
    const activityQuery = {
      page: 2,
      limit: 5,
      sortOrder: 'desc' as const,
      advisorId: reportMetricA.advisor.id,
    };
    const exportsQuery = { page: 1, limit: 10, sortOrder: 'desc' as const };

    const { result } = renderHook(
      () => ({
        metrics: useAdvisorMetrics(metricsQuery),
        performance: useAdvisorPerformance(performanceQuery),
        activity: useRecentActivity(activityQuery),
        exports: useReportExports(exportsQuery),
      }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.exports.data).toEqual(reportPageResult));

    expect(mocks.listAdvisorMetrics).toHaveBeenCalledWith(metricsQuery);
    expect(mocks.getAdvisorPerformance).toHaveBeenCalledWith(performanceQuery);
    expect(mocks.listRecentActivity).toHaveBeenCalledWith(activityQuery);
    expect(mocks.listExports).toHaveBeenCalledWith(exportsQuery);
    expect(result.current.metrics.data).toEqual([reportMetricA]);
    expect(result.current.performance.data).toEqual([reportPerformanceA]);
    expect(result.current.activity.data).toEqual({ data: [], meta: undefined });
  });

  it('loads targets and exposes the target response through the query', async () => {
    const { result } = renderHook(() => useSalesTargets(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.data).toEqual([reportTarget]));
    expect(mocks.listTargets).toHaveBeenCalledOnce();
  });

  it('limits supervisor advisor options to the returned team', async () => {
    const supervisorId = '00000000-0000-4000-8000-000000000103';
    mocks.useAuth.mockReturnValue({
      user: { id: supervisorId },
      hasRole: (role: string) => role === 'supervisor',
    });
    mocks.listAdvisors.mockResolvedValue({
      data: [
        {
          advisor: {
            id: reportMetricA.advisor.id,
            username: reportMetricA.advisor.username,
            profile: reportMetricA.advisor.profile,
          },
        },
      ],
      meta: undefined,
    });

    const { result } = renderHook(() => useTeamAdvisors(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mocks.listAdvisors).toHaveBeenCalledWith(supervisorId, {
      page: 1,
      limit: 100,
      sortOrder: 'asc',
    });
    expect(result.current.isSupervisor).toBe(true);
    expect(result.current.advisorOptions).toEqual([
      { value: reportMetricA.advisor.id, label: 'Alex Advisor' },
    ]);
  });

  it('uses the complete advisor directory for management users', async () => {
    const managerId = '00000000-0000-4000-8000-000000000104';
    mocks.useAuth.mockReturnValue({
      user: { id: managerId },
      hasRole: (role: string) => role === 'manager',
    });
    mocks.useAdvisors.mockReturnValue({
      advisors: [
        {
          userId: reportMetricA.advisor.id,
          user: { firstName: 'Alex', lastName: 'Advisor', username: 'advisor.a' },
        },
      ],
      loading: false,
    });

    const { result } = renderHook(() => useTeamAdvisors(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mocks.listAdvisors).not.toHaveBeenCalled();
    expect(result.current.isSupervisor).toBe(false);
    expect(result.current.advisorOptions).toEqual([
      { value: reportMetricA.advisor.id, label: 'Alex Advisor' },
    ]);
  });
});
