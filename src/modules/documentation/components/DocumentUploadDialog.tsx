import type { NegotiationListItemResponse } from '@bopacorp/shared/crm';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileUp, Loader2, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { queryKeys } from '@/lib/query-keys.js';
import { listNegotiations } from '@/modules/negotiations/negotiations.service.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { FormAlert } from '@/shared/ui';
import { createDocument, uploadDocument } from '../documentation.service.js';
import { useActiveDocumentTypes } from '../hooks/useDocumentTypes.js';

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  negotiationId?: string;
}

const MAX_FILE_SIZE_MB = 50;

export function DocumentUploadDialog({
  open,
  onOpenChange,
  onSuccess,
  negotiationId: preselectedNegotiationId,
}: DocumentUploadDialogProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [negotiationId, setNegotiationId] = useState(preselectedNegotiationId ?? '');
  const [documentTypeId, setDocumentTypeId] = useState('');
  const [error, setError] = useState('');

  const documentTypes = useActiveDocumentTypes();
  const { data: negotiationsData } = useQuery({
    queryKey: ['negotiations', 'select'],
    queryFn: () => listNegotiations({ page: 1, limit: 100, sortOrder: 'asc' }),
    enabled: !preselectedNegotiationId,
  });
  const negotiations = (negotiationsData?.data ?? []) as NegotiationListItemResponse[];

  const forceClose = useCallback(() => {
    setFile(null);
    setNegotiationId(preselectedNegotiationId ?? '');
    setDocumentTypeId('');
    setError('');
    onOpenChange(false);
  }, [onOpenChange, preselectedNegotiationId]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Selecciona un archivo');
      if (!negotiationId) throw new Error('Selecciona una negociación');
      if (!documentTypeId) throw new Error('Selecciona un tipo de documento');

      const upload = await uploadDocument(file);
      await createDocument({
        negotiationId,
        documentTypeId,
        filename: upload.filename,
        fileExtension: upload.fileExtension,
        fileSizeMb: upload.fileSizeMb,
        storagePath: upload.storagePath,
        mimeType: upload.mimeType,
        encryptionMetadata: upload.encryptionMetadata,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
      toast.success('Documento subido');
      forceClose();
      onSuccess();
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.size / (1024 * 1024) > MAX_FILE_SIZE_MB) {
      setError(`El archivo no puede superar los ${MAX_FILE_SIZE_MB}MB`);
      return;
    }
    setError('');
    setFile(selected);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subir documento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <FormAlert message={error} />}

          <FieldGroup>
            {!preselectedNegotiationId && (
              <Field>
                <FieldLabel>Negociación</FieldLabel>
                <Select value={negotiationId} onValueChange={setNegotiationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar negociación" />
                  </SelectTrigger>
                  <SelectContent>
                    {negotiations.map((n) => (
                      <SelectItem key={n.id} value={n.id}>
                        {n.client.businessName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}

            <Field>
              <FieldLabel>Tipo de documento</FieldLabel>
              <Select value={documentTypeId} onValueChange={setDocumentTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Archivo</FieldLabel>
              {!file ? (
                <div className="border-border rounded-lg border border-dashed p-6">
                  <label
                    htmlFor="document-file"
                    className="flex cursor-pointer flex-col items-center gap-2"
                  >
                    <FileUp className="text-muted-foreground size-8" />
                    <span className="text-sm text-muted-foreground">
                      Haz clic para seleccionar un archivo
                    </span>
                  </label>
                  <Input
                    id="document-file"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm">{file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setFile(null)}
                    aria-label="Quitar archivo"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              )}
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || !file || !negotiationId || !documentTypeId}
            >
              {mutation.isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
              Subir documento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
