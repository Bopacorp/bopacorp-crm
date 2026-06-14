import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { getBusinessClient } from '../clients.service.js';

export function useBusinessClient(id: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.businessClients.detail(id),
    queryFn: () => getBusinessClient(id),
    enabled: !!id,
  });

  return { client: data ?? null, loading: isLoading, error, refetch };
}
