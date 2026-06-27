import type { ListSalesObjectivesQuery } from '@bopacorp/shared/reports';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { listObjectives } from '../reports.service.js';

export function useSalesObjectives(query: ListSalesObjectivesQuery) {
  return useQuery({
    queryKey: queryKeys.reports.objectives(query),
    queryFn: () => listObjectives(query),
  });
}
