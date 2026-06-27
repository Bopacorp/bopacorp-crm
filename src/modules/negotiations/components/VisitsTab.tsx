import type { VisitListItemResponse } from '@bopacorp/shared/crm';
import { CheckCircle, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/format.js';
import { cn } from '@/lib/utils';
import { Can } from '@/modules/auth/components/Can.js';
import { useAuth } from '@/modules/auth/context/AuthContext.js';
import {
  EmptyState,
  EntityTable,
  ErrorState,
  PaginationFooter,
  StateBadge,
  TableSkeleton,
} from '@/shared/ui';
import { useVisits } from '../hooks/useVisits.js';
import { CreateVisitSheet } from './CreateVisitSheet.js';
import { VisitActions } from './VisitActions.js';
import { VisitDetailSheet } from './VisitDetailSheet.js';

const PAGE_SIZE = 10;

function advisorName(advisor: {
  username: string;
  profile: { firstName: string; lastName: string } | null;
}): string {
  if (advisor.profile) return `${advisor.profile.firstName} ${advisor.profile.lastName}`;
  return advisor.username;
}

interface VisitsTabProps {
  clientId: string;
  negotiationId: string;
}

export function VisitsTab({ clientId, negotiationId }: VisitsTabProps) {
  const { t } = useTranslation();
  const { user, hasRole } = useAuth();
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);

  const isAdvisor = hasRole('advisor');
  const filters = {
    clientId,
    ...(isAdvisor && user ? { advisorId: user.id } : {}),
  };

  const { visits, meta, loading, fetching, error, refetch } = useVisits(page, filters);

  const columns = [
    {
      id: 'date',
      header: t('common.date'),
      accessor: (item: VisitListItemResponse) => formatDateTime(item.visitDate),
    },
    {
      id: 'type',
      header: t('common.type'),
      accessor: (item: VisitListItemResponse) => (
        <StateBadge state={item.visitType.code} label={item.visitType.name} />
      ),
    },
    {
      id: 'advisor',
      header: t('common.advisor'),
      accessor: (item: VisitListItemResponse) => advisorName(item.advisor),
    },
    {
      id: 'verified',
      header: t('visits.verified'),
      accessor: (item: VisitListItemResponse) =>
        item.isVerified ? (
          <CheckCircle className="size-4 text-primary" />
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      id: 'actions',
      header: '',
      accessor: (item: VisitListItemResponse) => <VisitActions visit={item} onSuccess={refetch} />,
    },
  ];

  if (loading) return <TableSkeleton columns={5} rows={3} />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        fetching && 'pointer-events-none opacity-60 transition-opacity',
      )}
    >
      <div className="flex justify-end">
        <Can permission="visits.create">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus data-icon="inline-start" />
            {t('visits.register')}
          </Button>
        </Can>
      </div>

      {visits.length === 0 ? (
        <EmptyState title={t('visits.noVisits')} description={t('visits.noVisitsDesc')} />
      ) : (
        <>
          <EntityTable
            data={visits}
            columns={columns}
            keyExtractor={(item) => item.id}
            onRowClick={(item) => {
              setSelectedVisitId(item.id);
              setDetailOpen(true);
            }}
          />
          <PaginationFooter
            page={page}
            onPageChange={setPage}
            pageSize={PAGE_SIZE}
            onPageSizeChange={() => {}}
            meta={meta}
          />
        </>
      )}

      <CreateVisitSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        negotiationId={negotiationId}
        clientId={clientId}
        onSuccess={refetch}
      />

      {selectedVisitId && (
        <VisitDetailSheet
          open={detailOpen}
          onOpenChange={setDetailOpen}
          visitId={selectedVisitId}
        />
      )}
    </div>
  );
}
