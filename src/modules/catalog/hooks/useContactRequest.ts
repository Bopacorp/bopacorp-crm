import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { getContactRequest } from '../catalog.service.js';

export function useContactRequest(id: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.catalog.contactRequests.detail(id),
    queryFn: () => getContactRequest(id),
    enabled: !!id,
  });
  return { contactRequest: data ?? null, loading: isLoading, error, refetch };
}
