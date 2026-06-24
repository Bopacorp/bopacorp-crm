import type { NegotiationListItemResponse } from '@bopacorp/shared/crm';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileUp, Loader2, X } from 'lucide-react';
import { useCallback } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
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
import { ApiError } from '@/services/api.js';
import { getErrorMessage } from '@/shared/errors/index.js';
import { FormAlert } from '@/shared/ui';
import { createDocument, uploadDocument } from '../documentation.service.js';
import { useActiveDocumentTypes } from '../hooks/useDocumentTypes.js';

const MAX_FILE_SIZE_MB = 50;

const DocumentUploadSchema = z.object({
  negotiationId: z.string().uuid(),
  documentTypeId: z.string().uuid(),
  file: z
    .instanceof(File)
    .refine(
      (f) => f.size / (1024 * 1024) <= MAX_FILE_SIZE_MB,
      `El archivo no puede superar los ${MAX_FILE_SIZE_MB}MB`,
    ),
});

type FormValues = z.input<typeof DocumentUploadSchema>;

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  negotiationId?: string;
}

export function DocumentUploadDialog({
  open,
  onOpenChange,
  onSuccess,
  negotiationId: preselectedNegotiationId,
}: DocumentUploadDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(DocumentUploadSchema),
    defaultValues: {
      negotiationId: preselectedNegotiationId ?? '',
      documentTypeId: '',
      file: undefined as unknown as File,
    },
    mode: 'onTouched',
  });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = form;

  const file = watch('file');

  const documentTypes = useActiveDocumentTypes();
  const { data: negotiationsData } = useQuery({
    queryKey: ['negotiations', 'select'],
    queryFn: () => listNegotiations({ page: 1, limit: 100, sortOrder: 'asc' }),
    enabled: !preselectedNegotiationId,
  });
  const negotiations = (negotiationsData?.data ?? []) as NegotiationListItemResponse[];

  const forceClose = useCallback(() => {
    form.reset({
      negotiationId: preselectedNegotiationId ?? '',
      documentTypeId: '',
      file: undefined as unknown as File,
    });
    onOpenChange(false);
  }, [onOpenChange, preselectedNegotiationId, form]);

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const upload = await uploadDocument(data.file);
      await createDocument({
        negotiationId: data.negotiationId,
        documentTypeId: data.documentTypeId,
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
    onError: (err) => {
      if (err instanceof ApiError && err.details?.length) {
        for (const d of err.details) {
          setError(d.field as keyof FormValues, { type: 'server', message: d.message });
        }
        return;
      }
      setError('root', { type: 'server', message: getErrorMessage(err) });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setValue('file', selected, { shouldValidate: true });
  };

  const removeFile = () => {
    setValue('file', undefined as unknown as File);
    form.clearErrors('file');
  };

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subir documento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          {errors.root && <FormAlert message={errors.root.message ?? ''} />}

          <FieldGroup>
            {!preselectedNegotiationId && (
              <Field data-invalid={errors.negotiationId ? true : undefined}>
                <FieldLabel>Negociación</FieldLabel>
                <Controller
                  control={control}
                  name="negotiationId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
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
                  )}
                />
                <FieldError>{errors.negotiationId?.message}</FieldError>
              </Field>
            )}

            <Field data-invalid={errors.documentTypeId ? true : undefined}>
              <FieldLabel>Tipo de documento</FieldLabel>
              <Controller
                control={control}
                name="documentTypeId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
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
                )}
              />
              <FieldError>{errors.documentTypeId?.message}</FieldError>
            </Field>

            <Field data-invalid={errors.file ? true : undefined}>
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
                    onClick={removeFile}
                    aria-label="Quitar archivo"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              )}
              <FieldError>{errors.file?.message}</FieldError>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 data-icon="inline-start" className="animate-spin" />}
              Subir documento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
