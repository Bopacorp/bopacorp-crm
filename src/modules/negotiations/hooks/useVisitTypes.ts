import type { VisitTypeResponse } from '@bopacorp/shared/crm';
import { useEffect, useState } from 'react';
import { listVisitTypes } from '../negotiations.service.js';

export function useVisitTypes() {
  const [visitTypes, setVisitTypes] = useState<VisitTypeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let stale = false;
    listVisitTypes({ page: 1, limit: 100, sortOrder: 'asc' })
      .then((res) => {
        if (!stale) setVisitTypes(res.data);
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

  return { visitTypes, loading, error };
}
