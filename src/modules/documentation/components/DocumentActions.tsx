import type { NegotiationDocumentListItemResponse } from '@bopacorp/shared/documents';
import { CheckCircle, Download, Loader2, MoreHorizontal, XCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.js';
import { downloadDocument } from '../documentation.service.js';
import { useChangeDocumentState } from '../hooks/useChangeDocumentState.js';
import { RejectDocumentDialog } from './RejectDocumentDialog.js';

interface DocumentActionsProps {
  document: NegotiationDocumentListItemResponse;
  onSuccess?: () => void;
}

type ApproveState = 'idle' | 'loading' | 'success';

export function DocumentActions({ document, onSuccess }: DocumentActionsProps) {
  const changeState = useChangeDocumentState();
  const [approveState, setApproveState] = useState<ApproveState>('idle');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleApprove = () => {
    setApproveState('loading');
    setMenuOpen(false);
    changeState.mutate(
      { id: document.id, data: { state: 'ACCEPTED' } },
      {
        onSuccess: () => {
          setApproveState('success');
          setTimeout(() => setApproveState('idle'), 1500);
          onSuccess?.();
        },
        onError: () => setApproveState('idle'),
      },
    );
  };

  const handleDownload = () => {
    setMenuOpen(false);
    downloadDocument(document.id, document.filename);
  };

  const handleRejectClick = () => {
    setMenuOpen(false);
    setRejectOpen(true);
  };

  const isApproveDisabled = approveState !== 'idle' || changeState.isPending;
  const canApproveOrReject = document.state === 'PENDING_APPROVAL';
  const canChangeState = document.state === 'REJECTED';

  return (
    <>
      {approveState === 'loading' || approveState === 'success' ? (
        <Button size="sm" variant="outline" disabled>
          {approveState === 'loading' && (
            <Loader2 data-icon="inline-start" className="size-4 animate-spin" />
          )}
          {approveState === 'success' && (
            <CheckCircle data-icon="inline-start" className="size-4 text-green-600" />
          )}
          {approveState === 'success' ? 'Aprobado' : 'Aprobando'}
        </Button>
      ) : (
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline">
              <MoreHorizontal data-icon="inline-start" className="size-4" />
              Ver acciones
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDownload}>
              <Download className="size-4" />
              Descargar
            </DropdownMenuItem>

            {canApproveOrReject && (
              <>
                <DropdownMenuItem onClick={handleApprove} disabled={isApproveDisabled}>
                  <CheckCircle className="size-4" />
                  Aprobar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleRejectClick}
                  disabled={changeState.isPending}
                  variant="destructive"
                >
                  <XCircle className="size-4" />
                  Rechazar
                </DropdownMenuItem>
              </>
            )}

            {canChangeState && (
              <DropdownMenuItem onClick={handleRejectClick}>
                <XCircle className="size-4" />
                Cambiar estado
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <RejectDocumentDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        documentId={document.id}
        currentState={document.state}
        onSuccess={onSuccess}
      />
    </>
  );
}
