import type { ListRecentActivityQuery } from '@bopacorp/shared/reports';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { listRecentActivity } from '../reports.service.js';

export function useRecentActivity(query: ListRecentActivityQuery) {
  return useQuery({
    queryKey: queryKeys.reports.recentActivity(query),
    queryFn: () => listRecentActivity(query),
  });
}
