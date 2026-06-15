import { useMemo } from 'react';
import { useTiers } from './useTiers.js';

export function useTierOptions() {
  const { tiers, loading } = useTiers();
  const options = useMemo(() => tiers.map((t) => ({ value: t.id, label: t.name })), [tiers]);
  return { options, loading };
}
