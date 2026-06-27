import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { getPendingSummary } from '../documentation.service.js';

export function usePendingSummary() {
  return useQuery({
    queryKey: queryKeys.documents.pendingSummary(),
    queryFn: getPendingSummary,
  });
}
