import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { listGeoZones } from '../catalog.service.js';

export function useGeoZones() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.catalog.geoZones.all,
    queryFn: () => listGeoZones({ page: 1, limit: 100, sortOrder: 'asc' }),
    staleTime: 5 * 60_000,
  });
  return { geoZones: data?.data ?? [], loading: isLoading, error };
}
