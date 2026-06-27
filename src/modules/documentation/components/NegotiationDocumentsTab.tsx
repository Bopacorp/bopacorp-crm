import type { NegotiationDocumentListItemResponse } from '@bopacorp/shared/documents';
import { Download, Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button.js';
import { formatDateTime } from '@/lib/format.js';
import { cn } from '@/lib/utils';
import { useAuth } from '@/modules/auth/context/AuthContext.js';
import { EmptyState, EntityTable, ErrorState, StateBadge, TableSkeleton } from '@/shared/ui';
import { downloadNegotiationDocuments } from '../documentation.service.js';
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

  const { hasRole } = useAuth();
  const isAdvisor = hasRole('advisor') && !hasRole('supervisor') && !hasRole('admin');

  const [downloading, setDownloading] = useState(false);

  const { documents, meta, loading, fetching, error, refetch } = useDocuments(page, {
    negotiationId,
  });

  const handleDownloadAll = async () => {
    setDownloading(true);
    try {
      await downloadNegotiationDocuments(negotiationId);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setDownloading(false);
    }
  };

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
      {!isAdvisor && (
        <div className="flex justify-end gap-2">
          {documents.length > 0 && (
            <Button variant="outline" onClick={handleDownloadAll} disabled={downloading}>
              {downloading ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <Download data-icon="inline-start" />
              )}
              {downloading ? t('documentation.downloading') : t('documentation.downloadAll')}
            </Button>
          )}
          <Button onClick={() => setUploadOpen(true)}>
            <Plus data-icon="inline-start" />
            {t('documentation.uploadDocument')}
          </Button>
        </div>
      )}

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
