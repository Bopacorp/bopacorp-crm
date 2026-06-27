import type { NotificationListItemResponse } from '@bopacorp/shared';
import { formatRelativeTime } from '@/lib/format.js';
import { cn } from '@/lib/utils';
import { useMarkRead } from '../hooks/useMarkRead.js';

interface NotificationItemProps {
  notification: NotificationListItemResponse;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const { mutate: markRead } = useMarkRead();

  const handleClick = () => {
    if (!notification.isRead) {
      markRead(notification.id);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'flex w-full flex-col gap-0.5 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent',
        !notification.isRead && 'bg-accent/50',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium leading-tight">{notification.title}</span>
        {!notification.isRead && (
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
        )}
      </div>
      <p className="line-clamp-2 text-xs text-muted-foreground">{notification.message}</p>
      <span className="text-xs text-muted-foreground/70">
        {formatRelativeTime(notification.createdAt)}
      </span>
    </button>
  );
}
