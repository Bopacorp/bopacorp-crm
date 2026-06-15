import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { listBenefitTypes } from '../catalog.service.js';

export function useBenefitTypes() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.catalog.benefitTypes.all,
    queryFn: () => listBenefitTypes({ page: 1, limit: 100, sortOrder: 'asc' }),
    staleTime: 5 * 60_000,
  });
  return { benefitTypes: data?.data ?? [], loading: isLoading, error };
}
