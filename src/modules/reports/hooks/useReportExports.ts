import type { ListReportExportsQuery } from '@bopacorp/shared/reports';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { listExports } from '../reports.service.js';

export function useReportExports(query: ListReportExportsQuery) {
  return useQuery({
    queryKey: queryKeys.reports.exports(query),
    queryFn: () => listExports(query),
  });
}
