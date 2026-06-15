import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { getVacancy } from '../employability.service.js';

export function useVacancy(id: string | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.employability.vacancies.detail(id ?? ''),
    queryFn: () => getVacancy(id as string),
    enabled: !!id,
  });

  return { vacancy: data, loading: isLoading, error, refetch };
}
