import { useMemo } from 'react';
import { useItemTypes } from './useItemTypes.js';

export function useItemTypeOptions() {
  const { itemTypes, loading } = useItemTypes();
  const options = useMemo(
    () => itemTypes.map((t) => ({ value: t.id, label: t.name, code: t.code })),
    [itemTypes],
  );
  return { options, loading };
}
