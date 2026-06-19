import type { AdvisorMetricResponse, ListAdvisorMetricsQuery } from '@bopacorp/shared/reports';
import { request } from '@/services/api.js';

export function listAdvisorMetrics(query: ListAdvisorMetricsQuery = {}) {
  return request<AdvisorMetricResponse[]>({
    method: 'GET',
    url: '/reports/advisor-metrics',
    params: query,
  });
}
