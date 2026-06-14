import type { NegotiationResponse } from '@bopacorp/shared/crm';
import { useCallback, useEffect, useState } from 'react';
import { getNegotiation } from '../negotiations.service.js';

export function useNegotiation(id: string) {
  const [negotiation, setNegotiation] = useState<NegotiationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setNegotiation(await getNegotiation(id));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { negotiation, loading, error, refetch: fetch };
}
