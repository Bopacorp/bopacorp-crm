import { useMemo } from 'react';
import { useContractTypes } from './useContractTypes.js';

export function useContractTypeOptions() {
  const { contractTypes, loading } = useContractTypes();
  const options = useMemo(
    () => contractTypes.map((t) => ({ value: t.id, label: t.name })),
    [contractTypes],
  );
  return { options, loading };
}
