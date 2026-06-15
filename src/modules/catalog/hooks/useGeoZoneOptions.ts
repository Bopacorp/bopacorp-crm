import { useMemo } from 'react';
import { useGeoZones } from './useGeoZones.js';

export function useGeoZoneOptions() {
  const { geoZones, loading } = useGeoZones();
  const options = useMemo(() => geoZones.map((g) => ({ value: g.id, label: g.name })), [geoZones]);
  return { options, loading };
}
