import type { NegotiationDocumentListItemResponse } from '@bopacorp/shared/documents';
import { FileUp } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button.js';
import { formatDateTime } from '@/lib/format.js';
import { cn } from '@/lib/utils';
import { EmptyState, EntityTable, ErrorState, StateBadge, TableSkeleton } from '@/shared/ui';
import { useDocuments } from '../hooks/useDocuments.js';
import { documentStateLabel } from '../lib/state.js';
import { DocumentActions } from './DocumentActions.js';
import { DocumentUploadDialog } from './DocumentUploadDialog.js';

interface NegotiationDocumentsTabProps {
  negotiationId: string;
}

export function NegotiationDocumentsTab({ negotiationId }: NegotiationDocumentsTabProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [uploadOpen, setUploadOpen] = useState(false);

  const { documents, meta, loading, fetching, error, refetch } = useDocuments(page, {
    negotiationId,
  });

  const columns = [
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

  if (loading) return <TableSkeleton columns={columns.length} rows={3} />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        fetching && 'opacity-60 pointer-events-none transition-opacity',
      )}
    >
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setUploadOpen(true)}>
          <FileUp data-icon="inline-start" className="size-4" />
          {t('documentation.uploadDocument')}
        </Button>
      </div>

      {documents.length === 0 ? (
        <EmptyState
          title={t('documentation.noDocuments')}
          description={t('documentation.noDocumentsDesc')}
        />
      ) : (
        <>
          <EntityTable data={documents} columns={columns} keyExtractor={(item) => item.id} />
          {meta && meta.totalPages > 1 && (
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t('common.previous')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === meta.totalPages}
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              >
                {t('common.next')}
              </Button>
            </div>
          )}
        </>
      )}

      <DocumentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={() => refetch()}
        negotiationId={negotiationId}
      />
    </div>
  );
}
