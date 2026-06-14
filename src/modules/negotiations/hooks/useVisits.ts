import type { PaginationMeta } from '@bopacorp/shared/common';
import type { VisitListItemResponse } from '@bopacorp/shared/crm';
import { useCallback, useEffect, useState } from 'react';
import { listVisits } from '../negotiations.service.js';

export interface VisitFilters {
  clientId?: string;
  advisorId?: string;
  visitTypeId?: string;
  isVerified?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export function useVisits(page: number, filters: VisitFilters) {
  const [visits, setVisits] = useState<VisitListItemResponse[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listVisits({
        page,
        limit: 10,
        sortOrder: 'asc',
        clientId: filters.clientId,
        advisorId: filters.advisorId,
        visitTypeId: filters.visitTypeId,
        isVerified: filters.isVerified,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      });
      setVisits(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [
    page,
    filters.clientId,
    filters.advisorId,
    filters.visitTypeId,
    filters.isVerified,
    filters.dateFrom,
    filters.dateTo,
  ]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { visits, meta, loading, error, refetch: fetch };
}
