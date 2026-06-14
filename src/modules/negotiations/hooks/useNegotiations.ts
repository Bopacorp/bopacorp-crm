import type { PaginationMeta } from '@bopacorp/shared/common';
import type { NegotiationListItemResponse } from '@bopacorp/shared/crm';
import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { listNegotiations } from '../negotiations.service.js';

export interface NegotiationFilters {
  search?: string;
  stateId?: string;
  advisorId?: string;
}

export function useNegotiations(page: number, filters: NegotiationFilters) {
  const [negotiations, setNegotiations] = useState<NegotiationListItemResponse[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [debouncedSearch] = useDebounce(filters.search, 300);

  const fetch = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const result = await listNegotiations({
        page,
        limit: 10,
        sortOrder: 'asc',
        search: debouncedSearch,
        stateId: filters.stateId,
        advisorId: filters.advisorId,
      });
      setNegotiations(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }, [page, debouncedSearch, filters.stateId, filters.advisorId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { negotiations, meta, loading, fetching, error, refetch: fetch };
}
