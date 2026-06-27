import type { ListAdvisorPerformanceQuery } from '@bopacorp/shared/reports';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { getAdvisorPerformance } from '../reports.service.js';

export function useAdvisorPerformance(query: ListAdvisorPerformanceQuery = {}) {
  return useQuery({
    queryKey: queryKeys.reports.advisorPerformance(query),
    queryFn: () => getAdvisorPerformance(query),
  });
}
