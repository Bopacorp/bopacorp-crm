import type { NotificationListItemResponse } from '@bopacorp/shared';
import type { PaginationMeta } from '@bopacorp/shared/common';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { useAuth } from '@/modules/auth/context/AuthContext.js';
import { listNotifications } from '../notifications.service.js';

export function useNotifications(page = 1, limit = 10) {
  const { user } = useAuth();
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: queryKeys.notifications.list(page, {}),
    queryFn: () => listNotifications({ page, limit, sortOrder: 'desc' }),
    enabled: !!user,
  });

  const result = data as { data: NotificationListItemResponse[]; meta: PaginationMeta } | undefined;

  return {
    notifications: result?.data ?? [],
    meta: result?.meta ?? null,
    loading: isLoading,
    fetching: isFetching,
    refetch,
  };
}
