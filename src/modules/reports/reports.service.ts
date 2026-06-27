import type {
  AdvisorMetricResponse,
  ListAdvisorMetricsQuery,
  ListRecentActivityQuery,
  RecentActivityResponse,
} from '@bopacorp/shared/reports';
import { request, requestPaginated } from '@/services/api.js';

export function listAdvisorMetrics(query: ListAdvisorMetricsQuery = {}) {
  return request<AdvisorMetricResponse[]>({
    method: 'GET',
    url: '/reports/advisor-metrics',
    params: query,
  });
}

export function listRecentActivity(query: ListRecentActivityQuery) {
  return requestPaginated<RecentActivityResponse>({
    method: 'GET',
    url: '/reports/recent-activity',
    params: query,
  });
}
