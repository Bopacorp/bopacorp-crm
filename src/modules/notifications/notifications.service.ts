import type {
  ListNotificationsQuery,
  NotificationListItemResponse,
  NotificationResponse,
  UpdateNotificationRequest,
} from '@bopacorp/shared';
import type { PaginationMeta } from '@bopacorp/shared/common';
import { request, requestPaginated } from '@/services/api.js';

export function listNotifications(query: ListNotificationsQuery) {
  return requestPaginated<NotificationListItemResponse, PaginationMeta>({
    method: 'GET',
    url: '/notifications',
    params: query,
  });
}

export function updateNotification(id: string, data: UpdateNotificationRequest) {
  return request<NotificationResponse>({
    method: 'PUT',
    url: `/notifications/${id}`,
    data,
  });
}

export function markAllNotificationsRead() {
  return request<null>({ method: 'PUT', url: '/notifications/mark-all-read' });
}
