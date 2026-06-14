import type { NegotiationStateHistoryResponse } from '@bopacorp/shared/crm';
import { useCallback, useEffect, useState } from 'react';
import { getNegotiationHistory } from '../negotiations.service.js';

export function useNegotiationHistory(id: string) {
  const [history, setHistory] = useState<NegotiationStateHistoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setHistory(await getNegotiationHistory(id));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { history, loading, error, refetch: fetch };
}
