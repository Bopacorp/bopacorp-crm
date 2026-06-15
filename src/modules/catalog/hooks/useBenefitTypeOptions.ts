import { useMemo } from 'react';
import { useBenefitTypes } from './useBenefitTypes.js';

export function useBenefitTypeOptions() {
  const { benefitTypes, loading } = useBenefitTypes();
  const options = useMemo(
    () => benefitTypes.map((b) => ({ value: b.id, label: b.name })),
    [benefitTypes],
  );
  return { options, loading };
}
