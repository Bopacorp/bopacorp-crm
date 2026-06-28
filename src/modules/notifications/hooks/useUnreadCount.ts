import type { NotificationListItemResponse } from '@bopacorp/shared';
import type { PaginationMeta } from '@bopacorp/shared/common';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { useAuth } from '@/modules/auth/context/AuthContext.js';
import { listNotifications } from '../notifications.service.js';

export function useUnreadCount() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: queryKeys.notifications.unread,
    queryFn: () => listNotifications({ page: 1, limit: 1, sortOrder: 'desc', isRead: false }),
    refetchInterval: 30_000,
    enabled: !!user,
  });

  const result = data as { data: NotificationListItemResponse[]; meta: PaginationMeta } | undefined;

  return result?.meta?.totalItems ?? 0;
}
