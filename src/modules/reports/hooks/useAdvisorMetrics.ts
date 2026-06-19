import type { ListAdvisorMetricsQuery } from '@bopacorp/shared/reports';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { listAdvisorMetrics } from '../reports.service.js';

export function useAdvisorMetrics(query: ListAdvisorMetricsQuery = {}) {
  return useQuery({
    queryKey: queryKeys.reports.advisorMetrics(query),
    queryFn: () => listAdvisorMetrics(query),
  });
}
