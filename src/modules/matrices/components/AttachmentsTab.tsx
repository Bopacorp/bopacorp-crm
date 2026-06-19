import type { MatrixAttachmentResponse, MatrixState } from '@bopacorp/shared/matrices';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileIcon, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRelativeTime } from '@/lib/format.js';
import { queryKeys } from '@/lib/query-keys.js';
import { Can } from '@/modules/auth/components/Can.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { EmptyState, ErrorState } from '@/shared/ui';
import { useMatrixAttachments } from '../hooks/useMatrixAttachments.js';
import { deleteAttachment } from '../matrices.service.js';

interface AttachmentsTabProps {
  matrixId: string;
  matrixState: MatrixState;
}

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

export function AttachmentsTab({ matrixId, matrixState }: AttachmentsTabProps) {
  const queryClient = useQueryClient();
  const { attachments, loading, error, refetch } = useMatrixAttachments(matrixId);
  const isDraft = matrixState === 'DRAFT';

  const removeMutation = useMutation({
    mutationFn: (attachmentId: string) => deleteAttachment(matrixId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matrices.attachments(matrixId) });
      toast.success('Adjunto eliminado');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (loading) return <AttachmentsSkeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  if (attachments.length === 0) {
    return (
      <EmptyState title="Sin adjuntos" description="No hay archivos adjuntos en esta matriz" />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {attachments.map((att: MatrixAttachmentResponse) => (
        <Card key={att.id} className="flex items-center gap-4 p-4">
          <div className="flex size-10 items-center justify-center rounded-md bg-muted">
            <FileIcon className="size-5 text-muted-foreground" />
          </div>
          <div className="flex flex-1 flex-col gap-0.5">
            <span className="text-sm font-medium">
              {att.filename}.{att.fileExtension}
            </span>
            <span className="text-xs text-muted-foreground">
              {att.fileSizeMb} MB · {att.uploadedBy.username} · {formatRelativeTime(att.uploadedAt)}
            </span>
            {att.description && (
              <span className="text-xs text-muted-foreground">{att.description}</span>
            )}
          </div>
          {isDraft && (
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
          )}
        </Card>
      ))}
    </div>
  );
}
