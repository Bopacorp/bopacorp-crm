import type { AttachmentType, MatrixAttachmentResponse } from '@bopacorp/shared/matrices';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, FileIcon, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRelativeTime } from '@/lib/format.js';
import { queryKeys } from '@/lib/query-keys.js';
import { Can } from '@/modules/auth/components/Can.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { EmptyState, ErrorState } from '@/shared/ui';
import { useMatrixAttachments } from '../hooks/useMatrixAttachments.js';
import { deleteAttachment, downloadAttachment } from '../matrices.service.js';
import { AddAttachmentDialog } from './AddAttachmentDialog.js';

interface AttachmentsTabProps {
  matrixId: string;
}

const ATTACHMENT_TYPE_LABEL: Record<AttachmentType, string> = {
  OFFER_MATRIX: 'Matriz',
  EMAIL_TEMPLATE: 'Email',
};

const ATTACHMENT_TYPE_VARIANT: Record<AttachmentType, 'secondary' | 'outline'> = {
  OFFER_MATRIX: 'secondary',
  EMAIL_TEMPLATE: 'outline',
};

const SKELETON_KEYS = ['s0', 's1', 's2'];

function AttachmentsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {SKELETON_KEYS.map((key) => (
        <Card key={key} className="flex items-center gap-4 p-4">
          <Skeleton className="size-10 rounded-md" />
          <div className="flex flex-1 flex-col gap-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function AttachmentsTab({ matrixId }: AttachmentsTabProps) {
  const queryClient = useQueryClient();
  const { attachments, loading, error, refetch } = useMatrixAttachments(matrixId);
  const [addOpen, setAddOpen] = useState(false);

  const removeMutation = useMutation({
    mutationFn: (attachmentId: string) => deleteAttachment(matrixId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matrices.attachments(matrixId) });
      toast.success('Adjunto eliminado');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleDownload = async (att: MatrixAttachmentResponse) => {
    try {
      await downloadAttachment(matrixId, att.id, `${att.filename}.${att.fileExtension}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <AttachmentsSkeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Can permission="matrix_attachments.create">
          <Button onClick={() => setAddOpen(true)}>
            <Plus data-icon="inline-start" />
            Agregar adjunto
          </Button>
        </Can>
      </div>

      {attachments.length === 0 ? (
        <EmptyState title="Sin adjuntos" description="No hay archivos adjuntos en esta matriz" />
      ) : (
        <div className="flex flex-col gap-3">
          {attachments.map((att: MatrixAttachmentResponse) => (
            <Card key={att.id} className="flex items-center gap-4 p-4">
              <div className="flex size-10 items-center justify-center rounded-md bg-muted">
                <FileIcon className="size-5 text-muted-foreground" />
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {att.filename}.{att.fileExtension}
                  </span>
                  <Badge variant={ATTACHMENT_TYPE_VARIANT[att.attachmentType]}>
                    {ATTACHMENT_TYPE_LABEL[att.attachmentType]}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">
                  {att.fileSizeMb} MB · {att.uploadedBy.username} ·{' '}
                  {formatRelativeTime(att.uploadedAt)}
                </span>
                {att.description && (
                  <span className="text-xs text-muted-foreground">{att.description}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDownload(att)}
                  aria-label="Descargar"
                >
                  <Download className="size-4" />
                </Button>
                <Can permission="matrix_attachments.delete">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeMutation.mutate(att.id)}
                    disabled={removeMutation.isPending}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </Can>
              </div>
            </Card>
          ))}
        </div>
      )}

      <AddAttachmentDialog matrixId={matrixId} open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
