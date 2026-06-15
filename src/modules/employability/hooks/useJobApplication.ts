import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { getJobApplication } from '../employability.service.js';

export function useJobApplication(id: string | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.employability.applications.detail(id ?? ''),
    queryFn: () => getJobApplication(id as string),
    enabled: !!id,
  });

  return { application: data, loading: isLoading, error, refetch };
}
