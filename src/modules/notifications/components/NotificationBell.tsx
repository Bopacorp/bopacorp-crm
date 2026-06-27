import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { queryKeys } from '@/lib/query-keys.js';
import { cn } from '@/lib/utils';
import { useNotifications } from '../hooks/useNotifications.js';
import { useUnreadCount } from '../hooks/useUnreadCount.js';
import { markAllNotificationsRead } from '../notifications.service.js';
import { NotificationItem } from './NotificationItem.js';

export function NotificationBell() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const unreadCount = useUnreadCount();
  const { notifications, loading } = useNotifications(1, 10);

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute top-1 right-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground',
                unreadCount > 9 ? 'px-1 text-[10px] leading-none' : 'size-4 text-[10px]',
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">{t('notifications.title')}</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="xs"
              className="text-xs text-muted-foreground"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
            >
              {markAllMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" data-icon="inline-start" />
              ) : (
                <CheckCheck className="size-3.5" data-icon="inline-start" />
              )}
              {t('notifications.markAllRead')}
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col gap-2 p-3">
              <Skeleton className="h-14 rounded-md" />
              <Skeleton className="h-14 rounded-md" />
              <Skeleton className="h-14 rounded-md" />
            </div>
          ) : notifications.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t('notifications.empty')}
            </p>
          ) : (
            <div className="flex flex-col gap-0.5 p-1">
              {notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} />
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
