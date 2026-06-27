import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { listTargets } from '../reports.service.js';

export function useSalesTargets() {
  return useQuery({
    queryKey: queryKeys.reports.targets(),
    queryFn: () => listTargets(),
  });
}
