import type { NegotiationDocumentListItemResponse } from '@bopacorp/shared/documents';
import { CheckCircle, Download, FileUp, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, EntityTable, StateBadge } from '@/shared/ui';
import { downloadDocument } from '../documentation.service.js';
import { useChangeDocumentState } from '../hooks/useChangeDocumentState.js';
import { useDocuments } from '../hooks/useDocuments.js';
import { documentStateLabel } from '../lib/state.js';
import { DocumentStateDialog } from './DocumentStateDialog.js';
import { DocumentUploadDialog } from './DocumentUploadDialog.js';

interface NegotiationDocumentsTabProps {
  negotiationId: string;
}

export function NegotiationDocumentsTab({ negotiationId }: NegotiationDocumentsTabProps) {
  const [page, setPage] = useState(1);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [stateDialog, setStateDialog] = useState<{
    open: boolean;
    documentId: string;
    currentState: NegotiationDocumentListItemResponse['state'];
  }>({ open: false, documentId: '', currentState: 'PENDING_APPROVAL' });

  const { documents, meta, loading, refetch } = useDocuments(page, {
    negotiationId,
  });
  const changeState = useChangeDocumentState();

  const handleDownload = (doc: NegotiationDocumentListItemResponse) => {
    downloadDocument(doc.id, doc.filename);
  };

  const columns = [
    {
      id: 'type',
      header: 'Tipo de documento',
      accessor: (item: NegotiationDocumentListItemResponse) => item.documentType.name,
    },
    {
      id: 'filename',
      header: 'Archivo',
      accessor: (item: NegotiationDocumentListItemResponse) => (
        <span className="text-muted-foreground text-sm">{item.filename}</span>
      ),
    },
    {
      id: 'state',
      header: 'Estado',
      accessor: (item: NegotiationDocumentListItemResponse) => (
        <StateBadge state={item.state} label={documentStateLabel(item.state)} />
      ),
    },
    {
      id: 'uploaded',
      header: 'Fecha de carga',
      accessor: (item: NegotiationDocumentListItemResponse) =>
        new Date(item.uploadedAt).toLocaleString('es-EC'),
    },
    {
      id: 'actions',
      header: 'Acciones',
      accessor: (item: NegotiationDocumentListItemResponse) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleDownload(item)}>
            <Download data-icon="inline-start" className="size-4" />
            Descargar
          </Button>
          {item.state === 'PENDING_APPROVAL' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  changeState.mutate(
                    { id: item.id, data: { state: 'ACCEPTED' } },
                    { onSuccess: () => refetch() },
                  )
                }
                disabled={changeState.isPending}
              >
                <CheckCircle data-icon="inline-start" className="size-4" />
                Aprobar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setStateDialog({
                    open: true,
                    documentId: item.id,
                    currentState: item.state,
                  })
                }
              >
                <XCircle data-icon="inline-start" className="size-4" />
                Rechazar
              </Button>
            </>
          )}
          {item.state === 'REJECTED' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setStateDialog({
                  open: true,
                  documentId: item.id,
                  currentState: item.state,
                })
              }
            >
              Cambiar estado
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setUploadOpen(true)}>
          <FileUp data-icon="inline-start" className="size-4" />
          Subir documento
        </Button>
      </div>

      {documents.length === 0 && !loading ? (
        <EmptyState title="Sin documentos" description="Aún no se han cargado documentos" />
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
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === meta.totalPages}
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              >
                Siguiente
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

      <DocumentStateDialog
        open={stateDialog.open}
        onOpenChange={(open) => setStateDialog((s) => ({ ...s, open }))}
        documentId={stateDialog.documentId}
        currentState={stateDialog.currentState}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
