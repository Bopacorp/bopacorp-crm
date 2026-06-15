import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { listContractTypes } from '../catalog.service.js';

export function useContractTypes() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.catalog.contractTypes.all,
    queryFn: () => listContractTypes({ page: 1, limit: 100, sortOrder: 'asc' }),
    staleTime: 5 * 60_000,
  });
  return { contractTypes: data?.data ?? [], loading: isLoading, error };
}
