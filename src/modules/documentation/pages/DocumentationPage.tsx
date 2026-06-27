import type { NegotiationDocumentListItemResponse } from '@bopacorp/shared/documents';
import { FileUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/format.js';
import { cn } from '@/lib/utils';
import { useAuth } from '@/modules/auth/context/AuthContext.js';
import { useAdvisors } from '@/modules/org/hooks/useAdvisors.js';
import { usePageReset } from '@/shared/hooks/usePageReset.js';
import {
  EmptyState,
  EntityTable,
  ErrorState,
  FilterBar,
  PaginationFooter,
  SectionHeader,
  StateBadge,
  TableSkeleton,
} from '@/shared/ui';
import { DocumentActions } from '../components/DocumentActions.js';
import { DocumentUploadDialog } from '../components/DocumentUploadDialog.js';
import { useDocuments } from '../hooks/useDocuments.js';
import { documentStateLabel } from '../lib/state.js';

interface DocumentFilters {
  search: string;
  state: string;
  advisorId?: string;
}

function employeeName(emp: {
  user: { firstName: string | null; lastName: string | null; username: string };
}) {
  return emp.user.firstName && emp.user.lastName
    ? `${emp.user.firstName} ${emp.user.lastName}`
    : emp.user.username;
}

export default function DocumentationPage() {
  const { t } = useTranslation();
  const { user, hasRole } = useAuth();
  const isAdvisor = hasRole('advisor');
  const { advisors } = useAdvisors();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<DocumentFilters>({ search: '', state: 'all' });
  const [uploadOpen, setUploadOpen] = useState(false);

  const effectiveAdvisorId = isAdvisor ? user?.id : filters.advisorId;

  const { documents, meta, loading, fetching, error, refetch } = useDocuments(page, {
    ...filters,
    advisorId: effectiveAdvisorId,
  });

  usePageReset([filters.search, filters.state, filters.advisorId], setPage);

  const advisorOptions = useMemo(
    () => advisors.map((emp) => ({ value: emp.userId, label: employeeName(emp) })),
    [advisors],
  );

  const stateOptions = useMemo(
    () => [
      { value: 'all', label: t('common.all') },
      { value: 'PENDING_APPROVAL', label: t('documentation.statePendingApproval') },
      { value: 'ACCEPTED', label: t('documentation.stateAccepted') },
      { value: 'REJECTED', label: t('documentation.stateRejected') },
    ],
    [t],
  );

  const columns = [
    {
      id: 'company',
      header: t('documentation.company'),
      accessor: (item: NegotiationDocumentListItemResponse) => (
        <span className="font-medium">{item.negotiation.client.businessName}</span>
      ),
    },
    {
      id: 'type',
      header: t('documentation.documentType'),
      accessor: (item: NegotiationDocumentListItemResponse) => item.documentType.name,
    },
    {
      id: 'state',
      header: t('common.status'),
      accessor: (item: NegotiationDocumentListItemResponse) => (
        <StateBadge state={item.state} label={documentStateLabel(item.state)} />
      ),
    },
    {
      id: 'uploaded',
      header: t('documentation.uploadedAt'),
      accessor: (item: NegotiationDocumentListItemResponse) => formatDateTime(item.uploadedAt),
    },
    {
      id: 'actions',
      header: t('documentation.actions'),
      accessor: (item: NegotiationDocumentListItemResponse) => (
        <DocumentActions document={item} onSuccess={refetch} />
      ),
    },
  ];

  if (loading) return <TableSkeleton columns={columns.length} />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div
      className={cn(
        'flex flex-col gap-6',
        fetching && 'opacity-60 pointer-events-none transition-opacity',
      )}
    >
      <SectionHeader
        title={t('documentation.title')}
        description={t('documentation.description')}
        actions={
          <Button onClick={() => setUploadOpen(true)}>
            <FileUp data-icon="inline-start" />
            {t('documentation.uploadDocument')}
          </Button>
        }
      />

      <FilterBar
        searchValue={filters.search}
        onSearchChange={(search) => setFilters((f) => ({ ...f, search }))}
        searchPlaceholder={t('documentation.searchPlaceholder')}
        filters={[
          {
            id: 'state',
            label: t('common.status'),
            placeholder: t('common.status'),
            value: filters.state,
            onChange: (state) => setFilters((f) => ({ ...f, state })),
            options: stateOptions,
          },
          ...(!isAdvisor
            ? [
                {
                  id: 'advisor',
                  label: t('common.advisor'),
                  placeholder: t('common.advisor'),
                  value: filters.advisorId ?? 'all',
                  onChange: (value: string) =>
                    setFilters((f) => ({ ...f, advisorId: value === 'all' ? undefined : value })),
                  options: [{ value: 'all', label: t('common.all') }, ...advisorOptions],
                  searchable: true,
                },
              ]
            : []),
        ]}
      />

      {documents.length === 0 ? (
        filters.search || filters.state !== 'all' || (!isAdvisor && filters.advisorId) ? (
          <EmptyState
            title={t('common.noResults')}
            description={t('documentation.noFilterResults')}
          />
        ) : (
          <EmptyState
            title={t('documentation.noDocuments')}
            description={t('documentation.noDocumentsDesc')}
          />
        )
      ) : (
        <>
          <EntityTable data={documents} columns={columns} keyExtractor={(item) => item.id} />
          <PaginationFooter
            page={page}
            onPageChange={setPage}
            pageSize={10}
            onPageSizeChange={() => {}}
            meta={meta ? { totalItems: meta.totalItems, totalPages: meta.totalPages } : null}
          />
        </>
      )}

      <DocumentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
