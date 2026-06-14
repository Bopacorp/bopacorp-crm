import type { BusinessClientResponse } from '@bopacorp/shared/crm';
import { useCallback, useEffect, useState } from 'react';
import { getBusinessClient } from '../clients.service.js';

export function useBusinessClient(id: string) {
  const [client, setClient] = useState<BusinessClientResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setClient(await getBusinessClient(id));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { client, loading, error, refetch: fetch };
}
