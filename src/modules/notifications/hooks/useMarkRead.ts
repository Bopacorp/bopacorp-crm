import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys.js';
import { updateNotification } from '../notifications.service.js';

export function useMarkRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => updateNotification(id, { isRead: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
