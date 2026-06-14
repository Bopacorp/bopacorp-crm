import type { PaginationMeta } from '@bopacorp/shared/common';
import type { BusinessClientListItemResponse } from '@bopacorp/shared/crm';
import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { listBusinessClients } from '../clients.service.js';

export interface BusinessClientFilters {
  search?: string;
  advisorId?: string;
  isActive?: boolean;
}

export function useBusinessClients(page: number, filters: BusinessClientFilters) {
  const [clients, setClients] = useState<BusinessClientListItemResponse[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [debouncedSearch] = useDebounce(filters.search, 300);

  const fetch = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const result = await listBusinessClients({
        page,
        limit: 10,
        sortOrder: 'asc',
        search: debouncedSearch,
        advisorId: filters.advisorId,
        isActive: filters.isActive,
      });
      setClients(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }, [page, debouncedSearch, filters.advisorId, filters.isActive]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { clients, meta, loading, fetching, error, refetch: fetch };
}
