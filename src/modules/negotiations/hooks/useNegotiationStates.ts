import type { NegotiationStateResponse } from '@bopacorp/shared/crm';
import { useEffect, useState } from 'react';
import { listNegotiationStates } from '../negotiations.service.js';

export function useNegotiationStates() {
  const [states, setStates] = useState<NegotiationStateResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let stale = false;
    listNegotiationStates({ page: 1, limit: 100, sortOrder: 'asc' })
      .then((res) => {
        if (!stale) setStates(res.data);
      })
      .catch((err) => {
        if (!stale) setError(err);
      })
      .finally(() => {
        if (!stale) setLoading(false);
      });
    return () => {
      stale = true;
    };
  }, []);

  return { states, loading, error };
}
