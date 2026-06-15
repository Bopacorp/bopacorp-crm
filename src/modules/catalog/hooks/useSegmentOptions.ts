import { useMemo } from 'react';
import { useSegments } from './useSegments.js';

export function useSegmentOptions() {
  const { segments, loading } = useSegments();
  const options = useMemo(() => segments.map((s) => ({ value: s.id, label: s.name })), [segments]);
  return { options, loading };
}
