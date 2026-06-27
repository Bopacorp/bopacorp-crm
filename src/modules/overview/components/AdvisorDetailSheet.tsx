import type { AdvisorMetricResponse } from '@bopacorp/shared/reports';
import { Briefcase, CalendarCheck, Clock, Users, XIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button.js';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet.js';
import { formatCurrency } from '@/lib/format.js';
import { KpiCard } from '@/shared/ui';

interface AdvisorDetailSheetProps {
  advisor: AdvisorMetricResponse | null;
  onClose: () => void;
}

function advisorName(item: AdvisorMetricResponse) {
  const profile = item.advisor.profile;
  return profile ? `${profile.firstName} ${profile.lastName}` : item.advisor.username;
}

export function AdvisorDetailSheet({ advisor, onClose }: AdvisorDetailSheetProps) {
  const { t } = useTranslation();

  return (
    <Sheet open={!!advisor} onOpenChange={() => onClose()}>
      <SheetContent showCloseButton={false}>
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>{advisor ? advisorName(advisor) : t('overview.detail')}</SheetTitle>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <XIcon />
            </Button>
          </div>
        </SheetHeader>

        {advisor && (
          <div className="flex flex-col gap-6 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <KpiCard
                title={t('overview.contacted')}
                value={advisor.clientsContacted}
                subtitle={t('overview.accountsInContact')}
                icon={Briefcase}
              />
              <KpiCard
                title={t('overview.visited')}
                value={advisor.clientsVisited}
                subtitle={t('overview.clientsVisitedSub')}
                icon={CalendarCheck}
              />
              <KpiCard
                title={t('overview.inNegotiation')}
                value={advisor.clientsInNegotiation}
                subtitle={t('overview.activeNegotiations')}
                icon={Users}
              />
              <KpiCard
                title={t('overview.closed')}
                value={advisor.clientsClosed}
                subtitle={t('overview.dealsClosed')}
                icon={Briefcase}
              />
              <KpiCard
                title={t('overview.postSale')}
                value={advisor.clientsPostSale}
                subtitle={t('overview.clientsInPostSale')}
                icon={CalendarCheck}
              />
              <KpiCard
                title={t('overview.avgDaysToClose')}
                value={advisor.avgDaysToClose?.toFixed(1) ?? t('overview.noData')}
                subtitle={t('overview.avgDaysToCloseSub')}
                icon={Clock}
              />
            </div>

            <div className="flex flex-col gap-4 rounded-lg border border-border bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('overview.billed')}</span>
                <span className="text-lg font-semibold">
                  {formatCurrency(advisor.totalBilledAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t('overview.avgServiceAmount')}
                </span>
                <span className="text-lg font-semibold">
                  {formatCurrency(advisor.averageBillingPerService)}
                </span>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
