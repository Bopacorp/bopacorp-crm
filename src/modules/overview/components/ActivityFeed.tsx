import { ArrowRightLeft, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatRelativeTime } from '@/lib/format.js';
import { useRecentActivity } from '@/modules/reports/hooks/useRecentActivity.js';
import { EmptyState } from '@/shared/ui';

interface ActivityFeedProps {
  dateFrom?: string;
  dateTo?: string;
  advisorId?: string;
}

export function ActivityFeed({ dateFrom, dateTo, advisorId }: ActivityFeedProps) {
  const { t } = useTranslation();
  const { data: result, isLoading } = useRecentActivity({
    limit: 10,
    page: 1,
    sortOrder: 'desc',
    dateFrom,
    dateTo,
    advisorId,
  });

  const items = result?.data ?? [];

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>{t('overview.recentActivity')}</CardTitle>
        <CardDescription>{t('overview.recentActivityDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-sm text-muted-foreground">{t('common.loading')}</span>
          </div>
        ) : items.length === 0 ? (
          <EmptyState title={t('overview.noActivity')} description={t('overview.noActivityDesc')} />
        ) : (
          <ScrollArea className="h-80">
            <div className="flex flex-col gap-3">
              {items.map((item) => (
                <div
                  key={`${item.type}-${item.createdAt}-${item.clientName}`}
                  className="flex items-start gap-3"
                >
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    {item.type === 'state_change' ? (
                      <ArrowRightLeft className="size-4 text-muted-foreground" />
                    ) : (
                      <MapPin className="size-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">{item.advisorName}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.type === 'state_change'
                        ? t('overview.stateChange')
                        : t('overview.visitLabel')}
                      {' · '}
                      {item.clientName}
                    </span>
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                    <span className="text-xs text-muted-foreground/70">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
