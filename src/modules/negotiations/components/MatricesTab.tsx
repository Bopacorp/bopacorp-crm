import type { AttachmentType, MatrixAttachmentResponse } from '@bopacorp/shared/matrices';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, FileIcon, FileSpreadsheet, Loader2, Mail, Pencil, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { formatRelativeTime } from '@/lib/format.js';
import { queryKeys } from '@/lib/query-keys.js';
import { Can } from '@/modules/auth/components/Can.js';
import { uploadDocument } from '@/modules/documentation/documentation.service.js';
import { useMatrices } from '@/modules/matrices/hooks/useMatrices.js';
import { useMatrix } from '@/modules/matrices/hooks/useMatrix.js';
import { useMatrixAttachments } from '@/modules/matrices/hooks/useMatrixAttachments.js';
import {
  createAttachment,
  createMatrix,
  deleteAttachment,
  downloadAttachment,
  updateMatrix,
} from '@/modules/matrices/matrices.service.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { ErrorState } from '@/shared/ui';

interface MatricesTabProps {
  negotiationId: string;
}

const SLOT_CONFIG: Record<
  AttachmentType,
  { label: string; icon: typeof FileSpreadsheet; accept: string; extensions: string[] }
> = {
  OFFER_MATRIX: {
    label: 'Excel de oferta',
    icon: FileSpreadsheet,
    accept: '.xlsx,.xls,.csv',
    extensions: ['xlsx', 'xls', 'csv'],
  },
  EMAIL_TEMPLATE: {
    label: 'Correo de respuesta',
    icon: Mail,
    accept: '.msg,.eml,.pdf,.html',
    extensions: ['msg', 'eml', 'pdf', 'html'],
  },
};

function MatricesSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function MatricesTab({ negotiationId }: MatricesTabProps) {
  const queryClient = useQueryClient();
  const { matrices, loading, error, refetch } = useMatrices(negotiationId);

  const createMutation = useMutation({
    mutationFn: () => createMatrix({ negotiationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matrices.all });
      toast.success('Matriz creada');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (loading) return <MatricesSkeleton />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  const matrix = matrices[0] ?? null;

  if (!matrix) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <FileSpreadsheet className="size-12 text-muted-foreground" />
        <div className="text-center">
          <p className="text-sm font-medium">Sin matriz de oferta</p>
          <p className="text-sm text-muted-foreground">
            Crea una matriz para gestionar los adjuntos de esta negociación
          </p>
        </div>
        <Can permission="offer_matrices.create">
          <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            {createMutation.isPending && (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            )}
            Crear matriz
          </Button>
        </Can>
      </div>
    );
  }

  return <MatrixContent matrixId={matrix.id} />;
}

interface MatrixContentProps {
  matrixId: string;
}

function MatrixContent({ matrixId }: MatrixContentProps) {
  const queryClient = useQueryClient();
  const { matrix, loading: matrixLoading } = useMatrix(matrixId);
  const {
    attachments,
    loading: attachmentsLoading,
    error,
    refetch,
  } = useMatrixAttachments(matrixId);
  const [editObsOpen, setEditObsOpen] = useState(false);

  if (matrixLoading) return <MatricesSkeleton />;

  const observations = matrix?.observations ?? '';
  const offerAttachment = attachments.find((a) => a.attachmentType === 'OFFER_MATRIX') ?? null;
  const emailAttachment = attachments.find((a) => a.attachmentType === 'EMAIL_TEMPLATE') ?? null;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Observaciones</CardTitle>
          <CardAction>
            <Can permission="offer_matrices.update">
              <Button variant="ghost" size="icon-sm" onClick={() => setEditObsOpen(true)}>
                <Pencil />
              </Button>
            </Can>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className={observations ? 'text-sm' : 'text-sm text-muted-foreground'}>
            {observations || 'Sin observaciones'}
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Adjuntos
        </span>
        {attachmentsLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={refetch} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <AttachmentSlot matrixId={matrixId} type="OFFER_MATRIX" attachment={offerAttachment} />
            <AttachmentSlot
              matrixId={matrixId}
              type="EMAIL_TEMPLATE"
              attachment={emailAttachment}
            />
          </div>
        )}
      </div>

      <EditObservationsDialog
        open={editObsOpen}
        onOpenChange={setEditObsOpen}
        matrixId={matrixId}
        initialValue={observations}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.matrices.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.matrices.detail(matrixId) });
        }}
      />
    </div>
  );
}

interface EditObservationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matrixId: string;
  initialValue: string;
  onSuccess: () => void;
}

function EditObservationsDialog({
  open,
  onOpenChange,
  matrixId,
  initialValue,
  onSuccess,
}: EditObservationsDialogProps) {
  const [obs, setObs] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  const handleOpenChange = (value: boolean) => {
    if (!value) setObs(initialValue);
    onOpenChange(value);
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateMatrix(matrixId, { observations: obs || undefined });
      toast.success('Observaciones guardadas');
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar observaciones</DialogTitle>
        </DialogHeader>
        <Textarea
          value={obs}
          onChange={(e) => setObs(e.target.value)}
          placeholder="Notas sobre esta matriz..."
          maxLength={1000}
          rows={5}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving || obs === initialValue}>
            {saving && <Loader2 data-icon="inline-start" className="animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AttachmentSlotProps {
  matrixId: string;
  type: AttachmentType;
  attachment: MatrixAttachmentResponse | null;
}

function AttachmentSlot({ matrixId, type, attachment }: AttachmentSlotProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const config = SLOT_CONFIG[type];
  const SlotIcon = config.icon;

  const deleteMutation = useMutation({
    mutationFn: (attachmentId: string) => deleteAttachment(matrixId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matrices.attachments(matrixId) });
      toast.success('Adjunto eliminado');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const upload = await uploadDocument(file);
      await createAttachment(matrixId, {
        matrixId,
        attachmentType: type,
        filename: upload.filename,
        fileExtension: upload.fileExtension,
        fileSizeMb: upload.fileSizeMb,
        storagePath: upload.storagePath,
        mimeType: upload.mimeType,
        encryptionMetadata: upload.encryptionMetadata,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.matrices.attachments(matrixId) });
      toast.success('Adjunto subido');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!config.extensions.includes(ext)) {
      toast.error(`Formato no permitido. Usa: ${config.extensions.join(', ')}`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    handleUpload(file);
  };

  const handleDownload = async (att: MatrixAttachmentResponse) => {
    try {
      await downloadAttachment(matrixId, att.id, `${att.filename}.${att.fileExtension}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {config.label}
      </span>
      {attachment ? (
        <Card className="flex min-h-28 flex-col justify-between gap-3 p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted">
              <FileIcon className="size-5 text-muted-foreground" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-medium">
                {attachment.filename}.{attachment.fileExtension}
              </span>
              <span className="text-xs text-muted-foreground">
                {attachment.fileSizeMb} MB · {attachment.uploadedBy.username}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(attachment.uploadedAt)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleDownload(attachment)}
              aria-label="Descargar"
            >
              <Download className="size-4" />
            </Button>
            <Can permission="matrix_attachments.delete">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => deleteMutation.mutate(attachment.id)}
                disabled={deleteMutation.isPending}
                aria-label="Eliminar"
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </Can>
          </div>
        </Card>
      ) : (
        <Can permission="matrix_attachments.create">
          <Card
            className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 border-dashed p-6 transition-colors hover:bg-muted/50"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            ) : (
              <SlotIcon className="size-8 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">
              {uploading ? 'Subiendo...' : `Subir ${config.label}`}
            </span>
            <Input
              ref={fileInputRef}
              type="file"
              accept={config.accept}
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </Card>
        </Can>
      )}
    </div>
  );
}
